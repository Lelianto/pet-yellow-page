import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, CheckCircle, MapPin, PawPrint, ExternalLink, Clock, Globe, Truck, Star, Wrench } from "lucide-react";
import { Header } from "@/components/header";
import { ProviderTags } from "@/components/provider-tags";
import { ServiceChips } from "@/components/service-chips";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ClaimProfileButton } from "@/components/claim-profile-button";
import { ReportClosedButton } from "@/components/report-closed-button";
import { adminDb } from "@/lib/firebase-admin";
import { docToProvider } from "@/lib/providers";
import { CATEGORIES, type Provider } from "@/lib/types";

const getProvider = cache(async (id: string): Promise<Provider | null> => {
  const doc = await adminDb.collection("providers").doc(id).get();
  if (!doc.exists) return null;
  return docToProvider(doc);
});

interface ProviderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProviderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const provider = await getProvider(id);
  if (!provider) return { title: "Tidak Ditemukan | BuluBulu.id" };

  const category = CATEGORIES.find((c) => c.value === provider.category);
  return {
    title: `${provider.name} - ${category?.label} | BuluBulu.id`,
    description: `${provider.name} — layanan ${category?.label?.toLowerCase()} di ${provider.address}. Hubungi langsung via WhatsApp.`,
    openGraph: {
      title: `${provider.name} | BuluBulu.id`,
      description: `Layanan ${category?.label?.toLowerCase()} terpercaya. Rating ${provider.rating}/5.`,
    },
  };
}

export default async function ProviderDetailPage({ params }: ProviderDetailPageProps) {
  const { id } = await params;
  const provider = await getProvider(id);
  if (!provider) notFound();

  const today = new Date().getDay();

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
        {/* Photo */}
        <div className="max-w-2xl mx-auto">
          {provider.photo_url ? (
            <div className="aspect-[16/9] bg-cream-dark overflow-hidden animate-fade-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={provider.photo_url}
                alt={provider.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[16/9] bg-gradient-to-br from-cream-dark to-paw-pink-light/30 flex items-center justify-center animate-fade-in">
              <PawPrint className="h-20 w-20 text-terracotta/15 animate-float" />
            </div>
          )}
        </div>

        <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
          {/* Back */}
          <Link
            href="/providers"
            className="animate-fade-up inline-flex items-center gap-1.5 text-sm font-medium text-warm-gray hover:text-terracotta transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke daftar
          </Link>

          {/* Title card */}
          <div className="animate-fade-up stagger-1 bg-white rounded-2xl border border-bark/5 p-5 space-y-4">
            {/* Name & verified */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <h1 className="font-display font-extrabold text-2xl text-bark leading-tight">{provider.name}</h1>
                {provider.is_verified && (
                  <div className="shrink-0 mt-1 bg-sky-soft/15 p-1 rounded-full">
                    <CheckCircle className="h-4 w-4 text-sky-soft" />
                  </div>
                )}
              </div>

              <ProviderTags provider={provider} />

              {provider.description && (
                <p className="text-sm text-warm-gray leading-relaxed pt-1">{provider.description}</p>
              )}
            </div>

            {/* Services */}
            {provider.services.length > 0 && (
              <>
                <div className="h-px bg-bark/5" />
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-lavender/15 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-lavender" />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <p className="font-display font-bold text-sm text-bark">Layanan Tersedia</p>
                    <ServiceChips services={provider.services.filter((s) => s !== provider.category)} />
                  </div>
                </div>
              </>
            )}

            {/* Home Service badge */}
            {provider.is_home_service && (
              <>
                <div className="h-px bg-bark/5" />
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-terracotta/10 to-paw-pink-light/40 flex items-center justify-center shrink-0">
                    <Truck className="h-4 w-4 text-terracotta" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="font-display font-bold text-sm text-bark">Home Service</p>
                    <p className="text-sm text-warm-gray leading-relaxed">Layanan ini tersedia ke rumah Anda</p>
                  </div>
                </div>
              </>
            )}

            {/* Divider */}
            <div className="h-px bg-bark/5" />

            {/* Address */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-terracotta/8 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-terracotta" />
              </div>
              <div className="space-y-1 min-w-0">
                <p className="font-display font-bold text-sm text-bark">Alamat</p>
                <p className="text-sm text-warm-gray leading-relaxed">{provider.address}</p>
                {(provider.google_maps_uri || provider.location.latitude !== 0) && (
                  <a
                    href={provider.google_maps_uri || `https://www.google.com/maps/search/?api=1&query=${provider.location.latitude},${provider.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-terracotta hover:text-terracotta-dark transition-colors mt-0.5"
                  >
                    Buka di Google Maps
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Opening Hours */}
            {provider.opening_hours_text && provider.opening_hours_text.length > 0 && (
              <>
                <div className="h-px bg-bark/5" />
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-sage" />
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <p className="font-display font-bold text-sm text-bark">Jam Operasional</p>
                    <div className="space-y-1">
                      {provider.opening_hours_text.map((line, i) => (
                        <p
                          key={i}
                          className={`text-xs leading-relaxed ${
                            i === today ? "text-bark font-semibold" : "text-warm-gray"
                          }`}
                        >
                          {line}
                          {i === today && (
                            <span className="ml-1.5 text-[10px] font-semibold text-sage bg-sage/10 px-1.5 py-0.5 rounded-full">
                              Hari ini
                            </span>
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Website */}
            {provider.website && (
              <>
                <div className="h-px bg-bark/5" />
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-soft/10 flex items-center justify-center shrink-0">
                    <Globe className="h-4 w-4 text-sky-soft" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="font-display font-bold text-sm text-bark">Website</p>
                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-terracotta hover:text-terracotta-dark transition-colors break-all"
                    >
                      {provider.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Reviews */}
          {provider.reviews && provider.reviews.length > 0 && (
            <div className="animate-fade-up stagger-2 bg-white rounded-2xl border border-bark/5 p-5 space-y-4">
              <h2 className="font-display font-bold text-bark">Ulasan</h2>
              <div className="space-y-4">
                {provider.reviews.map((review, i) => (
                  <div key={i} className={i > 0 ? "border-t border-bark/5 pt-4" : ""}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="font-semibold text-sm text-bark">{review.author}</p>
                      <span className="text-xs text-warm-gray shrink-0">{review.time}</span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className={`h-3 w-3 ${
                            j < review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "fill-bark/10 text-bark/10"
                          }`}
                        />
                      ))}
                    </div>
                    {review.text && (
                      <p className="text-sm text-warm-gray leading-relaxed line-clamp-4">{review.text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA section */}
          <div className="animate-fade-up stagger-3 space-y-3">
            <WhatsAppButton
              phone={provider.whatsapp_number}
              providerName={provider.name}
              className="w-full"
            />

            {!provider.whatsapp_number && (
              <div className="bg-cream-dark rounded-2xl p-4 text-center">
                <p className="text-sm text-warm-gray">
                  Nomor WhatsApp belum tersedia untuk provider ini.
                </p>
              </div>
            )}

            {/* Claim Profile */}
            {provider.source !== "organic" && (
              <ClaimProfileButton
                providerId={provider.id}
                claimStatus={provider.claim_status}
                claimantUid={provider.claimant_uid}
              />
            )}

            {/* Report Closed */}
            <div className="flex justify-center pt-2">
              <ReportClosedButton providerId={provider.id} providerName={provider.name} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
