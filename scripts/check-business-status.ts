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
  const snap = await db.collection("providers").select("name", "business_status").get();
  const statusMap = new Map<string, number>();
  const closed: string[] = [];

  snap.docs.forEach((d) => {
    const data = d.data();
    const status = (data.business_status as string) || "(tidak ada data)";
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
    if (status === "CLOSED_TEMPORARILY" || status === "CLOSED_PERMANENTLY") {
      closed.push(data.name as string);
    }
  });

  console.log("\n=== Business Status Summary ===\n");
  [...statusMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([s, n]) => console.log(`${String(n).padStart(5)}  ${s}`));

  if (closed.length > 0) {
    console.log(`\n=== Provider Tutup (${closed.length}) ===\n`);
    closed.forEach((n) => console.log(`  - ${n}`));
  }
}

main().catch(console.error);
