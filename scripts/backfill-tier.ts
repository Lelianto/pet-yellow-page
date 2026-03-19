/**
 * Backfill tier fields for existing providers that were seeded before the tier system.
 * Sets tier_rank=0, tier="basic", is_premium=false, trial_used=false.
 *
 * Usage: npx tsx scripts/backfill-tier.ts
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

async function main() {
  console.log("Backfilling tier fields for providers missing tier_rank...\n");

  const snapshot = await db.collection("providers").get();
  const toUpdate = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return data.tier_rank === undefined || data.tier_rank === null;
  });

  console.log(`Found ${toUpdate.length} providers to backfill (of ${snapshot.size} total)\n`);

  const batch = db.batch();
  for (const doc of toUpdate) {
    batch.update(doc.ref, {
      tier: "basic",
      tier_rank: 0,
      is_premium: false,
      trial_used: false,
    });
  }

  await batch.commit();
  console.log(`Done! Updated ${toUpdate.length} providers.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
