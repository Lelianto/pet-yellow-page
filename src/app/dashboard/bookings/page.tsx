"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle, XCircle, Loader2, Clock, CreditCard, Copy } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import type { BookingStatus } from "@/lib/types";

interface BookingItem {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_phone: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
  status: BookingStatus;
  dp_amount?: number;
  dp_unique_code?: number;
  dp_total?: number;
  created_at: Date;
}

const STATUS_LABELS: Record<BookingStatus, { label: string; color: string }> = {
  pending: { label: "Menunggu Konfirmasi", color: "bg-amber-100 text-amber-700" },
  waiting_payment: { label: "Menunggu DP", color: "bg-blue-100 text-blue-700" },
  waiting_payment_verification: { label: "Verifikasi Pembayaran", color: "bg-blue-100 text-blue-700" },
  confirmed: { label: "Dikonfirmasi", color: "bg-sage/15 text-sage" },
  rejected: { label: "Ditolak", color: "bg-red-100 text-red-600" },
  cancelled: { label: "Dibatalkan", color: "bg-bark/10 text-bark-light" },
  completed: { label: "Selesai", color: "bg-sky-light text-sky-soft" },
};

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    async function fetchBookings() {
      try {
        const pq = query(
          collection(db, "providers"),
          where("owner_uid", "==", user!.uid)
        );
        const pSnap = await getDocs(pq);
        if (pSnap.empty) {
          setLoading(false);
          return;
        }

        const pid = pSnap.docs[0].id;
        setProviderId(pid);

        const bq = query(
          collection(db, "bookings"),
          where("provider_id", "==", pid),
          orderBy("created_at", "desc")
        );
        const bSnap = await getDocs(bq);

        setBookings(
          bSnap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              booking_code: (data.booking_code as string) || d.id.slice(0, 8).toUpperCase(),
              customer_name: data.customer_name as string,
              customer_phone: data.customer_phone as string,
              service: data.service as string,
              date: data.date as string,
              time: data.time as string,
              notes: data.notes as string | undefined,
              status: data.status as BookingStatus,
              dp_amount: data.dp_amount as number | undefined,
              dp_unique_code: data.dp_unique_code as number | undefined,
              dp_total: data.dp_total as number | undefined,
              created_at: data.created_at?.toDate() || new Date(),
            };
          })
        );
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      }
      setLoading(false);
    }

    fetchBookings();
  }, [user, authLoading]);

  async function handleAction(bookingId: string, action: "confirm" | "reject" | "complete") {
    const statusMap: Record<string, BookingStatus> = {
      confirm: "confirmed",
      reject: "rejected",
      complete: "completed",
    };

    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: statusMap[action],
        ...(action === "confirm" ? { payment_verified_at: serverTimestamp() } : {}),
        updated_at: serverTimestamp(),
      });

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: statusMap[action] } : b
        )
      );
    } catch (err) {
      console.error("Action error:", err);
      alert("Gagal memproses. Silakan coba lagi.");
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-terracotta" />
      </div>
    );
  }

  if (!user || !providerId) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-gray hover:text-terracotta transition-colors">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <div className="bg-white rounded-2xl border border-bark/5 p-8 text-center">
          <p className="text-sm text-warm-gray">Anda belum memiliki profil mitra.</p>
        </div>
      </div>
    );
  }

  const actionable = bookings.filter((b) =>
    ["pending", "waiting_payment", "waiting_payment_verification"].includes(b.status)
  );
  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const rest = bookings.filter((b) =>
    ["rejected", "cancelled", "completed"].includes(b.status)
  );

  function renderBookingCard(booking: BookingItem) {
    const statusDef = STATUS_LABELS[booking.status];
    return (
      <div key={booking.id} className="bg-white rounded-xl border border-bark/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusDef.color}`}>
            {statusDef.label}
          </span>
          <span className="text-[10px] text-warm-gray">
            {booking.created_at.toLocaleDateString("id-ID")}
          </span>
        </div>

        {/* Booking code */}
        <div className="flex items-center gap-2 bg-cream/60 rounded-lg px-3 py-2">
          <span className="text-[10px] text-warm-gray">Kode:</span>
          <span className="font-mono font-bold text-sm text-bark">{booking.booking_code}</span>
          <button
            onClick={() => navigator.clipboard.writeText(booking.booking_code)}
            className="ml-auto p-1 rounded hover:bg-bark/5 transition-colors"
            title="Salin kode"
          >
            <Copy className="h-3 w-3 text-warm-gray" />
          </button>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-sm text-bark">{booking.customer_name}</p>
          <p className="text-xs text-warm-gray">{booking.customer_phone}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-warm-gray block">Layanan</span>
            <span className="font-medium text-bark">{booking.service}</span>
          </div>
          <div>
            <span className="text-warm-gray block">Tanggal</span>
            <span className="font-medium text-bark">{booking.date}</span>
          </div>
          <div>
            <span className="text-warm-gray block">Waktu</span>
            <span className="font-medium text-bark">{booking.time}</span>
          </div>
        </div>

        {booking.notes && (
          <p className="text-xs text-warm-gray bg-cream/50 rounded-lg p-2">
            {booking.notes}
          </p>
        )}

        {/* DP info */}
        {booking.dp_amount && booking.dp_amount > 0 && (
          <div className="bg-amber-50 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <CreditCard className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-amber-700 font-medium">
                Transfer: Rp {(booking.dp_total || booking.dp_amount).toLocaleString("id-ID")}
              </span>
            </div>
            {booking.dp_unique_code && (
              <p className="text-[10px] text-amber-600/80 pl-5.5">
                DP Rp {booking.dp_amount.toLocaleString("id-ID")} + kode unik {booking.dp_unique_code}
              </p>
            )}
            {(booking.status === "waiting_payment" || booking.status === "waiting_payment_verification") && (
              <p className="text-[10px] text-amber-600/70 pl-5.5">
                Cek WA untuk bukti transfer dengan nominal tepat ini
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        {(booking.status === "pending" || booking.status === "waiting_payment" || booking.status === "waiting_payment_verification") && (
          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => handleAction(booking.id, "confirm")}
              className="flex-1 bg-sage hover:bg-sage/80 text-white rounded-lg h-8 text-xs"
              size="sm"
            >
              <CheckCircle className="h-3 w-3" />
              {booking.dp_amount ? "Konfirmasi Bayar" : "Konfirmasi"}
            </Button>
            <Button
              onClick={() => handleAction(booking.id, "reject")}
              variant="destructive"
              className="rounded-lg h-8 text-xs"
              size="sm"
            >
              <XCircle className="h-3 w-3" /> Tolak
            </Button>
          </div>
        )}

        {booking.status === "confirmed" && (
          <Button
            onClick={() => handleAction(booking.id, "complete")}
            className="w-full bg-sky-soft hover:bg-sky-soft/80 text-white rounded-lg h-8 text-xs"
            size="sm"
          >
            <CheckCircle className="h-3 w-3" /> Tandai Selesai
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-gray hover:text-terracotta transition-colors">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-soft/15 flex items-center justify-center">
          <CalendarDays className="h-5 w-5 text-sky-soft" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-lg text-bark">Booking Masuk</h1>
          <p className="text-xs text-warm-gray">{bookings.length} total booking</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-bark/5 p-8 text-center">
          <Clock className="h-8 w-8 text-warm-gray/30 mx-auto mb-2" />
          <p className="text-sm text-warm-gray">Belum ada booking masuk.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Actionable bookings */}
          {actionable.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display font-bold text-sm text-bark">
                Perlu Tindakan ({actionable.length})
              </h2>
              <div className="space-y-3">
                {actionable.map(renderBookingCard)}
              </div>
            </div>
          )}

          {/* Confirmed */}
          {confirmed.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display font-bold text-sm text-sage">
                Dikonfirmasi ({confirmed.length})
              </h2>
              <div className="space-y-3">
                {confirmed.map(renderBookingCard)}
              </div>
            </div>
          )}

          {/* History */}
          {rest.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display font-bold text-sm text-warm-gray">
                Riwayat ({rest.length})
              </h2>
              <div className="space-y-3">
                {rest.map(renderBookingCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
