import { Suspense } from "react";
import { Header } from "@/components/header";
import { ProviderCard } from "@/components/provider-card";
import { CategoryPills } from "@/components/category-pills";
import type { Provider, ProviderCategory } from "@/lib/types";

// Server-side Firestore fetch via Admin SDK
async function getProviders(category?: string): Promise<Provider[]> {
  // Dynamic import to avoid bundling admin SDK in client
  const { adminDb } = await import("@/lib/firebase-admin");

  let query: FirebaseFirestore.Query = adminDb.collection("providers");

  if (category) {
    query = query.where("category", "==", category);
  }

  query = query.orderBy("rating", "desc").limit(50);

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      category: data.category as ProviderCategory,
      address: data.address,
      whatsapp_number: data.whatsapp_number,
      google_place_id: data.google_place_id,
      rating: data.rating,
      is_verified: data.is_verified,
      is_home_service: data.is_home_service,
      location: {
        latitude: data.location?.latitude || 0,
        longitude: data.location?.longitude || 0,
      },
      photo_url: data.photo_url,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    } satisfies Provider;
  });
}

interface ProvidersPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function ProvidersPage({ searchParams }: ProvidersPageProps) {
  const { category } = await searchParams;

  let providers: Provider[] = [];
  let error = false;

  try {
    providers = await getProviders(category);
  } catch {
    error = true;
  }

  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-4">
        <div className="max-w-lg mx-auto space-y-4">
          <Suspense fallback={null}>
            <CategoryPills />
          </Suspense>

          {error && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <p>Gagal memuat data. Pastikan Firebase sudah dikonfigurasi.</p>
              <p className="mt-1 text-xs">Cek file <code>.env.local</code> dan Firestore rules.</p>
            </div>
          )}

          {!error && providers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <p className="text-2xl mb-2">🐾</p>
              <p>Belum ada penyedia layanan.</p>
              <p className="mt-1 text-xs">Jalankan <code>npx tsx scripts/seed-from-google.ts</code> untuk mengisi data.</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
