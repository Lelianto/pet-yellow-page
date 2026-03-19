import { config } from "dotenv";
config({ path: ".env.local" });

import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const sa: ServiceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};
const app = getApps().length > 0 ? getApps()[0] : initializeApp({ credential: cert(sa) });
const db = getFirestore(app);

async function main() {
  const snap = await db.collection("providers").select("area_city").get();
  const cities = new Map<string, number>();
  snap.docs.forEach((d) => {
    const c = d.data().area_city as string | undefined;
    if (c) cities.set(c, (cities.get(c) || 0) + 1);
  });
  console.log(`\nTotal: ${snap.size} providers, ${cities.size} cities\n`);
  [...cities.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([c, n]) => console.log(`${String(n).padStart(4)}  ${c}`));
}

main().catch(console.error);
