/**
 * Seed Firestore with pet service providers from Google Places API.
 *
 * Usage:
 *   npx tsx scripts/seed-from-google.ts [area]             # single city (default: Bandung)
 *   npx tsx scripts/seed-from-google.ts --all              # all 514 regencies
 *   npx tsx scripts/seed-from-google.ts --capitals         # 35 provincial capitals only
 *   npx tsx scripts/seed-from-google.ts --cities scripts/top-40-cities.json  # custom city list
 *   npx tsx scripts/seed-from-google.ts --capitals --from "Kota Surabaya"  # resume
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "fs";
import { join } from "path";
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

const SEARCH_TEMPLATES = [
  "pet grooming",
  "dokter hewan",
  "pet hotel",
  "pet shop",
  "pet sitter",
  "jasa titip hewan peliharaan",
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
    if (svc.keywords.some((kw) => allText.includes(kw))) {
      found.add(svc.id);
      continue;
    }
    if (svc.googleTypes?.some((t) => types.includes(t))) {
      found.add(svc.id);
    }
  }

  return Array.from(found);
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
    console.error(`    Places API error for "${query}": ${res.status} ${await res.text()}`);
    return [];
  }

  const data = await res.json();
  return data.places || [];
}

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
    console.error(`    Place Details error for ${placeId}: ${res.status}`);
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

// ── Seed one area ───────────────────────────────────────────────────
async function seedArea(area: string, areaCity: string): Promise<number> {
  const placeIdToCategory = new Map<string, string>();

  for (const template of SEARCH_TEMPLATES) {
    const query = `${template} ${area}`;
    const places = await searchPlaces(query);

    const category = inferCategory(query);
    for (const place of places) {
      if (!placeIdToCategory.has(place.id)) {
        placeIdToCategory.set(place.id, category);
      }
    }

    // Small delay between searches
    await new Promise((r) => setTimeout(r, 50));
  }

  if (placeIdToCategory.size === 0) return 0;

  let saved = 0;

  for (const [placeId, category] of placeIdToCategory) {
    const place = await getPlaceDetails(placeId);
    if (!place) continue;

    const name = place.displayName?.text || "Unknown";
    const types = place.types || [];
    const reviewTexts = (place.reviews || [])
      .map((r) => r.text?.text || "")
      .filter(Boolean);

    const services = detectServices(name, types, reviewTexts, place.editorialSummary?.text);
    const isHomeService = services.includes("home_service");

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
      area_city: areaCity,
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

    console.log(`    ✓ ${name} (${category})${svcLabels ? ` — ${svcLabels}` : ""}`);
    saved++;

    await new Promise((r) => setTimeout(r, 100));
  }

  return saved;
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const isAll = args.includes("--all");
  const isCapitals = args.includes("--capitals");
  const citiesIdx = args.indexOf("--cities");
  const customCitiesFile = citiesIdx !== -1 ? args[citiesIdx + 1] : null;
  const fromIdx = args.indexOf("--from");
  const fromCity = fromIdx !== -1 ? args[fromIdx + 1] : null;

  if (isAll || isCapitals || customCitiesFile) {
    // Load city list
    let filePath: string;
    if (customCitiesFile) {
      filePath = join(process.cwd(), customCitiesFile);
    } else if (isCapitals) {
      filePath = join(process.cwd(), "scripts", "capital-cities.json");
    } else {
      filePath = join(process.cwd(), "public", "data", "wilayah", "all-regencies.json");
    }
    const allRegencies: string[] = JSON.parse(readFileSync(filePath, "utf8"));

    let startIdx = 0;
    if (fromCity) {
      startIdx = allRegencies.findIndex((r) => r === fromCity);
      if (startIdx === -1) {
        console.error(`City "${fromCity}" not found in all-regencies.json`);
        process.exit(1);
      }
      console.log(`Resuming from: ${fromCity} (index ${startIdx}/${allRegencies.length})\n`);
    }

    const label = customCitiesFile ? "custom cities" : isCapitals ? "capital cities" : "regencies";
    console.log(`Seeding ${allRegencies.length} ${label} (starting from index ${startIdx})...\n`);

    let grandTotal = 0;

    for (let i = startIdx; i < allRegencies.length; i++) {
      const regency = allRegencies[i];
      // Strip "Kabupaten "/"Kota " prefix for search query (better Google results)
      const searchName = regency.replace(/^(Kabupaten|Kota)\s+/i, "");

      console.log(`[${i + 1}/${allRegencies.length}] ${regency} (searching "${searchName}")...`);

      const saved = await seedArea(searchName, regency);
      grandTotal += saved;

      console.log(`  → ${saved} providers saved\n`);

      // Delay between cities to stay within rate limits
      await new Promise((r) => setTimeout(r, 200));
    }

    console.log(`\nAll done! Total: ${grandTotal} providers across ${allRegencies.length} ${label}.`);
  } else {
    // Single area mode
    const area = args[0] || "Bandung";
    console.log(`Seeding providers for area: ${area}\n`);
    const saved = await seedArea(area, area);
    console.log(`\nDone! Saved ${saved} providers to Firestore.`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
