/**
 * Build homepage cache document in Firestore (meta/homepage).
 * Called during prebuild and after seeding.
 *
 * Usage: npx tsx scripts/build-homepage-cache.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

// We can't use path aliases in scripts, so init Firebase Admin directly
import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

const app = getApps().length > 0
  ? getApps()[0]
  : initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

// Inline the Indonesian detection + cache build logic (can't use path aliases in scripts)
const ID_MARKERS = [
  "yang", "dan", "dengan", "untuk", "sangat", "banget", "sekali",
  "bagus", "baik", "pelayanan", "tempat", "hewan", "kucing", "anjing",
  "ramah", "bersih", "nyaman", "murah", "mahal", "saya", "kami",
  "disini", "di sini", "recommended", "rekomen", "klinik", "dokter",
  "perawatan", "grooming", "puas", "mantap", "oke", "sudah", "lagi",
  "nya", "keren", "cepat", "anak", "obat", "sakit", "sehat",
];

function isIndonesian(text: string): boolean {
  const lower = text.toLowerCase();
  let matches = 0;
  for (const word of ID_MARKERS) {
    if (lower.includes(word)) matches++;
    if (matches >= 2) return true;
  }
  return false;
}

interface ProviderReview {
  author: string;
  text: string;
  text_id?: string;
  rating: number;
  time: string;
}

interface TopReview {
  author: string;
  text: string;
  rating: number;
  providerName: string;
  providerCategory: string;
}

async function main() {
  console.log("Building homepage cache...\n");

  const snapshot = await db.collection("providers").get();
  console.log(`Scanning ${snapshot.size} providers...`);

  const cityCount = new Map<string, number>();
  let totalReviews = 0;
  let verifiedProviders = 0;
  const allReviews: TopReview[] = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    totalReviews += (data.review_count as number) || 0;
    if (data.is_verified) verifiedProviders++;

    const city = data.area_city as string | undefined;
    if (city) cityCount.set(city, (cityCount.get(city) || 0) + 1);

    const providerReviews = data.reviews as ProviderReview[] | undefined;
    if (providerReviews) {
      for (const review of providerReviews) {
        let displayText: string | undefined;
        if (review.text_id) {
          displayText = review.text_id;
        } else if (review.text && isIndonesian(review.text)) {
          displayText = review.text;
        }

        if (review.rating >= 4 && displayText && displayText.length > 20) {
          allReviews.push({
            author: review.author,
            text: displayText,
            rating: review.rating,
            providerName: data.name as string,
            providerCategory: data.category as string,
          });
        }
      }
    }
  });

  const cities = Array.from(cityCount.keys()).sort((a, b) => a.localeCompare(b));
  const topCities = Array.from(cityCount.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  allReviews.sort(() => Math.random() - 0.5);
  const topReviews = allReviews.slice(0, 8);

  const cache = {
    cities,
    stats: {
      totalProviders: snapshot.size,
      totalReviews,
      totalCities: cityCount.size,
      verifiedProviders,
    },
    topCities,
    topReviews,
    updatedAt: new Date().toISOString(),
  };

  await db.collection("meta").doc("homepage").set(cache);

  console.log(`\nHomepage cache written to meta/homepage:`);
  console.log(`  Providers: ${cache.stats.totalProviders}`);
  console.log(`  Reviews: ${cache.stats.totalReviews}`);
  console.log(`  Cities: ${cache.stats.totalCities}`);
  console.log(`  Verified: ${cache.stats.verifiedProviders}`);
  console.log(`  Top cities: ${topCities.map((c) => `${c.name} (${c.count})`).join(", ")}`);
  console.log(`  Top reviews: ${topReviews.length}`);
}

main().catch((err) => {
  // Don't fail the build if Firestore quota is exhausted or unavailable
  // The homepage will use existing cache or show fallback data
  console.warn("Warning: Could not build homepage cache:", err.message || err);
  console.warn("Build will continue — homepage will use existing cache if available.");
  process.exit(0);
});
