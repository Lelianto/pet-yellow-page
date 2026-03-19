import Link from "next/link";
import { MapPin, Navigation, Quote } from "lucide-react";
import { ProviderTags } from "@/components/provider-tags";
import { ServiceChips } from "@/components/service-chips";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { formatDistance } from "@/lib/geo";
import { CATEGORIES, type Provider } from "@/lib/types";

interface ProviderCardProps {
  provider: Provider;
  index?: number;
  distance?: number; // km, from user location
}

const MAX_STAGGER = 6;

export function ProviderCard({ provider, index = 0, distance }: ProviderCardProps) {
  const category = CATEGORIES.find((c) => c.value === provider.category);

  return (
    <article
      className={`animate-fade-up stagger-${Math.min(index + 1, MAX_STAGGER)} group bg-white rounded-2xl border border-bark/5 overflow-hidden card-lift`}
    >
      <Link href={`/providers/${provider.id}`} className="block">
        {provider.photo_url ? (
          <div className="aspect-[16/10] bg-cream-dark overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={provider.photo_url}
              alt={provider.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="aspect-[16/10] bg-gradient-to-br from-cream-dark to-paw-pink-light/30 flex items-center justify-center">
            <span className="text-5xl opacity-50 group-hover:opacity-70 transition-opacity">{category?.emoji || "🐾"}</span>
          </div>
        )}
      </Link>

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="space-y-1.5">
          <Link href={`/providers/${provider.id}`} className="group/title">
            <h3 className="font-display font-bold text-bark leading-snug line-clamp-1 group-hover/title:text-terracotta transition-colors">
              {provider.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 text-warm-gray">
            <MapPin className="h-3 w-3 shrink-0" />
            <p className="text-xs line-clamp-1 flex-1">{provider.address}</p>
            {distance !== undefined && (
              <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-semibold text-terracotta bg-terracotta/8 px-1.5 py-0.5 rounded-md">
                <Navigation className="h-2.5 w-2.5" />
                {formatDistance(distance)}
              </span>
            )}
          </div>
        </div>

        <ProviderTags provider={provider} size="sm" />

        {provider.services.length > 0 && (
          <ServiceChips
            services={provider.services.filter((s) => s !== provider.category)}
            size="sm"
          />
        )}

        {/* Review snippet */}
        {provider.reviews && provider.reviews.length > 0 && (provider.reviews[0].text_id || provider.reviews[0].text) && (
          <div className="flex gap-1.5 bg-cream-dark/50 rounded-xl px-3 py-2">
            <Quote className="h-3 w-3 text-terracotta/30 shrink-0 mt-0.5" />
            <p className="text-xs text-warm-gray italic line-clamp-2 leading-relaxed">
              {provider.reviews[0].text_id || provider.reviews[0].text}
            </p>
          </div>
        )}

        {/* CTA */}
        <WhatsAppButton
          phone={provider.whatsapp_number}
          providerName={provider.name}
          size="sm"
          className="w-full"
        />
      </div>
    </article>
  );
}
