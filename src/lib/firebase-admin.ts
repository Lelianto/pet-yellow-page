import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function parsePrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  // Handle both literal \n (from .env files) and already-decoded newlines (from Vercel dashboard)
  if (key.includes("\\n")) return key.replace(/\\n/g, "\n");
  return key;
}

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID?.trim(),
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim(),
  privateKey: parsePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
};

const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({ credential: cert(serviceAccount) });

export const adminDb = getFirestore(adminApp);
