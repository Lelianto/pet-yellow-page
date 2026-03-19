"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { PricingTable } from "@/components/pricing-table";
import {
  TIER_DEFS,
  TRIAL_DAYS,
  daysRemaining,
  isPremiumActive,
  type ProviderTier,
} from "@/lib/tiers";

interface ProviderBilling {
  id: string;
  name: string;
  tier: ProviderTier;
  is_premium: boolean;
  premium_until: Date | null;
  trial_used: boolean;
}

export default function BillingPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [provider, setProvider] = useState<ProviderBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    async function fetchProvider() {
      try {
        const q = query(
          collection(db, "providers"),
          where("owner_uid", "==", user!.uid)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const doc = snap.docs[0];
        const data = doc.data();
        setProvider({
          id: doc.id,
          name: data.name as string,
          tier: (data.tier as ProviderTier) || "basic",
          is_premium: (data.is_premium as boolean) || false,
          premium_until: data.premium_until?.toDate() || null,
          trial_used: (data.trial_used as boolean) || false,
        });
      } catch (err) {
        console.error("Failed to fetch provider:", err);
      }
      setLoading(false);
    }

    fetchProvider();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-terracotta" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-gray hover:text-terracotta transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <div className="bg-white rounded-2xl border border-bark/5 p-8 text-center space-y-4">
          <p className="text-sm text-warm-gray">Login terlebih dahulu untuk mengakses dashboard.</p>
          <button
            onClick={signInWithGoogle}
            className="inline-flex items-center justify-center gap-2 bg-terracotta text-white font-semibold rounded-xl h-10 px-6 hover:bg-terracotta-dark transition-colors"
          >
            Login dengan Google
          </button>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-gray hover:text-terracotta transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <div className="bg-white rounded-2xl border border-bark/5 p-8 text-center space-y-4">
          <p className="text-sm text-warm-gray">
            Anda belum memiliki profil mitra. Daftar terlebih dahulu.
          </p>
          <Link
            href="/gabung-mitra"
            className="inline-flex items-center justify-center gap-2 bg-terracotta text-white font-semibold rounded-xl h-10 px-6 hover:bg-terracotta-dark transition-colors"
          >
            Gabung Mitra
          </Link>
        </div>
      </div>
    );
  }

  const tierDef = TIER_DEFS[provider?.tier || "basic"];
  const premiumActive = isPremiumActive(provider?.premium_until);
  const remaining = daysRemaining(provider?.premium_until);
  const isTrialing = premiumActive && provider?.trial_used && provider.tier !== "basic";

  function handleSelectTier(tier: ProviderTier) {
    if (tier === "basic") return;
    // Placeholder — payment gateway integration
    alert(`Fitur pembayaran untuk paket ${TIER_DEFS[tier].name} akan segera hadir. Hubungi admin untuk upgrade manual.`);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-gray hover:text-terracotta transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>

      {/* Current plan status */}
      <div className="bg-white rounded-2xl border border-bark/5 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-terracotta/8 flex items-center justify-center">
            <Crown className="h-5 w-5 text-terracotta" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-lg text-bark">Langganan</h1>
            <p className="text-xs text-warm-gray">{provider?.name}</p>
          </div>
        </div>

        <div className="h-px bg-bark/5" />

        {/* Plan info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-warm-gray">Paket saat ini</span>
            <span className="font-display font-bold text-sm text-bark">{tierDef.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-warm-gray">Status</span>
            {premiumActive ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-sage bg-sage/10 px-2 py-0.5 rounded-full">
                <Clock className="h-3 w-3" />
                {isTrialing ? "Trial" : "Aktif"} — {remaining} hari lagi
              </span>
            ) : provider?.tier === "basic" ? (
              <span className="text-xs font-semibold text-warm-gray bg-cream-dark px-2 py-0.5 rounded-full">
                Gratis
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                Kadaluarsa
              </span>
            )}
          </div>
          {premiumActive && provider?.premium_until && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-warm-gray">Berlaku hingga</span>
              <span className="text-sm font-medium text-bark">
                {provider.premium_until.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Trial info */}
        {!provider?.trial_used && provider?.tier === "basic" && (
          <div className="bg-terracotta/5 rounded-xl p-4 text-center">
            <p className="text-sm text-terracotta font-semibold">
              Trial gratis {TRIAL_DAYS} hari tersedia!
            </p>
            <p className="text-xs text-warm-gray mt-1">
              Upgrade ke Growth atau Business dan nikmati fitur premium gratis selama {TRIAL_DAYS} hari.
            </p>
          </div>
        )}
      </div>

      {/* Pricing table */}
      <div className="space-y-4">
        <h2 className="font-display font-extrabold text-lg text-bark text-center">Pilih Paket</h2>
        <PricingTable
          currentTier={provider?.tier || "basic"}
          isPremium={premiumActive}
          onSelect={handleSelectTier}
        />
      </div>
    </div>
  );
}
