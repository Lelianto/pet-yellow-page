import { Suspense } from "react";
import { readFileSync } from "fs";
import { join } from "path";
import { PawPrint } from "lucide-react";
import { Header } from "@/components/header";
import { ProviderCard } from "@/components/provider-card";
import { CategoryPills } from "@/components/category-pills";
import { CityFilter } from "@/components/city-filter";
import { NearMeButton } from "@/components/near-me-button";
import { RecommendServiceButton } from "@/components/recommend-service-button";
import { adminDb } from "@/lib/firebase-admin";
import { docToProvider } from "@/lib/providers";
import { haversineDistance } from "@/lib/geo";
import type { Provider } from "@/lib/types";

async function getProviders(category?: string, city?: string): Promise<Provider[]> {
  let query: FirebaseFirestore.Query = adminDb.collection("providers");

  if (category) {
    query = query.where("category", "==", category);
  }

  if (city) {
    query = query.where("area_city", "==", city);
  }

  query = query.orderBy("rating", "desc").limit(50);
  const snapshot = await query.get();

  return snapshot.docs
    .map(docToProvider)
    .filter((p) => p.business_status !== "CLOSED_PERMANENTLY");
}

export interface CityOption {
  name: string;
  count: number; // 0 = no providers yet
}

/** Merge Firestore cities (with provider counts) and all regencies from static data. */
async function getAllCities(): Promise<CityOption[]> {
  // Cities that have providers (with count)
  const snapshot = await adminDb.collection("providers").select("area_city").get();
  const cityCount = new Map<string, number>();
  snapshot.docs.forEach((doc) => {
    const city = doc.data().area_city as string | undefined;
    if (city) cityCount.set(city, (cityCount.get(city) || 0) + 1);
  });

  // All regencies from static JSON
  let allRegencies: string[] = [];
  try {
    const filePath = join(process.cwd(), "public", "data", "wilayah", "all-regencies.json");
    allRegencies = JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    // fallback: just use Firestore cities
  }

  // Merge: Firestore cities first (sorted by count desc), then remaining regencies (sorted alphabetically)
  const seen = new Set<string>();
  const withProviders: CityOption[] = [];
  for (const [name, count] of cityCount) {
    withProviders.push({ name, count });
    seen.add(name);
  }
  withProviders.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const withoutProviders: CityOption[] = allRegencies
    .filter((name) => !seen.has(name))
    .map((name) => ({ name, count: 0 }));

  return [...withProviders, ...withoutProviders];
}

interface ProvidersPageProps {
  searchParams: Promise<{ category?: string; city?: string; lat?: string; lng?: string }>;
}

export default async function ProvidersPage({ searchParams }: ProvidersPageProps) {
  const { category, city, lat, lng } = await searchParams;

  const userLat = lat ? parseFloat(lat) : null;
  const userLng = lng ? parseFloat(lng) : null;
  const hasUserLocation = userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng);

  let providers: Provider[] = [];
  let cities: CityOption[] = [];
  let distanceMap: Map<string, number> = new Map();
  let error = "";

  try {
    [providers, cities] = await Promise.all([
      getProviders(category, city),
      getAllCities(),
    ]);

    // Calculate distances and sort by nearest if user location is available
    if (hasUserLocation) {
      for (const p of providers) {
        if (p.location.latitude !== 0 && p.location.longitude !== 0) {
          const dist = haversineDistance(userLat, userLng, p.location.latitude, p.location.longitude);
          distanceMap.set(p.id, dist);
        }
      }
      providers.sort((a, b) => {
        const da = distanceMap.get(a.id) ?? Infinity;
        const db = distanceMap.get(b.id) ?? Infinity;
        return da - db;
      });
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
    console.error("Firestore fetch error:", e);
  }

  // Serialize distance map to pass as plain object to client components
  const distances: Record<string, number> = {};
  for (const [id, dist] of distanceMap) {
    distances[id] = dist;
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
        <div className="max-w-2xl mx-auto px-5 py-5 space-y-5">
          {/* Title area */}
          <div className="animate-fade-up">
            <h1 className="font-display font-extrabold text-xl text-bark">Jelajahi Layanan</h1>
            <p className="text-sm text-warm-gray mt-0.5">
              {providers.length > 0
                ? `${providers.length} layanan ditemukan${city ? ` di ${city}` : ""}${hasUserLocation ? " — diurutkan terdekat" : ""}`
                : "Cari layanan terbaik untuk anabulmu"}
            </p>
          </div>

          {/* Filters */}
          <div className="space-y-3 animate-fade-up stagger-1">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              <Suspense fallback={null}>
                <NearMeButton />
                <CategoryPills />
              </Suspense>
            </div>
            <Suspense fallback={null}>
              <CityFilter cities={cities} />
            </Suspense>
          </div>

          {/* Error state */}
          {error && (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-14 h-14 bg-terracotta/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PawPrint className="h-6 w-6 text-terracotta/50" />
              </div>
              <p className="font-display font-bold text-bark text-sm">Gagal memuat data</p>
              <p className="mt-2 text-xs font-mono text-terracotta/60 max-w-xs mx-auto">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!error && providers.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-14 h-14 bg-cream-dark rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
                <PawPrint className="h-6 w-6 text-terracotta/40" />
              </div>
              <p className="font-display font-bold text-bark text-sm">
                {city ? `Belum ada layanan di ${city}` : "Belum ada penyedia layanan"}
              </p>
              <p className="mt-1.5 text-xs text-warm-gray">
                {city
                  ? "Coba cari di kota lain atau rekomendasikan jasa yang Anda kenal."
                  : "Belum ada layanan untuk kategori ini. Coba kategori lain atau rekomendasikan jasa yang Anda kenal."}
              </p>
            </div>
          )}

          {/* Provider grid */}
          {providers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((provider, i) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  index={i}
                  distance={distances[provider.id]}
                />
              ))}
            </div>
          )}

          {/* Recommend CTA */}
          <div className="bg-white rounded-2xl border border-bark/5 p-5 text-center space-y-3">
            <p className="text-sm text-warm-gray">
              Kenal jasa pet care yang belum terdaftar?
            </p>
            <RecommendServiceButton />
          </div>
        </div>
      </main>
    </>
  );
}
