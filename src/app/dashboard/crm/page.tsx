"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Loader2,
  Lock,
  Phone,
  CalendarDays,
  Search,
} from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { canUseCRM, type ProviderTier } from "@/lib/tiers";
import type { BookingStatus } from "@/lib/types";

interface CustomerRecord {
  uid: string;
  name: string;
  phone: string;
  totalBookings: number;
  completedBookings: number;
  lastVisit: Date;
  services: string[];
}

interface BookingRaw {
  customer_uid: string;
  customer_name: string;
  customer_phone: string;
  service: string;
  status: BookingStatus;
  date: string;
  created_at: Date;
}

export default function CRMPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(true);
  const [providerTier, setProviderTier] = useState<ProviderTier>("basic");
  const [isPremium, setIsPremium] = useState(false);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // Get provider
        const pq = query(
          collection(db, "providers"),
          where("owner_uid", "==", user!.uid)
        );
        const pSnap = await getDocs(pq);
        if (pSnap.empty) {
          setLoading(false);
          return;
        }

        const pData = pSnap.docs[0].data();
        const tier = (pData.tier as ProviderTier) || "basic";
        const premium = (pData.is_premium as boolean) || false;
        setProviderTier(tier);
        setIsPremium(premium);

        if (!canUseCRM(tier, premium)) {
          setLoading(false);
          return;
        }

        // Fetch all bookings for this provider
        const bq = query(
          collection(db, "bookings"),
          where("provider_id", "==", pSnap.docs[0].id),
          orderBy("created_at", "desc")
        );
        const bSnap = await getDocs(bq);

        // Aggregate by customer
        const customerMap = new Map<string, CustomerRecord>();

        bSnap.docs.forEach((d) => {
          const data = d.data() as BookingRaw & { created_at: { toDate: () => Date } };
          const uid = data.customer_uid;
          const createdAt = data.created_at?.toDate?.() || new Date();

          if (!customerMap.has(uid)) {
            customerMap.set(uid, {
              uid,
              name: data.customer_name,
              phone: data.customer_phone,
              totalBookings: 0,
              completedBookings: 0,
              lastVisit: createdAt,
              services: [],
            });
          }

          const record = customerMap.get(uid)!;
          record.totalBookings++;
          if (data.status === "completed") {
            record.completedBookings++;
          }
          if (createdAt > record.lastVisit) {
            record.lastVisit = createdAt;
          }
          if (data.service && !record.services.includes(data.service)) {
            record.services.push(data.service);
          }
        });

        // Sort by total bookings desc
        const sorted = Array.from(customerMap.values()).sort(
          (a, b) => b.totalBookings - a.totalBookings
        );
        setCustomers(sorted);
      } catch (err) {
        console.error("CRM fetch error:", err);
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
      <div className="space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-gray hover:text-terracotta transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <div className="bg-white rounded-2xl border border-bark/5 p-8 text-center space-y-4">
          <p className="text-sm text-warm-gray">Login terlebih dahulu.</p>
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

  if (!canUseCRM(providerTier, isPremium)) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-gray hover:text-terracotta transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <div className="bg-white rounded-2xl border border-bark/5 p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-bark/5 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="h-6 w-6 text-warm-gray" />
          </div>
          <h1 className="font-display font-extrabold text-lg text-bark">
            Pet CRM
          </h1>
          <p className="text-sm text-warm-gray max-w-sm mx-auto">
            Fitur CRM data pelanggan hanya tersedia untuk paket{" "}
            <span className="font-semibold text-terracotta">Business</span>.
          </p>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center justify-center gap-2 bg-terracotta text-white font-semibold rounded-xl h-10 px-6 hover:bg-terracotta-dark transition-colors"
          >
            Upgrade Sekarang
          </Link>
        </div>
      </div>
    );
  }

  const filtered = searchQuery
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery)
      )
    : customers;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-gray hover:text-terracotta transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-paw-pink-light flex items-center justify-center">
          <Users className="h-5 w-5 text-paw-pink" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-lg text-bark">
            Pet CRM
          </h1>
          <p className="text-xs text-warm-gray">
            {customers.length} pelanggan terdaftar
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray" />
        <Input
          placeholder="Cari nama atau nomor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 rounded-xl h-10"
        />
      </div>

      {/* Customer list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-bark/5 p-8 text-center">
          <Users className="h-8 w-8 text-warm-gray/30 mx-auto mb-2" />
          <p className="text-sm text-warm-gray">
            {searchQuery
              ? "Tidak ditemukan pelanggan."
              : "Belum ada data pelanggan. Data akan muncul setelah ada booking masuk."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((customer) => (
            <div
              key={customer.uid}
              className="bg-white rounded-xl border border-bark/5 p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm text-bark">
                    {customer.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Phone className="h-3 w-3 text-warm-gray" />
                    <a
                      href={`https://wa.me/${customer.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-wa-green hover:underline"
                    >
                      {customer.phone}
                    </a>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full">
                    {customer.totalBookings}x booking
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-warm-gray block">Selesai</span>
                  <span className="font-medium text-sage">
                    {customer.completedBookings}
                  </span>
                </div>
                <div>
                  <span className="text-warm-gray block">Layanan</span>
                  <span className="font-medium text-bark">
                    {customer.services.length > 0
                      ? customer.services.slice(0, 2).join(", ")
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-warm-gray block">Terakhir</span>
                  <span className="font-medium text-bark flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {customer.lastVisit.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
