import { adminDb } from "@/lib/firebase-admin";
import type { Provider, ProviderCategory, ClaimStatus, ProviderSource, OpeningHoursPeriod, ProviderReview, FeaturesEnabled, PaymentSettings } from "@/lib/types";
import type { ProviderTier } from "@/lib/tiers";

/**
 * Convert a Firestore document snapshot to a Provider object.
 * Shared between listing and detail pages to avoid duplication.
 */
export function docToProvider(doc: { id: string; data: () => Record<string, unknown> | undefined }): Provider {
  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name as string,
    category: data.category as ProviderCategory,
    address: data.address as string,
    whatsapp_number: data.whatsapp_number as string,
    google_place_id: data.google_place_id as string,
    rating: data.rating as number,
    review_count: (data.review_count as number) || 0,
    is_verified: data.is_verified as boolean,
    is_home_service: data.is_home_service as boolean,
    services: (data.services as string[]) || [],
    location: {
      latitude: (data.location as { latitude?: number })?.latitude || 0,
      longitude: (data.location as { longitude?: number })?.longitude || 0,
    },
    photo_url: data.photo_url as string | undefined,
    description: data.description as string | undefined,
    website: data.website as string | undefined,
    google_maps_uri: data.google_maps_uri as string | undefined,
    opening_hours: data.opening_hours as OpeningHoursPeriod[] | undefined,
    opening_hours_text: data.opening_hours_text as string[] | undefined,
    business_status: data.business_status as string | undefined,
    reviews: data.reviews as ProviderReview[] | undefined,
    claim_status: (data.claim_status as ClaimStatus) || "none",
    claimant_uid: data.claimant_uid as string | undefined,
    owner_uid: data.owner_uid as string | undefined,
    source: (data.source as ProviderSource) || "google_maps",
    claim_proof_url: data.claim_proof_url as string | undefined,
    claim_proof_text: data.claim_proof_text as string | undefined,
    payment_settings: data.payment_settings as PaymentSettings | undefined,
    area_province: data.area_province as string | undefined,
    area_city: data.area_city as string | undefined,
    area_district: data.area_district as string | undefined,
    area_village: data.area_village as string | undefined,
    // Tier fields (defaults for providers seeded before tier system)
    tier: (data.tier as ProviderTier) || "basic",
    is_premium: (data.is_premium as boolean) || false,
    premium_until: (data.premium_until as { toDate?: () => Date })?.toDate?.() || null,
    trial_used: (data.trial_used as boolean) || false,
    tier_rank: (data.tier_rank as number) || 0,
    features_enabled: (data.features_enabled as FeaturesEnabled) || { booking: false, payments: false, crm: false },
    created_at: (data.created_at as { toDate?: () => Date })?.toDate?.() || new Date(),
    updated_at: (data.updated_at as { toDate?: () => Date })?.toDate?.() || new Date(),
  };
}

/** Get distinct city names from all providers. */
export async function getAvailableCities(): Promise<string[]> {
  const snapshot = await adminDb.collection("providers").select("area_city").get();
  const citySet = new Set<string>();
  snapshot.docs.forEach((doc) => {
    const city = doc.data().area_city as string | undefined;
    if (city) citySet.add(city);
  });
  return Array.from(citySet).sort((a, b) => a.localeCompare(b));
}

export interface AggregateStats {
  totalProviders: number;
  totalReviews: number;
  totalCities: number;
  verifiedProviders: number;
}

/** Get aggregate stats for trust signals. */
export async function getAggregateStats(): Promise<AggregateStats> {
  const snapshot = await adminDb.collection("providers").select("review_count", "area_city", "is_verified").get();
  let totalReviews = 0;
  let verifiedProviders = 0;
  const citySet = new Set<string>();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    totalReviews += (data.review_count as number) || 0;
    if (data.is_verified) verifiedProviders++;
    const city = data.area_city as string | undefined;
    if (city) citySet.add(city);
  });

  return {
    totalProviders: snapshot.size,
    totalReviews,
    totalCities: citySet.size,
    verifiedProviders,
  };
}

export interface CityWithCount {
  name: string;
  count: number;
}

/** Get top cities sorted by provider count. */
export async function getTopCities(limit: number = 8): Promise<CityWithCount[]> {
  const snapshot = await adminDb.collection("providers").select("area_city").get();
  const cityMap = new Map<string, number>();

  snapshot.docs.forEach((doc) => {
    const city = doc.data().area_city as string | undefined;
    if (city) cityMap.set(city, (cityMap.get(city) || 0) + 1);
  });

  return Array.from(cityMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface TopReview {
  author: string;
  text: string;
  rating: number;
  providerName: string;
  providerCategory: string;
}

/**
 * Simple heuristic to detect Indonesian text.
 * Checks for common Indonesian words that rarely appear in English reviews.
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

/** Get top reviews (4-5 star) from providers. Strictly Indonesian only. */
export async function getTopReviews(limit: number = 8): Promise<TopReview[]> {
  const snapshot = await adminDb.collection("providers").select("name", "category", "reviews").get();
  const reviews: TopReview[] = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const providerReviews = data.reviews as ProviderReview[] | undefined;
    if (!providerReviews) return;

    for (const review of providerReviews) {
      // Strict: only use text_id (translated) or original text if detectably Indonesian
      let displayText: string | undefined;
      if (review.text_id) {
        displayText = review.text_id;
      } else if (review.text && isIndonesian(review.text)) {
        displayText = review.text;
      }

      if (review.rating >= 4 && displayText && displayText.length > 20) {
        reviews.push({
          author: review.author,
          text: displayText,
          rating: review.rating,
          providerName: data.name as string,
          providerCategory: data.category as string,
        });
      }
    }
  });

  reviews.sort(() => Math.random() - 0.5);
  return reviews.slice(0, limit);
}

/** Get providers filtered by category and city, sorted by rating. */
export async function getProvidersByCategoryAndCity(
  category: ProviderCategory,
  city: string,
): Promise<Provider[]> {
  const snapshot = await adminDb
    .collection("providers")
    .where("category", "==", category)
    .where("area_city", "==", city)
    .orderBy("rating", "desc")
    .limit(50)
    .get();

  return snapshot.docs
    .map(docToProvider)
    .filter((p) => p.business_status !== "CLOSED_PERMANENTLY");
}

/** Get all unique category+city combinations for sitemap generation. */
export async function getAllCategoryCityCombinations(): Promise<{ category: string; city: string }[]> {
  const snapshot = await adminDb.collection("providers").select("category", "area_city").get();
  const combos = new Set<string>();
  const results: { category: string; city: string }[] = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const cat = data.category as string | undefined;
    const city = data.area_city as string | undefined;
    if (cat && city) {
      const key = `${cat}|${city}`;
      if (!combos.has(key)) {
        combos.add(key);
        results.push({ category: cat, city });
      }
    }
  });

  return results;
}
