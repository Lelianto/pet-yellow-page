import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Star, Home, CheckCircle, MapPin, PawPrint } from "lucide-react";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { CATEGORIES, type Provider, type ProviderCategory } from "@/lib/types";

async function getProvider(id: string): Promise<Provider | null> {
  const { adminDb } = await import("@/lib/firebase-admin");
  const doc = await adminDb.collection("providers").doc(id).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
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
  };
}

interface ProviderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProviderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const provider = await getProvider(id);
  if (!provider) return { title: "Tidak Ditemukan | AnabulCare" };

  const category = CATEGORIES.find((c) => c.value === provider.category);
  return {
    title: `${provider.name} - ${category?.label} | AnabulCare`,
    description: `${provider.name} — layanan ${category?.label?.toLowerCase()} di ${provider.address}. Hubungi langsung via WhatsApp.`,
    openGraph: {
      title: `${provider.name} | AnabulCare`,
      description: `Layanan ${category?.label?.toLowerCase()} terpercaya. Rating ${provider.rating}/5.`,
    },
  };
}

export default async function ProviderDetailPage({ params }: ProviderDetailPageProps) {
  const { id } = await params;
  const provider = await getProvider(id);
  if (!provider) notFound();

  const category = CATEGORIES.find((c) => c.value === provider.category);

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Photo */}
        {provider.photo_url ? (
          <div className="aspect-video max-w-lg mx-auto bg-amber-50 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={provider.photo_url}
              alt={provider.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video max-w-lg mx-auto bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
            <PawPrint className="h-16 w-16 text-amber-300" />
          </div>
        )}

        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
          {/* Back */}
          <Link
            href="/providers"
            className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>

          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <h1 className="text-2xl font-bold text-amber-950">{provider.name}</h1>
              {provider.is_verified && (
                <CheckCircle className="h-5 w-5 text-blue-500 mt-1 shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                {category?.emoji} {category?.label}
              </Badge>
              {provider.rating > 0 && (
                <span className="flex items-center gap-1 text-sm text-amber-600">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {provider.rating.toFixed(1)}
                </span>
              )}
              {provider.is_home_service && (
                <Badge variant="outline" className="border-green-200 text-green-700">
                  <Home className="h-3 w-3 mr-1" />
                  Home Service
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Address */}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Alamat</p>
              <p className="text-sm text-muted-foreground">{provider.address}</p>
              {provider.location.latitude !== 0 && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${provider.location.latitude},${provider.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-600 hover:underline mt-1 inline-block"
                >
                  Buka di Google Maps
                </a>
              )}
            </div>
          </div>

          <Separator />

          {/* CTA */}
          <WhatsAppButton
            phone={provider.whatsapp_number}
            providerName={provider.name}
            className="w-full"
          />

          {!provider.whatsapp_number && (
            <p className="text-center text-sm text-muted-foreground">
              Nomor WhatsApp belum tersedia untuk provider ini.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
