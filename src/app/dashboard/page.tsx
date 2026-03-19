"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CreditCard,
  Crown,
  Clock,
  ExternalLink,
  Loader2,
  AlertTriangle,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";
import { collection, query, where, getDocs, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import {
  TIER_DEFS,
  daysRemaining,
  isPremiumActive,
  canUseBooking,
  canUsePayments,
  type ProviderTier,
} from "@/lib/tiers";

interface ProviderDashboard {
  id: string;
  name: string;
  tier: ProviderTier;
  is_premium: boolean;
  premium_until: Date | null;
  trial_used: boolean;
}

export default function DashboardPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [provider, setProvider] = useState<ProviderDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const pq = query(
          collection(db, "providers"),
          where("owner_uid", "==", user!.uid)
        );
        const pSnap = await getDocs(pq);
        if (pSnap.empty) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const doc = pSnap.docs[0];
        const data = doc.data();
        setProvider({
          id: doc.id,
          name: data.name as string,
          tier: (data.tier as ProviderTier) || "basic",
          is_premium: (data.is_premium as boolean) || false,
          premium_until: data.premium_until?.toDate() || null,
          trial_used: (data.trial_used as boolean) || false,
        });

        // Count pending bookings
        try {
          const bq = query(
            collection(db, "bookings"),
            where("provider_id", "==", doc.id),
            where("status", "in", ["pending", "waiting_payment", "waiting_payment_verification"])
          );
          const bSnap = await getCountFromServer(bq);
          setBookingCount(bSnap.data().count);
        } catch {
          // Index mungkin belum ada, abaikan
        }
      } catch (err) {
        console.error("Failed to fetch provider:", err);
      }
      setLoading(false);
    }

    fetchData();
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
      <div className="bg-white rounded-2xl border border-bark/5 p-8 text-center space-y-4">
        <LayoutDashboard className="h-8 w-8 text-warm-gray/30 mx-auto" />
        <p className="text-sm text-warm-gray">Login terlebih dahulu untuk mengakses dashboard.</p>
        <button
          onClick={signInWithGoogle}
          className="inline-flex items-center justify-center gap-2 bg-terracotta text-white font-semibold rounded-xl h-10 px-6 hover:bg-terracotta-dark transition-colors"
        >
          Login dengan Google
        </button>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="bg-white rounded-2xl border border-bark/5 p-8 text-center space-y-4">
        <LayoutDashboard className="h-8 w-8 text-warm-gray/30 mx-auto" />
        <p className="text-sm text-warm-gray">Anda belum memiliki profil mitra.</p>
        <Link
          href="/gabung-mitra"
          className="inline-flex items-center justify-center gap-2 bg-terracotta text-white font-semibold rounded-xl h-10 px-6 hover:bg-terracotta-dark transition-colors"
        >
          Gabung Mitra
        </Link>
      </div>
    );
  }

  const tierDef = TIER_DEFS[provider?.tier || "basic"];
  const premiumActive = isPremiumActive(provider?.premium_until);
  const remaining = daysRemaining(provider?.premium_until);
  const isTrialing = premiumActive && provider?.trial_used && provider.tier !== "basic";
  const hasBooking = canUseBooking(provider?.tier || "basic", provider?.is_premium || false);
  const hasPayments = canUsePayments(provider?.tier || "basic", provider?.is_premium || false);

  const MENU_ITEMS = [
    {
      href: `/providers/${provider?.id}`,
      icon: ExternalLink,
      label: "Lihat Profil",
      desc: "Halaman publik profil bisnis Anda",
      color: "text-terracotta",
      bg: "bg-terracotta/8",
      show: true,
    },
    {
      href: "/dashboard/bookings",
      icon: CalendarDays,
      label: "Booking Masuk",
      desc: hasBooking ? "Kelola booking dari pelanggan" : "Upgrade untuk aktifkan booking",
      color: "text-sky-soft",
      bg: "bg-sky-soft/10",
      badge: bookingCount > 0 ? `${bookingCount} baru` : undefined,
      show: true,
    },
    {
      href: "/dashboard/payment-settings",
      icon: CreditCard,
      label: "Pengaturan Pembayaran",
      desc: hasPayments ? "Atur rekening & DP untuk pelanggan" : "Tersedia di paket Business",
      color: "text-amber-600",
      bg: "bg-amber-100",
      show: true,
    },
    {
      href: "/dashboard/billing",
      icon: Crown,
      label: "Langganan & Paket",
      desc: `Paket ${tierDef.name} — ${premiumActive ? `${remaining} hari lagi` : "upgrade sekarang"}`,
      color: "text-lavender",
      bg: "bg-lavender/15",
      show: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terracotta to-terracotta-light flex items-center justify-center">
          <LayoutDashboard className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-lg text-bark">Dashboard</h1>
          <p className="text-xs text-warm-gray">{provider?.name}</p>
        </div>
      </div>

      {/* Plan status card */}
      <div className="bg-white rounded-2xl border border-bark/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-terracotta/8 flex items-center justify-center">
            <Crown className="h-4 w-4 text-terracotta" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-bark">Paket {tierDef.name}</p>
            {premiumActive ? (
              <p className="text-[10px] text-sage font-medium">
                <Clock className="inline h-3 w-3 mr-0.5 -mt-px" />
                {isTrialing ? "Trial" : "Aktif"} — {remaining} hari lagi
              </p>
            ) : provider?.tier === "basic" ? (
              <p className="text-[10px] text-warm-gray">Gratis</p>
            ) : (
              <p className="text-[10px] text-amber-600 font-medium">
                <AlertTriangle className="inline h-3 w-3 mr-0.5 -mt-px" />
                Kadaluarsa
              </p>
            )}
          </div>
        </div>
        <Link
          href="/dashboard/billing"
          className="text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors"
        >
          {premiumActive ? "Detail" : "Upgrade"}
        </Link>
      </div>

      {/* Menu grid */}
      <div className="space-y-2">
        {MENU_ITEMS.filter((m) => m.show).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 bg-white rounded-xl border border-bark/5 p-4 hover:border-terracotta/10 hover:shadow-sm transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-display font-bold text-sm text-bark">{item.label}</p>
                {item.badge && (
                  <span className="text-[10px] font-semibold text-white bg-terracotta px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-warm-gray truncate">{item.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-bark/20 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
