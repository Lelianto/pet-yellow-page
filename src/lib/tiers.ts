/**
 * Subscription tier system for BuluBulu.id providers.
 *
 * Tiers: basic (free), growth (Rp 75k/mo), business (Rp 150k/mo)
 * Eligibility: Booking features require source === 'organic' OR claim_status === 'approved'
 * Trial: 14 days of Growth tier for newly authorized providers
 */

export type ProviderTier = "basic" | "growth" | "business";

export interface TierDefinition {
  id: ProviderTier;
  name: string;
  price: number; // monthly in IDR, 0 = free
  priceLabel: string;
  photoLimit: number; // Infinity for unlimited
  features: string[];
  searchRank: number; // higher = shown first
  highlight?: boolean; // recommended badge
}

export const TIER_DEFS: Record<ProviderTier, TierDefinition> = {
  basic: {
    id: "basic",
    name: "Basic",
    price: 0,
    priceLabel: "Gratis",
    photoLimit: 3,
    searchRank: 0,
    features: [
      "3 foto profil",
      "Tombol WhatsApp",
      "Tampil di pencarian standar",
      "Profil bisnis dasar",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    price: 75_000,
    priceLabel: "Rp 75.000",
    photoLimit: 20,
    searchRank: 1,
    highlight: true,
    features: [
      "20 foto profil",
      "Booking online (tanpa DP)",
      "Prioritas di pencarian",
      "Semua fitur Basic",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    price: 150_000,
    priceLabel: "Rp 150.000",
    photoLimit: Infinity,
    searchRank: 2,
    features: [
      "Foto unlimited",
      "Booking + sistem DP/pembayaran",
      "Pet CRM (data pelanggan)",
      "Posisi teratas di pencarian",
      "Semua fitur Growth",
    ],
  },
};

export const TIERS_ORDERED: ProviderTier[] = ["basic", "growth", "business"];

export const TRIAL_DAYS = 14;

// ── Feature guards ───────────────────────────────────────────────────

/** Provider is authorized (self-registered or claim approved) → can access premium features if subscribed. */
export function isAuthorizedProvider(source: string, claimStatus: string): boolean {
  return source === "organic" || claimStatus === "approved";
}

/** Can access booking calendar (Growth or Business, premium active). */
export function canUseBooking(tier: ProviderTier, isPremium: boolean): boolean {
  return tier !== "basic" && isPremium;
}

/** Can access DP/payment system (Business only, premium active). */
export function canUsePayments(tier: ProviderTier, isPremium: boolean): boolean {
  return tier === "business" && isPremium;
}

/** Can access Pet CRM (Business only, premium active). */
export function canUseCRM(tier: ProviderTier, isPremium: boolean): boolean {
  return tier === "business" && isPremium;
}

/** Photo upload limit for a tier. */
export function getPhotoLimit(tier: ProviderTier): number {
  return TIER_DEFS[tier].photoLimit;
}

/** Search rank for Firestore ordering. */
export function getSearchRank(tier: ProviderTier): number {
  return TIER_DEFS[tier].searchRank;
}

/** Check if premium is still active based on premium_until date. */
export function isPremiumActive(premiumUntil?: Date | null): boolean {
  if (!premiumUntil) return false;
  return premiumUntil.getTime() > Date.now();
}

/** Days remaining on premium/trial. Returns 0 if expired. */
export function daysRemaining(premiumUntil?: Date | null): number {
  if (!premiumUntil) return 0;
  const diff = premiumUntil.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/** Build the Firestore fields for starting a trial. */
export function buildTrialFields() {
  const premiumUntil = new Date();
  premiumUntil.setDate(premiumUntil.getDate() + TRIAL_DAYS);
  return {
    tier: "growth" as ProviderTier,
    is_premium: true,
    premium_until: premiumUntil,
    trial_used: true,
    tier_rank: TIER_DEFS.growth.searchRank,
    features_enabled: {
      booking: true,
      payments: false,
      crm: false,
    },
  };
}

/** Build the default tier fields for a new non-trial provider. */
export function buildDefaultTierFields() {
  return {
    tier: "basic" as ProviderTier,
    is_premium: false,
    premium_until: null,
    trial_used: false,
    tier_rank: TIER_DEFS.basic.searchRank,
    features_enabled: {
      booking: false,
      payments: false,
      crm: false,
    },
  };
}
