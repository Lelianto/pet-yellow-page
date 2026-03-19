export type ProviderCategory = "grooming" | "vet" | "hotel" | "petshop";

export interface Provider {
  id: string;
  name: string;
  category: ProviderCategory;
  address: string;
  whatsapp_number: string;
  google_place_id: string;
  rating: number;
  is_verified: boolean;
  is_home_service: boolean;
  location: {
    latitude: number;
    longitude: number;
  };
  photo_url?: string;
  created_at: Date;
  updated_at: Date;
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
];
