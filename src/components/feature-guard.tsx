"use client";

import { Lock, Zap } from "lucide-react";
import Link from "next/link";
import type { ProviderTier } from "@/lib/tiers";
import { canUseBooking, canUsePayments, canUseCRM } from "@/lib/tiers";

interface FeatureGuardProps {
  feature: "booking" | "payments" | "crm";
  tier: ProviderTier;
  isPremium: boolean;
  children: React.ReactNode;
}

function isFeatureEnabled(feature: string, tier: ProviderTier, isPremium: boolean): boolean {
  switch (feature) {
    case "booking":
      return canUseBooking(tier, isPremium);
    case "payments":
      return canUsePayments(tier, isPremium);
    case "crm":
      return canUseCRM(tier, isPremium);
    default:
      return false;
  }
}

const FEATURE_LABELS: Record<string, { label: string; minTier: string }> = {
  booking: { label: "Booking Online", minTier: "Growth" },
  payments: { label: "Sistem DP/Pembayaran", minTier: "Business" },
  crm: { label: "Pet CRM", minTier: "Business" },
};

/**
 * Wraps a premium feature. Shows children if authorized, otherwise shows an upgrade prompt.
 */
export function FeatureGuard({ feature, tier, isPremium, children }: FeatureGuardProps) {
  if (isFeatureEnabled(feature, tier, isPremium)) {
    return <>{children}</>;
  }

  const info = FEATURE_LABELS[feature] || { label: feature, minTier: "Growth" };

  return (
    <div className="relative rounded-2xl border border-dashed border-bark/15 bg-cream/50 p-6 text-center space-y-3">
      <div className="w-12 h-12 bg-bark/5 rounded-xl flex items-center justify-center mx-auto">
        <Lock className="h-5 w-5 text-warm-gray" />
      </div>
      <div>
        <p className="font-display font-bold text-sm text-bark">{info.label}</p>
        <p className="text-xs text-warm-gray mt-1">
          Fitur ini tersedia untuk paket <span className="font-semibold text-terracotta">{info.minTier}</span> ke atas.
        </p>
      </div>
      <Link
        href="/dashboard/billing"
        className="inline-flex items-center gap-1.5 bg-terracotta text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-terracotta-dark transition-colors"
      >
        <Zap className="h-3.5 w-3.5" />
        Upgrade Sekarang
      </Link>
    </div>
  );
}
