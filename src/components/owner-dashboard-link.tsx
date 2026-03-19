"use client";

import Link from "next/link";
import { LayoutDashboard, CalendarDays, CreditCard, Crown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface OwnerDashboardLinkProps {
  ownerUid?: string;
}

export function OwnerDashboardLink({ ownerUid }: OwnerDashboardLinkProps) {
  const { user } = useAuth();

  if (!user || !ownerUid || user.uid !== ownerUid) return null;

  return (
    <div className="bg-gradient-to-r from-terracotta/5 to-paw-pink-light/30 rounded-2xl border border-terracotta/10 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-terracotta/10 flex items-center justify-center">
          <LayoutDashboard className="h-4 w-4 text-terracotta" />
        </div>
        <div>
          <p className="font-display font-bold text-sm text-bark">Kelola Bisnis Anda</p>
          <p className="text-[10px] text-warm-gray">Anda adalah pemilik profil ini</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Link
          href="/dashboard/billing"
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/80 hover:bg-white transition-colors text-center"
        >
          <Crown className="h-4 w-4 text-terracotta" />
          <span className="text-[10px] font-medium text-bark leading-tight">Langganan</span>
        </Link>
        <Link
          href="/dashboard/bookings"
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/80 hover:bg-white transition-colors text-center"
        >
          <CalendarDays className="h-4 w-4 text-sky-soft" />
          <span className="text-[10px] font-medium text-bark leading-tight">Booking</span>
        </Link>
        <Link
          href="/dashboard/payment-settings"
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/80 hover:bg-white transition-colors text-center"
        >
          <CreditCard className="h-4 w-4 text-amber-600" />
          <span className="text-[10px] font-medium text-bark leading-tight">Pembayaran</span>
        </Link>
      </div>
    </div>
  );
}
