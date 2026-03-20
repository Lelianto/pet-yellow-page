import { adminDb } from "@/lib/firebase-admin";
import type { ProviderReview } from "@/lib/types";
import type { AggregateStats, CityWithCount, TopReview } from "@/lib/providers";

/** Shape of the cached homepage document stored in meta/homepage. */
export interface HomepageCache {
  cities: string[];
  cityCounts: Record<string, number>;
  stats: AggregateStats;
  topCities: CityWithCount[];
  topReviews: TopReview[];
  updatedAt: string; // ISO string
}

/**
 * Simple heuristic to detect Indonesian text.
 * Duplicated from providers.ts to keep homepage-cache self-contained for scripts.
 */
const ID_MARKERS = [
  "yang", "dan", "dengan", "untuk", "sangat", "banget", "sekali",
  "bagus", "baik", "pelayanan", "tempat", "hewan", "kucing", "anjing",
  "ramah", "bersih", "nyaman", "murah", "mahal", "saya", "kami",
  "disini", "di sini", "recommended", "rekomen", "klinik", "dokter",
  "perawatan", "grooming", "puas", "mantap", "oke", "sudah", "lagi",
  "nya", "keren", "cepat", "anak", "obat", "sakit", "sehat",
];

function isIndonesian(text: string): boolean {
  const lower = text.toLowerCase();
  let matches = 0;
  for (const word of ID_MARKERS) {
    if (lower.includes(word)) matches++;
    if (matches >= 2) return true;
  }
  return false;
}

/**
 * Scan all providers once, compute homepage data, and write to meta/homepage.
 * This reduces homepage reads from ~13,888 to 1.
 */
export async function writeHomepageCache(): Promise<HomepageCache> {
  const snapshot = await adminDb.collection("providers").get();

  const cityCount = new Map<string, number>();
  let totalReviews = 0;
  let verifiedProviders = 0;
  const allReviews: TopReview[] = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();

    // Stats
    totalReviews += (data.review_count as number) || 0;
    if (data.is_verified) verifiedProviders++;

    // Cities
    const city = data.area_city as string | undefined;
    if (city) cityCount.set(city, (cityCount.get(city) || 0) + 1);

    // Reviews
    const providerReviews = data.reviews as ProviderReview[] | undefined;
    if (providerReviews) {
      for (const review of providerReviews) {
        let displayText: string | undefined;
        if (review.text_id) {
          displayText = review.text_id;
        } else if (review.text && isIndonesian(review.text)) {
          displayText = review.text;
        }

        if (review.rating >= 4 && displayText && displayText.length > 20) {
          allReviews.push({
            author: review.author,
            text: displayText,
            rating: review.rating,
            providerName: data.name as string,
            providerCategory: data.category as string,
          });
        }
      }
    }
  });

  // Build cities list (sorted alphabetically)
  const cities = Array.from(cityCount.keys()).sort((a, b) => a.localeCompare(b));

  // Build stats
  const stats: AggregateStats = {
    totalProviders: snapshot.size,
    totalReviews,
    totalCities: cityCount.size,
    verifiedProviders,
  };

  // Build top 8 cities by count
  const topCities = Array.from(cityCount.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Shuffle and pick top 8 reviews
  allReviews.sort(() => Math.random() - 0.5);
  const topReviews = allReviews.slice(0, 8);

  // Build full city counts map
  const cityCounts: Record<string, number> = {};
  for (const [name, count] of cityCount) {
    cityCounts[name] = count;
  }

  const cache: HomepageCache = {
    cities,
    cityCounts,
    stats,
    topCities,
    topReviews,
    updatedAt: new Date().toISOString(),
  };

  // Write to Firestore meta/homepage
  await adminDb.collection("meta").doc("homepage").set(cache);

  return cache;
}

/**
 * Read the cached homepage document. Returns null if not found.
 * This is 1 Firestore read instead of scanning the entire providers collection.
 */
export async function readHomepageCache(): Promise<HomepageCache | null> {
  const doc = await adminDb.collection("meta").doc("homepage").get();
  if (!doc.exists) return null;
  return doc.data() as HomepageCache;
}
