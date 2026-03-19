export type ProviderCategory = "grooming" | "vet" | "hotel" | "petshop" | "sitter";

export type ClaimStatus = "none" | "pending" | "approved" | "rejected";
export type ProviderSource = "google_maps" | "organic" | "user_recommendation";

export interface OpeningHoursPeriod {
  day: number; // 0=Sunday, 6=Saturday
  open: string; // "09:00"
  close: string; // "18:00"
}

export interface ProviderReview {
  author: string;
  text: string;
  text_id?: string; // Indonesian translation (backfilled)
  rating: number;
  time: string;
}

export interface Provider {
  id: string;
  name: string;
  category: ProviderCategory;
  address: string;
  whatsapp_number: string;
  google_place_id: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_home_service: boolean;
  services: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  photo_url?: string;
  description?: string;
  website?: string;
  google_maps_uri?: string;
  opening_hours?: OpeningHoursPeriod[];
  opening_hours_text?: string[];
  business_status?: string;
  reviews?: ProviderReview[];
  claim_status: ClaimStatus;
  claimant_uid?: string;
  owner_uid?: string;
  source: ProviderSource;
  claim_proof_url?: string;
  claim_proof_text?: string;
  area_province?: string;
  area_city?: string;
  area_district?: string;
  area_village?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Recommendation {
  id: string;
  service_name: string;
  whatsapp: string;
  reason: string;
  submitted_by_uid?: string;
  source: "user_recommendation";
  created_at: Date;
}

export interface ProviderFormData {
  name: string;
  category: ProviderCategory;
  address: string;
  whatsapp_number: string;
  is_home_service: boolean;
}

export const CATEGORIES: { value: ProviderCategory; label: string; emoji: string }[] = [
  { value: "grooming", label: "Grooming", emoji: "✂️" },
  { value: "vet", label: "Dokter Hewan", emoji: "🩺" },
  { value: "hotel", label: "Pet Hotel", emoji: "🏨" },
  { value: "petshop", label: "Pet Shop", emoji: "🛍️" },
  { value: "sitter", label: "Pet Sitter", emoji: "🐾" },
];

export const SERVICES: Record<string, { label: string; emoji: string }> = {
  grooming: { label: "Grooming", emoji: "✂️" },
  vet: { label: "Dokter Hewan", emoji: "🩺" },
  vaksin: { label: "Vaksinasi", emoji: "💉" },
  steril: { label: "Sterilisasi", emoji: "🏥" },
  operasi: { label: "Operasi", emoji: "⚕️" },
  hotel: { label: "Penitipan", emoji: "🏨" },
  daycare: { label: "Daycare", emoji: "🐾" },
  petshop: { label: "Pet Shop", emoji: "🛍️" },
  home_service: { label: "Home Service", emoji: "🚗" },
  transport: { label: "Pet Transport", emoji: "🚐" },
};
