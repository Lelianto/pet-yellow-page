/**
 * Seed Firestore with pet service providers from Google Places API.
 *
 * Phase 1: Search places by text query
 * Phase 2: Fetch detailed info per place (reviews, types, editorial_summary)
 * Phase 3: Extract services from reviews + name + types
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=xxx FIREBASE_ADMIN_PROJECT_ID=xxx \
 *   FIREBASE_ADMIN_CLIENT_EMAIL=xxx FIREBASE_ADMIN_PRIVATE_KEY=xxx \
 *   npx tsx scripts/seed-from-google.ts [area]
 *
 * Default area: "Bandung" — pass a different city/area as the first argument.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

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
  `pet sitter ${AREA}`,
  `jasa titip hewan peliharaan ${AREA}`,
];

const QUERY_TO_CATEGORY: Record<string, string> = {
  grooming: "grooming",
  "dokter hewan": "vet",
  hotel: "hotel",
  shop: "petshop",
  sitter: "sitter",
  "titip hewan": "sitter",
};

function inferCategory(query: string): string {
  for (const [keyword, category] of Object.entries(QUERY_TO_CATEGORY)) {
    if (query.toLowerCase().includes(keyword)) return category;
  }
  return "petshop";
}

// ── Service detection ───────────────────────────────────────────────
interface ServiceDef {
  id: string;
  label: string;
  emoji: string;
  keywords: string[];
  googleTypes?: string[];
}

const SERVICE_DEFS: ServiceDef[] = [
  {
    id: "grooming",
    label: "Grooming",
    emoji: "✂️",
    keywords: ["grooming", "groom", "mandi", "potong bulu", "cukur", "salon", "spa", "bath", "trimming"],
  },
  {
    id: "vet",
    label: "Dokter Hewan",
    emoji: "🩺",
    keywords: ["dokter hewan", "drh", "klinik hewan", "vet", "veterinary", "praktek dokter", "pdhb", "konsultasi"],
    googleTypes: ["veterinary_care"],
  },
  {
    id: "vaksin",
    label: "Vaksinasi",
    emoji: "💉",
    keywords: ["vaksin", "vaksinasi", "vaccination", "f3", "f4"],
  },
  {
    id: "steril",
    label: "Sterilisasi",
    emoji: "🏥",
    keywords: ["steril", "sterilisasi", "kastrasi", "spay", "neuter", "kebiri"],
  },
  {
    id: "operasi",
    label: "Operasi",
    emoji: "⚕️",
    keywords: ["operasi", "bedah", "surgery", "surgical"],
  },
  {
    id: "hotel",
    label: "Penitipan",
    emoji: "🏨",
    keywords: ["hotel", "penitipan", "titip", "boarding", "penginapan", "cat hotel", "pet hotel", "stay"],
  },
  {
    id: "daycare",
    label: "Daycare",
    emoji: "🐾",
    keywords: ["daycare", "day care", "penitipan harian"],
  },
  {
    id: "petshop",
    label: "Pet Shop",
    emoji: "🛍️",
    keywords: ["pet shop", "petshop", "toko", "store", "mart", "aksesoris", "makanan", "pakan"],
    googleTypes: ["pet_store"],
  },
  {
    id: "home_service",
    label: "Home Service",
    emoji: "🚗",
    keywords: [
      "home service", "home care", "panggilan", "ke rumah", "antar jemput",
      "mobile", "house call", "datang ke rumah", "jemput",
    ],
  },
  {
    id: "transport",
    label: "Pet Transport",
    emoji: "🚐",
    keywords: ["transport", "antar", "kirim", "pengiriman", "delivery"],
  },
];

function detectServices(
  name: string,
  types: string[],
  reviewTexts: string[],
  editorialSummary?: string,
): string[] {
  const allText = [
    name,
    editorialSummary || "",
    ...reviewTexts,
  ].join(" ").toLowerCase();

  const found = new Set<string>();

  for (const svc of SERVICE_DEFS) {
    // Check keywords in combined text
    if (svc.keywords.some((kw) => allText.includes(kw))) {
      found.add(svc.id);
      continue;
    }
    // Check Google types
    if (svc.googleTypes?.some((t) => types.includes(t))) {
      found.add(svc.id);
    }
  }

  return Array.from(found);
}

function detectHomeService(services: string[]): boolean {
  return services.includes("home_service");
}

// ── Google Places API (New) ─────────────────────────────────────────
interface OpeningHoursPeriod {
  open: { day: number; hour: number; minute: number };
  close: { day: number; hour: number; minute: number };
}

interface Review {
  text?: { text: string };
  rating?: number;
  relativePublishTimeDescription?: string;
  authorAttribution?: { displayName: string };
}

interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude: number; longitude: number };
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  photos?: { name: string }[];
  websiteUri?: string;
  googleMapsUri?: string;
  editorialSummary?: { text: string };
  regularOpeningHours?: {
    periods?: OpeningHoursPeriod[];
    weekdayDescriptions?: string[];
  };
  businessStatus?: string;
  types?: string[];
  reviews?: Review[];
}

// Phase 1: Text search to get place IDs
async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const url = "https://places.googleapis.com/v1/places:searchText";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY!,
      "X-Goog-FieldMask": "places.id",
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

// Phase 2: Fetch full details per place
async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": API_KEY!,
      "X-Goog-FieldMask": [
        "id",
        "displayName",
        "formattedAddress",
        "rating",
        "userRatingCount",
        "location",
        "internationalPhoneNumber",
        "nationalPhoneNumber",
        "photos",
        "websiteUri",
        "googleMapsUri",
        "editorialSummary",
        "regularOpeningHours",
        "businessStatus",
        "types",
        "reviews",
      ].join(","),
    },
  });

  if (!res.ok) {
    console.error(`  Place Details error for ${placeId}: ${res.status}`);
    return null;
  }

  return res.json();
}

function phoneToWhatsApp(phone?: string): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  if (!digits.startsWith("62")) digits = "62" + digits;
  return digits;
}

function getPhotoUrl(photos?: { name: string }[]): string | undefined {
  if (!photos || photos.length === 0) return undefined;
  return `https://places.googleapis.com/v1/${photos[0].name}/media?maxWidthPx=400&key=${API_KEY}`;
}

function formatOpeningHours(periods?: OpeningHoursPeriod[]) {
  if (!periods || periods.length === 0) return undefined;
  return periods
    .filter((p) => p.open && p.close)
    .map((p) => ({
      day: p.open.day,
      open: `${String(p.open.hour).padStart(2, "0")}:${String(p.open.minute).padStart(2, "0")}`,
      close: `${String(p.close.hour).padStart(2, "0")}:${String(p.close.minute).padStart(2, "0")}`,
    }));
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log(`Seeding providers for area: ${AREA}`);
  console.log(`Phase 1: Searching places...\n`);

  // Phase 1: Collect all unique place IDs
  const placeIdToCategory = new Map<string, string>();

  for (const query of SEARCH_QUERIES) {
    console.log(`Searching: "${query}"...`);
    const places = await searchPlaces(query);
    console.log(`  Found ${places.length} results`);

    const category = inferCategory(query);
    for (const place of places) {
      if (!placeIdToCategory.has(place.id)) {
        placeIdToCategory.set(place.id, category);
      }
    }
  }

  console.log(`\nPhase 2: Fetching details for ${placeIdToCategory.size} unique places...\n`);

  // Phase 2 & 3: Fetch details and extract services
  let totalSaved = 0;

  for (const [placeId, category] of placeIdToCategory) {
    const place = await getPlaceDetails(placeId);
    if (!place) continue;

    const name = place.displayName?.text || "Unknown";
    const types = place.types || [];
    const reviewTexts = (place.reviews || [])
      .map((r) => r.text?.text || "")
      .filter(Boolean);

    // Phase 3: Extract services
    const services = detectServices(name, types, reviewTexts, place.editorialSummary?.text);
    const isHomeService = detectHomeService(services);

    const now = Timestamp.now();
    const doc: Record<string, unknown> = {
      name,
      category,
      address: place.formattedAddress || "",
      whatsapp_number: phoneToWhatsApp(
        place.internationalPhoneNumber || place.nationalPhoneNumber
      ),
      google_place_id: placeId,
      rating: place.rating || 0,
      review_count: place.userRatingCount || 0,
      is_verified: false,
      is_home_service: isHomeService,
      services,
      location: new GeoPoint(
        place.location?.latitude || 0,
        place.location?.longitude || 0
      ),
      created_at: now,
      updated_at: now,
    };

    const photoUrl = getPhotoUrl(place.photos);
    if (photoUrl) doc.photo_url = photoUrl;

    if (place.editorialSummary?.text) {
      doc.description = place.editorialSummary.text;
    }
    if (place.websiteUri) {
      doc.website = place.websiteUri;
    }
    if (place.googleMapsUri) {
      doc.google_maps_uri = place.googleMapsUri;
    }
    if (place.regularOpeningHours?.weekdayDescriptions) {
      doc.opening_hours_text = place.regularOpeningHours.weekdayDescriptions;
    }
    if (place.regularOpeningHours?.periods) {
      doc.opening_hours = formatOpeningHours(place.regularOpeningHours.periods);
    }
    if (place.businessStatus) {
      doc.business_status = place.businessStatus;
    }

    // Store top reviews (max 5)
    if (place.reviews && place.reviews.length > 0) {
      doc.reviews = place.reviews.slice(0, 5).map((r) => ({
        author: r.authorAttribution?.displayName || "Anonim",
        text: r.text?.text || "",
        rating: r.rating || 0,
        time: r.relativePublishTimeDescription || "",
      }));
    }

    await db.collection("providers").doc(placeId).set(doc, { merge: true });

    const svcLabels = services
      .map((s) => SERVICE_DEFS.find((d) => d.id === s))
      .filter(Boolean)
      .map((d) => `${d!.emoji} ${d!.label}`)
      .join(", ");

    console.log(`  ✓ ${name} (${category})`);
    if (svcLabels) console.log(`    Layanan: ${svcLabels}`);
    totalSaved++;

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\nDone! Saved ${totalSaved} providers to Firestore.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
