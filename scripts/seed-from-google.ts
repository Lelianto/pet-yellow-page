/**
 * Seed Firestore with pet service providers from Google Places API.
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=xxx FIREBASE_ADMIN_PROJECT_ID=xxx \
 *   FIREBASE_ADMIN_CLIENT_EMAIL=xxx FIREBASE_ADMIN_PRIVATE_KEY=xxx \
 *   npx tsx scripts/seed-from-google.ts [area]
 *
 * Default area: "Bandung" — pass a different city/area as the first argument.
 */

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, GeoPoint, Timestamp } from "firebase-admin/firestore";

// ── Firebase Admin init ─────────────────────────────────────────────
const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

// ── Config ──────────────────────────────────────────────────────────
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY) {
  console.error("Missing GOOGLE_MAPS_API_KEY");
  process.exit(1);
}

const AREA = process.argv[2] || "Bandung";

const SEARCH_QUERIES = [
  `pet grooming ${AREA}`,
  `dokter hewan ${AREA}`,
  `pet hotel ${AREA}`,
  `pet shop ${AREA}`,
];

const QUERY_TO_CATEGORY: Record<string, string> = {
  grooming: "grooming",
  "dokter hewan": "vet",
  hotel: "hotel",
  shop: "petshop",
};

function inferCategory(query: string): string {
  for (const [keyword, category] of Object.entries(QUERY_TO_CATEGORY)) {
    if (query.toLowerCase().includes(keyword)) return category;
  }
  return "petshop";
}

// ── Google Places Text Search (New) ─────────────────────────────────
interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  location?: { latitude: number; longitude: number };
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  photos?: { name: string }[];
}

async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const url = "https://places.googleapis.com/v1/places:searchText";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY!,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.rating,places.location,places.internationalPhoneNumber,places.nationalPhoneNumber,places.photos",
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "id",
      maxResultCount: 20,
    }),
  });

  if (!res.ok) {
    console.error(`Places API error for "${query}": ${res.status} ${await res.text()}`);
    return [];
  }

  const data = await res.json();
  return data.places || [];
}

function phoneToWhatsApp(phone?: string): string {
  if (!phone) return "";
  // Strip non-digits, convert leading 0 to 62
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  if (!digits.startsWith("62")) digits = "62" + digits;
  return digits;
}

function getPhotoUrl(photos?: { name: string }[]): string | undefined {
  if (!photos || photos.length === 0) return undefined;
  // Google Places (New) photo reference format
  return `https://places.googleapis.com/v1/${photos[0].name}/media?maxWidthPx=400&key=${API_KEY}`;
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log(`Seeding providers for area: ${AREA}\n`);

  const seenPlaceIds = new Set<string>();
  let totalSaved = 0;

  for (const query of SEARCH_QUERIES) {
    console.log(`Searching: "${query}"...`);
    const places = await searchPlaces(query);
    console.log(`  Found ${places.length} results`);

    const category = inferCategory(query);

    for (const place of places) {
      if (seenPlaceIds.has(place.id)) continue;
      seenPlaceIds.add(place.id);

      const now = Timestamp.now();
      const doc = {
        name: place.displayName?.text || "Unknown",
        category,
        address: place.formattedAddress || "",
        whatsapp_number: phoneToWhatsApp(
          place.internationalPhoneNumber || place.nationalPhoneNumber
        ),
        google_place_id: place.id,
        rating: place.rating || 0,
        is_verified: false,
        is_home_service: false,
        location: new GeoPoint(
          place.location?.latitude || 0,
          place.location?.longitude || 0
        ),
        photo_url: getPhotoUrl(place.photos),
        created_at: now,
        updated_at: now,
      };

      await db.collection("providers").doc(place.id).set(doc, { merge: true });
      console.log(`  + ${doc.name} (${category})`);
      totalSaved++;
    }
  }

  console.log(`\nDone! Saved ${totalSaved} providers to Firestore.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
