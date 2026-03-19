/**
 * Create a dummy provider for testing.
 * Links to a Firebase Auth user by email.
 *
 * Usage: npx tsx scripts/create-dummy-provider.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

const app = initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth(app);
const db = getFirestore(app);

const TARGET_EMAIL = "lelianto.eko@gmail.com";

async function main() {
  // 1. Look up user by email
  let uid: string;
  try {
    const userRecord = await auth.getUserByEmail(TARGET_EMAIL);
    uid = userRecord.uid;
    console.log(`Found user: ${userRecord.displayName} (${uid})`);
  } catch (err) {
    console.error(`User with email ${TARGET_EMAIL} not found in Firebase Auth.`);
    console.error("Make sure you've logged in at least once via Google on the app.");
    process.exit(1);
  }

  // 2. Trial: 14 days from now
  const premiumUntil = new Date();
  premiumUntil.setDate(premiumUntil.getDate() + 14);

  const now = Timestamp.now();

  const provider = {
    name: "Paws & Claws Grooming Studio",
    category: "grooming",
    address: "Jl. Anggrek No. 12, Tangerang Selatan, Banten",
    whatsapp_number: "6281234567890",
    google_place_id: "",
    rating: 4.8,
    review_count: 24,
    is_verified: true,
    is_home_service: true,
    services: ["grooming", "hotel", "vaksin", "home_service"],
    location: { latitude: -6.2884, longitude: 106.7177 },
    description:
      "Studio grooming profesional untuk kucing dan anjing. Layanan mandi, potong bulu, spa, dan penitipan hewan.",
    business_status: "OPERATIONAL",
    area_city: "Kota Tangerang Selatan",
    area_province: "Banten",
    source: "organic",
    claim_status: "approved",
    owner_uid: uid,
    claimant_uid: uid,
    // Tier: Growth trial active
    tier: "growth",
    is_premium: true,
    premium_until: Timestamp.fromDate(premiumUntil),
    trial_used: true,
    tier_rank: 1,
    features_enabled: {
      booking: true,
      payments: false,
      crm: false,
    },
    // Payment settings (placeholder for when upgraded to Business)
    payment_settings: {
      bank_name: "BCA",
      account_number: "1234567890",
      account_holder: "Lelianto Eko Pradana",
      min_dp_amount: 50000,
      whatsapp_payment: "6281234567890",
    },
    reviews: [
      {
        author: "Rina S.",
        text: "Groomingnya bagus banget, kucing saya jadi wangi dan rapi. Recommended!",
        rating: 5,
        time: "sebulan lalu",
      },
      {
        author: "Budi P.",
        text: "Pelayanan ramah, anjing saya nyaman. Harga juga terjangkau.",
        rating: 5,
        time: "2 bulan lalu",
      },
      {
        author: "Maya L.",
        text: "Home service-nya sangat membantu, tidak perlu repot bawa hewan ke salon.",
        rating: 4,
        time: "3 bulan lalu",
      },
    ],
    created_at: now,
    updated_at: now,
  };

  const docRef = await db.collection("providers").add(provider);
  console.log(`\n✅ Dummy provider created!`);
  console.log(`   ID: ${docRef.id}`);
  console.log(`   Name: ${provider.name}`);
  console.log(`   Owner: ${TARGET_EMAIL} (${uid})`);
  console.log(`   Tier: Growth (trial 14 hari, sampai ${premiumUntil.toLocaleDateString("id-ID")})`);
  console.log(`   Booking: enabled`);
  console.log(`\n   Detail: http://localhost:3000/providers/${docRef.id}`);
  console.log(`   Dashboard: http://localhost:3000/dashboard/billing`);
  console.log(`   Bookings: http://localhost:3000/dashboard/bookings`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
