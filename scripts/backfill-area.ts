/**
 * Backfill structured area fields (area_province, area_city, area_district, area_village)
 * for existing providers using Google Maps Reverse Geocoding API.
 *
 * Only processes providers that have lat/lng but are missing area_city.
 *
 * Usage:
 *   npx tsx scripts/backfill-area.ts
 *
 * Requires env vars: GOOGLE_MAPS_API_KEY, FIREBASE_ADMIN_PROJECT_ID,
 *   FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY) {
  console.error("Missing GOOGLE_MAPS_API_KEY");
  process.exit(1);
}

interface GeoResult {
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Extract structured area from Google Geocoding address_components.
 *
 * Google returns these relevant types for Indonesian addresses:
 *   - administrative_area_level_1 → Province (Provinsi)
 *   - administrative_area_level_2 → City/Regency (Kota/Kabupaten)
 *   - administrative_area_level_3 → District (Kecamatan)
 *   - administrative_area_level_4 → Village (Kelurahan/Desa)
 */
function extractArea(components: GeoResult["address_components"]) {
  const find = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name;

  const province = find("administrative_area_level_1");
  const city = find("administrative_area_level_2");
  const district = find("administrative_area_level_3");
  const village = find("administrative_area_level_4");

  return { province, city, district, village };
}

async function reverseGeocode(lat: number, lng: number): Promise<GeoResult | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=id&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !data.results?.length) {
    return null;
  }
  return data.results[0];
}

async function main() {
  console.log("Backfilling area fields for existing providers...\n");

  const snapshot = await db.collection("providers").get();
  const providers = snapshot.docs.filter((doc) => {
    const data = doc.data();
    // Only process if has coordinates but missing area_city
    const loc = data.location as { latitude?: number; longitude?: number } | undefined;
    return loc?.latitude && loc?.longitude && !data.area_city;
  });

  console.log(`Found ${providers.length} providers to backfill (of ${snapshot.size} total)\n`);

  let updated = 0;
  let failed = 0;

  for (const doc of providers) {
    const data = doc.data();
    const loc = data.location as { latitude: number; longitude: number };

    try {
      const result = await reverseGeocode(loc.latitude, loc.longitude);
      if (!result) {
        console.log(`  SKIP ${data.name} — no geocoding result`);
        failed++;
        continue;
      }

      const area = extractArea(result.address_components);

      if (!area.city) {
        console.log(`  SKIP ${data.name} — could not extract city`);
        failed++;
        continue;
      }

      const updates: Record<string, string | null> = {
        area_province: area.province ? titleCase(area.province) : null,
        area_city: titleCase(area.city),
        area_district: area.district ? titleCase(area.district) : null,
        area_village: area.village ? titleCase(area.village) : null,
      };

      await db.collection("providers").doc(doc.id).update(updates);
      updated++;
      console.log(`  OK ${data.name} → ${updates.area_district || "?"}, ${updates.area_city}, ${updates.area_province || "?"}`);

      // Rate limit: ~10 req/s to avoid Google API quota issues
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      console.error(`  ERR ${data.name}:`, err);
      failed++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Failed: ${failed}`);
}

main().catch(console.error);
