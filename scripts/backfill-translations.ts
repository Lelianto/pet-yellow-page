/**
 * One-time script: translate all non-Indonesian reviews to Indonesian
 * and save as `text_id` in Firestore so the app never hits Translation API at runtime.
 *
 * Usage: npx tsx scripts/backfill-translations.ts
 *
 * Requires:
 *   - GOOGLE_MAPS_API_KEY in .env.local (with Cloud Translation API enabled)
 *   - Firebase Admin credentials in .env.local
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_MAPS_API_KEY!;

function isLikelyIndonesian(text: string): boolean {
  const lower = text.toLowerCase();
  const idWords = [
    "yang", "dan", "di", "ini", "itu", "dengan", "untuk", "dari",
    "sangat", "bagus", "baik", "ramah", "bersih", "hewan", "kucing",
    "anjing", "dokter", "pelayanan", "pemilik", "tempat", "sekali",
    "banget", "mantap", "rekomen", "suka", "bisa",
    "sudah", "juga", "tidak", "nya", "kami", "saya", "aku",
  ];
  return idWords.filter((w) => lower.includes(w)).length >= 2;
}

async function translateBatch(texts: string[]): Promise<string[]> {
  if (texts.length === 0) return [];

  // Google Translate API v2 supports max ~128 segments per request
  const BATCH_SIZE = 100;
  const results: string[] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: batch, target: "id" }),
      },
    );
    const data = await res.json();

    if (data.error) {
      console.error("Translation API error:", data.error.message);
      process.exit(1);
    }

    const translations = data.data?.translations as { translatedText: string }[];
    for (let j = 0; j < batch.length; j++) {
      results.push(translations?.[j]?.translatedText || batch[j]);
    }

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return results;
}

interface ReviewData {
  author: string;
  text: string;
  text_id?: string;
  rating: number;
  time: string;
}

async function main() {
  console.log("Fetching providers with reviews...\n");

  const snapshot = await db.collection("providers").get();
  let totalReviews = 0;
  let alreadyTranslated = 0;
  let alreadyIndonesian = 0;
  let toTranslate = 0;

  // First pass: collect all texts that need translation
  const providerUpdates: { docId: string; reviews: ReviewData[] }[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const reviews = data.reviews as ReviewData[] | undefined;
    if (!reviews || reviews.length === 0) continue;

    let needsUpdate = false;
    const updatedReviews: ReviewData[] = [];

    for (const review of reviews) {
      totalReviews++;

      const textIsId = review.text && isLikelyIndonesian(review.text);
      const hasTranslation = !!review.text_id;

      if (!review.text || review.text.trim().length === 0) {
        // No text to translate — skip
        alreadyTranslated++;
        updatedReviews.push(review);
      } else if (textIsId) {
        // Original text is already Indonesian
        if (review.text_id) {
          alreadyTranslated++;
          updatedReviews.push(review);
        } else {
          alreadyIndonesian++;
          updatedReviews.push({ ...review, text_id: review.text });
          needsUpdate = true;
        }
      } else if (hasTranslation) {
        // Has translation (text_id differs from text) — trust Google Translate result
        alreadyTranslated++;
        updatedReviews.push(review);
      } else {
        // Needs translation: no text_id or text_id === text (failed previous run)
        toTranslate++;
        updatedReviews.push({ ...review, text_id: undefined });
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      providerUpdates.push({ docId: doc.id, reviews: updatedReviews });
    }
  }

  console.log(`Total reviews: ${totalReviews}`);
  console.log(`Already translated: ${alreadyTranslated}`);
  console.log(`Already Indonesian: ${alreadyIndonesian}`);
  console.log(`Need translation: ${toTranslate}\n`);

  if (toTranslate === 0) {
    console.log("Nothing to translate. Done!");
    return;
  }

  // Collect all texts needing translation
  const textsToTranslate: string[] = [];
  const indices: { provIdx: number; revIdx: number }[] = [];

  for (let p = 0; p < providerUpdates.length; p++) {
    const { reviews } = providerUpdates[p];
    for (let r = 0; r < reviews.length; r++) {
      if (!reviews[r].text_id && reviews[r].text && !isLikelyIndonesian(reviews[r].text)) {
        textsToTranslate.push(reviews[r].text);
        indices.push({ provIdx: p, revIdx: r });
      }
    }
  }

  console.log(`Translating ${textsToTranslate.length} reviews...`);
  const translated = await translateBatch(textsToTranslate);

  // Map translations back
  for (let i = 0; i < indices.length; i++) {
    const { provIdx, revIdx } = indices[i];
    providerUpdates[provIdx].reviews[revIdx].text_id = translated[i];
  }

  // Write back to Firestore — strip undefined values
  console.log(`\nWriting updates to ${providerUpdates.length} providers...`);

  // Firestore batch limit is 500, split if needed
  const BATCH_LIMIT = 400;
  for (let i = 0; i < providerUpdates.length; i += BATCH_LIMIT) {
    const chunk = providerUpdates.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();

    for (const { docId, reviews } of chunk) {
      // Remove undefined text_id to avoid Firestore error
      const cleanReviews = reviews.map((r) => {
        const clean: Record<string, unknown> = { author: r.author, text: r.text, rating: r.rating, time: r.time };
        if (r.text_id !== undefined) clean.text_id = r.text_id;
        return clean;
      });
      batch.update(db.collection("providers").doc(docId), { reviews: cleanReviews });
    }

    await batch.commit();
    console.log(`  Committed batch ${Math.floor(i / BATCH_LIMIT) + 1}`);
  }

  console.log("Done! All reviews now have text_id field.");
}

main().catch(console.error);
