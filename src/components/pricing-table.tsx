"use client";

import { Check, Crown, Zap, Star } from "lucide-react";
import { TIERS_ORDERED, TIER_DEFS, TRIAL_DAYS, type ProviderTier } from "@/lib/tiers";

const TIER_ICONS: Record<ProviderTier, typeof Star> = {
  basic: Star,
  growth: Zap,
  business: Crown,
};

const TIER_COLORS: Record<ProviderTier, { bg: string; accent: string; badge: string; btn: string }> = {
  basic: {
    bg: "bg-white",
    accent: "text-bark",
    badge: "bg-cream-dark text-bark-light",
    btn: "bg-bark/10 text-bark hover:bg-bark/15",
  },
  growth: {
    bg: "bg-gradient-to-b from-terracotta/5 to-white border-terracotta/20",
    accent: "text-terracotta",
    badge: "bg-terracotta/10 text-terracotta",
    btn: "bg-terracotta text-white hover:bg-terracotta-dark",
  },
  business: {
    bg: "bg-gradient-to-b from-amber-50 to-white border-amber-300/30",
    accent: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    btn: "bg-amber-600 text-white hover:bg-amber-700",
  },
};

interface PricingTableProps {
  currentTier?: ProviderTier;
  isPremium?: boolean;
  onSelect?: (tier: ProviderTier) => void;
}

export function PricingTable({ currentTier = "basic", isPremium = false, onSelect }: PricingTableProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {TIERS_ORDERED.map((tierId) => {
        const def = TIER_DEFS[tierId];
        const colors = TIER_COLORS[tierId];
        const Icon = TIER_ICONS[tierId];
        const isCurrent = currentTier === tierId;

        return (
          <div
            key={tierId}
            className={`relative rounded-2xl border p-5 space-y-4 transition-all ${colors.bg} ${
              def.highlight ? "shadow-md ring-1 ring-terracotta/15" : "border-bark/8"
            }`}
          >
            {/* Recommended badge */}
            {def.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 bg-terracotta text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                  <Zap className="h-3 w-3" />
                  POPULER
                </span>
              </div>
            )}

            {/* Header */}
            <div className="space-y-2 pt-1">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${colors.badge}`}>
                <Icon className="h-3.5 w-3.5" />
                {def.name}
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`font-display font-extrabold text-2xl ${colors.accent}`}>
                  {def.priceLabel}
                </span>
                {def.price > 0 && (
                  <span className="text-xs text-warm-gray">/bulan</span>
                )}
              </div>
              {tierId !== "basic" && (
                <p className="text-xs text-warm-gray">
                  Trial gratis {TRIAL_DAYS} hari
                </p>
              )}
            </div>

            {/* Features */}
            <div className="space-y-2.5">
              {def.features.map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <Check className={`h-4 w-4 shrink-0 mt-0.5 ${colors.accent}`} />
                  <span className="text-sm text-bark leading-snug">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => onSelect?.(tierId)}
              disabled={isCurrent && (tierId === "basic" || isPremium)}
              className={`w-full rounded-xl font-semibold text-sm h-10 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${colors.btn}`}
            >
              {isCurrent && (tierId === "basic" || isPremium)
                ? "Paket Saat Ini"
                : tierId === "basic"
                ? "Paket Gratis"
                : "Pilih Paket"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
