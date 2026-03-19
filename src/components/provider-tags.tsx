import { Star, Truck, CheckCircle, Heart } from "lucide-react";
import { CATEGORIES, type Provider } from "@/lib/types";

interface ProviderTagsProps {
  provider: Provider;
  size?: "sm" | "default";
}

export function ProviderTags({ provider, size = "default" }: ProviderTagsProps) {
  const category = CATEGORIES.find((c) => c.value === provider.category);
  const isDefault = size === "default";
  const padding = isDefault ? "px-3 py-1.5" : "px-2.5 py-1";
  const iconSize = isDefault ? "h-3.5 w-3.5" : "h-3 w-3";
  const fontWeight = isDefault ? "font-semibold" : "font-medium";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`inline-flex items-center gap-1 bg-cream-dark text-bark-light text-xs ${fontWeight} ${padding} rounded-lg`}>
        {category?.emoji} {category?.label}
      </span>
      {provider.rating > 0 && (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isDefault ? "bg-amber-50 text-amber-700 " + padding + " rounded-lg" : "text-bark"}`}>
          <Star className={`${iconSize} fill-amber-400 text-amber-400`} />
          {provider.rating.toFixed(1)}
          {isDefault && provider.review_count > 0 && (
            <span className="text-amber-500/70 font-medium">({provider.review_count})</span>
          )}
        </span>
      )}
      {provider.is_verified && (
        <span className={`inline-flex items-center gap-1 text-xs ${fontWeight} ${padding} rounded-lg ${
          isDefault
            ? "bg-sky-light text-sky-soft border border-sky-soft/15"
            : "bg-sky-soft/10 text-sky-soft"
        }`}>
          <CheckCircle className={iconSize} />
          Terverifikasi
        </span>
      )}
      {provider.source === "user_recommendation" && (
        <span className={`inline-flex items-center gap-1 text-xs ${fontWeight} ${padding} rounded-lg ${
          isDefault
            ? "bg-paw-pink-light text-terracotta border border-paw-pink/30"
            : "bg-paw-pink-light text-terracotta"
        }`}>
          <Heart className={iconSize} />
          Rekomendasi Warga
        </span>
      )}
      {provider.is_home_service && (
        <span className={`inline-flex items-center gap-1 text-xs ${fontWeight} ${padding} rounded-lg ${
          isDefault
            ? "bg-gradient-to-r from-terracotta/10 to-paw-pink-light/50 text-terracotta border border-terracotta/15"
            : "bg-terracotta/8 text-terracotta"
        }`}>
          <Truck className={iconSize} />
          Home Service
        </span>
      )}
    </div>
  );
}
