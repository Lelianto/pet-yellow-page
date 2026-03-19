/**
 * Fix English city names in Firestore to proper Indonesian names.
 * Google Geocoding sometimes returns English names despite language=id.
 *
 * Usage: npx tsx scripts/fix-city-names.ts
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

// Mapping of English/wrong city names → correct Indonesian names
const CITY_FIXES: Record<string, string> = {
  "West Jakarta City": "Kota Jakarta Barat",
  "East Jakarta City": "Kota Jakarta Timur",
  "South Jakarta City": "Kota Jakarta Selatan",
  "North Jakarta City": "Kota Jakarta Utara",
  "Central Jakarta City": "Kota Jakarta Pusat",
  "West Jakarta": "Kota Jakarta Barat",
  "East Jakarta": "Kota Jakarta Timur",
  "South Jakarta": "Kota Jakarta Selatan",
  "North Jakarta": "Kota Jakarta Utara",
  "Central Jakarta": "Kota Jakarta Pusat",
  "Jakarta Barat": "Kota Jakarta Barat",
  "Jakarta Timur": "Kota Jakarta Timur",
  "Jakarta Selatan": "Kota Jakarta Selatan",
  "Jakarta Utara": "Kota Jakarta Utara",
  "Jakarta Pusat": "Kota Jakarta Pusat",
  "Tangerang City": "Kota Tangerang",
  "South Tangerang City": "Kota Tangerang Selatan",
  "Tangerang Regency": "Kabupaten Tangerang",
  "Bekasi City": "Kota Bekasi",
  "Bekasi Regency": "Kabupaten Bekasi",
  "Depok City": "Kota Depok",
  "Bogor City": "Kota Bogor",
  "Bogor Regency": "Kabupaten Bogor",
  "Bandung City": "Kota Bandung",
  "Bandung Regency": "Kabupaten Bandung",
  "Gianyar Regency": "Kabupaten Gianyar",
  "Badung Regency": "Kabupaten Badung",
  "Denpasar City": "Kota Denpasar",
  "Tabanan Regency": "Kabupaten Tabanan",
  "Surabaya City": "Kota Surabaya",
  "Sidoarjo Regency": "Kabupaten Sidoarjo",
  "Gresik Regency": "Kabupaten Gresik",
  "Semarang City": "Kota Semarang",
  "Semarang Regency": "Kabupaten Semarang",
  "Surakarta City": "Kota Surakarta",
  "Karanganyar Regency": "Kabupaten Karanganyar",
  "Medan City": "Kota Medan",
  "Deli Serdang Regency": "Kabupaten Deli Serdang",
  "Yogyakarta City": "Kota Yogyakarta",
  "Sleman Regency": "Kabupaten Sleman",
  "Bantul Regency": "Kabupaten Bantul",
  // Incomplete/wrong city names from geocoding
  "Surabaya": "Kota Surabaya",
  "Jakarta": "Kota Jakarta Pusat",
  "Bekasi": "Kota Bekasi",
  "Yogyakarta": "Kota Yogyakarta",
  "Sumatera Utara": "Kota Medan",
};

// Province fixes
const PROVINCE_FIXES: Record<string, string> = {
  "Special Capital Region Of Jakarta": "Daerah Khusus Ibukota Jakarta",
  "Dki Jakarta": "Daerah Khusus Ibukota Jakarta",
};

async function main() {
  console.log("Fixing English city/province names...\n");

  const snapshot = await db.collection("providers").get();
  let fixed = 0;

  const BATCH_LIMIT = 400;
  const updates: { id: string; data: Record<string, string> }[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const city = data.area_city as string | undefined;
    const province = data.area_province as string | undefined;
    const patch: Record<string, string> = {};

    if (city && CITY_FIXES[city]) {
      patch.area_city = CITY_FIXES[city];
    }
    if (province && PROVINCE_FIXES[province]) {
      patch.area_province = PROVINCE_FIXES[province];
    }

    if (Object.keys(patch).length > 0) {
      updates.push({ id: doc.id, data: patch });
      console.log(`  ${data.name}: ${city} → ${patch.area_city || city}${patch.area_province ? `, ${province} → ${patch.area_province}` : ""}`);
    }
  }

  if (updates.length === 0) {
    console.log("No fixes needed!");
    return;
  }

  console.log(`\nApplying ${updates.length} fixes...`);

  for (let i = 0; i < updates.length; i += BATCH_LIMIT) {
    const chunk = updates.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();
    for (const { id, data } of chunk) {
      batch.update(db.collection("providers").doc(id), data);
    }
    await batch.commit();
    fixed += chunk.length;
    console.log(`  Committed batch ${Math.floor(i / BATCH_LIMIT) + 1}`);
  }

  console.log(`\nDone! Fixed ${fixed} providers.`);
}

main().catch(console.error);
