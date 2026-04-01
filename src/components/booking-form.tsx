"use client";

import { useState } from "react";
import Image from "next/image";
import { CalendarDays, Loader2, CheckCircle, CreditCard, MessageCircle, QrCode } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PaymentSettings, BookingStatus } from "@/lib/types";
import type { ProviderTier } from "@/lib/tiers";

/** Generate a short booking code like "BB-A1B2C3" */
function generateBookingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/1/I
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `BB-${code}`;
}

/** Generate unique 3-digit code (1-999) added to DP for transfer verification */
function generateUniqueCode(): number {
  return Math.floor(Math.random() * 999) + 1;
}

interface BookingFormProps {
  providerId: string;
  providerName: string;
  providerWhatsapp: string;
  tier: ProviderTier;
  isPremium: boolean;
  services: string[];
  paymentSettings?: PaymentSettings;
}

export function BookingForm({
  providerId,
  providerName,
  providerWhatsapp,
  tier,
  isPremium,
  services,
  paymentSettings,
}: BookingFormProps) {
  const { user, signInWithGoogle } = useAuth();
  const [open, setOpen] = useState(false);
  const [service, setService] = useState(services[0] || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingCode, setBookingCode] = useState("");
  const [uniqueCode, setUniqueCode] = useState(0);
  const [dpTotal, setDpTotal] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Business tier with payment settings → requires DP
  const requiresPayment = tier === "business" && isPremium && paymentSettings;

  // WA number for payment proofs (from payment settings, fallback to provider's main WA)
  const paymentWa = paymentSettings?.whatsapp_payment || providerWhatsapp;

  async function handleSubmit() {
    if (!user || !date || !time || !phone) return;

    setSubmitting(true);
    try {
      const code = generateBookingCode();
      const baseDp = requiresPayment ? (paymentSettings?.min_dp_amount || 0) : 0;
      const uCode = requiresPayment ? generateUniqueCode() : 0;
      const total = baseDp + uCode;

      const status: BookingStatus = requiresPayment
        ? "waiting_payment"
        : "pending";

      await addDoc(collection(db, "bookings"), {
        booking_code: code,
        provider_id: providerId,
        provider_name: providerName,
        customer_uid: user.uid,
        customer_name: user.displayName || "Pelanggan",
        customer_phone: phone,
        service,
        date,
        time,
        notes: notes || null,
        status,
        dp_amount: baseDp || null,
        dp_unique_code: uCode || null,
        dp_total: total || null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      setBookingCode(code);
      setUniqueCode(uCode);
      setDpTotal(total);
      setSubmitted(true);
    } catch (err) {
      console.error("Booking error:", err);
      alert("Gagal membuat booking. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  function buildWhatsAppPaymentUrl() {
    const text = [
      `Halo, saya ingin konfirmasi pembayaran DP untuk booking di ${providerName}.`,
      ``,
      `Kode Booking: *${bookingCode}*`,
      `Layanan: ${service}`,
      `Tanggal: ${date}`,
      `Waktu: ${time}`,
      `Transfer: *Rp ${dpTotal.toLocaleString("id-ID")}*`,
      `(DP Rp ${(paymentSettings?.min_dp_amount || 0).toLocaleString("id-ID")} + kode unik ${uniqueCode})`,
      ``,
      `Berikut saya lampirkan bukti transfer.`,
    ].join("\n");
    return `https://wa.me/${paymentWa}?text=${encodeURIComponent(text)}`;
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-bark/5 p-5 space-y-4 animate-scale-in">
        <div className="text-center">
          <CheckCircle className="h-6 w-6 text-sage mx-auto mb-2" />
          <p className="text-sm text-sage font-semibold">Booking berhasil dibuat!</p>
        </div>

        {/* Booking code */}
        <div className="bg-cream rounded-xl p-4 text-center">
          <p className="text-xs text-warm-gray mb-1">Kode Booking</p>
          <p className="font-mono font-extrabold text-2xl text-bark tracking-wider">{bookingCode}</p>
        </div>

        {requiresPayment ? (
          <BookingPaymentInstructions
            dpTotal={dpTotal}
            uniqueCode={uniqueCode}
            bookingCode={bookingCode}
            paymentSettings={paymentSettings!}
            whatsAppUrl={buildWhatsAppPaymentUrl()}
          />
        ) : (
          <p className="text-xs text-warm-gray text-center">
            Menunggu konfirmasi dari penyedia layanan. Simpan kode booking Anda.
          </p>
        )}
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl font-semibold h-11 px-5 bg-sky-soft text-white hover:bg-sky-soft/80 transition-colors active:translate-y-px" />
        }
      >
        <CalendarDays className="h-4 w-4" />
        Booking Online
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[90vh] overflow-y-auto md:!inset-auto md:!top-1/2 md:!left-1/2 md:!-translate-x-1/2 md:!-translate-y-1/2 md:rounded-2xl md:border md:border-bark/10 md:max-w-lg md:w-full"
      >
        <SheetHeader>
          <SheetTitle className="font-display font-bold text-bark">
            Booking — {providerName}
          </SheetTitle>
          <SheetDescription>
            Pilih layanan, tanggal, dan waktu yang diinginkan.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          {!user ? (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-warm-gray">Login terlebih dahulu untuk booking.</p>
              <Button
                onClick={signInWithGoogle}
                className="bg-terracotta hover:bg-terracotta-dark text-white rounded-xl h-10 px-6"
              >
                Login dengan Google
              </Button>
            </div>
          ) : (
            <>
              {/* Service */}
              {services.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-bark">Layanan</label>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                  >
                    {services.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-bark">Tanggal</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="rounded-lg h-10"
                />
              </div>

              {/* Time */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-bark">Waktu</label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-lg h-10"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-bark">Nomor WhatsApp</label>
                <Input
                  placeholder="628xxxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-lg h-10"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-bark">Catatan (opsional)</label>
                <textarea
                  placeholder="Jenis hewan, keluhan, dll."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
                />
              </div>

              {/* DP info banner (Business tier) */}
              {requiresPayment && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-800">Memerlukan DP</span>
                  </div>
                  <p className="text-xs text-amber-700">
                    Setelah booking, Anda akan diminta transfer DP minimal{" "}
                    <span className="font-bold">Rp {paymentSettings!.min_dp_amount.toLocaleString("id-ID")}</span>{" "}
                    dan kirim bukti via WhatsApp.
                  </p>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting || !date || !time || !phone}
                className="w-full bg-sky-soft hover:bg-sky-soft/80 text-white rounded-xl h-11 font-semibold disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Mengirim...
                  </>
                ) : (
                  "Kirim Booking"
                )}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Payment Instructions with QRIS + Bank Transfer tabs ──────────────

function BookingPaymentInstructions({
  dpTotal,
  uniqueCode,
  bookingCode,
  paymentSettings,
  whatsAppUrl,
}: {
  dpTotal: number;
  uniqueCode: number;
  bookingCode: string;
  paymentSettings: PaymentSettings;
  whatsAppUrl: string;
}) {
  const [payMethod, setPayMethod] = useState<"qris" | "bank">(
    paymentSettings.qris_url ? "qris" : "bank"
  );

  return (
    <>
      {/* Payment instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">
            Langkah Selanjutnya
          </span>
        </div>

        {/* Amount */}
        <div className="text-xs text-amber-700 space-y-2">
          <p>
            1. Transfer <span className="font-bold">tepat</span> sebesar:
          </p>
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-xs text-warm-gray mb-1">Total Transfer</p>
            <p className="font-mono font-extrabold text-xl text-bark">
              Rp {dpTotal.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] text-amber-600 mt-1">
              DP Rp {paymentSettings.min_dp_amount.toLocaleString("id-ID")} +
              kode unik Rp {uniqueCode}
            </p>
          </div>
          <p className="text-[10px] text-amber-600/80 text-center">
            Mohon transfer tepat sampai 3 digit terakhir agar pesanan
            terverifikasi oleh penyedia jasa.
          </p>
        </div>

        {/* Payment method tabs */}
        {paymentSettings.qris_url && (
          <div className="flex gap-1 bg-amber-100/50 rounded-lg p-1">
            <button
              onClick={() => setPayMethod("qris")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-md transition-all ${
                payMethod === "qris"
                  ? "bg-white text-amber-800 shadow-sm"
                  : "text-amber-600 hover:text-amber-700"
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              QRIS
            </button>
            <button
              onClick={() => setPayMethod("bank")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-md transition-all ${
                payMethod === "bank"
                  ? "bg-white text-amber-800 shadow-sm"
                  : "text-amber-600 hover:text-amber-700"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Transfer Bank
            </button>
          </div>
        )}

        {/* QRIS */}
        {payMethod === "qris" && paymentSettings.qris_url && (
          <div className="text-xs text-amber-700 space-y-2">
            <p>2. Scan QRIS di bawah:</p>
            <div className="bg-white rounded-lg p-3">
              <div className="relative w-full aspect-square max-w-[220px] mx-auto rounded-md overflow-hidden">
                <Image
                  src={paymentSettings.qris_url}
                  alt="QRIS Payment"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-[10px] text-amber-600/80 text-center mt-2">
                Scan menggunakan GoPay, OVO, Dana, ShopeePay, atau mobile
                banking
              </p>
            </div>
            <p>
              3. Kirim bukti via WhatsApp dengan kode booking{" "}
              <span className="font-bold">{bookingCode}</span>
            </p>
          </div>
        )}

        {/* Bank Transfer */}
        {payMethod === "bank" && (
          <div className="text-xs text-amber-700 space-y-2">
            <p>2. Transfer ke:</p>
            <div className="bg-white rounded-lg p-3 space-y-1">
              <p>
                <span className="text-warm-gray">Bank:</span>{" "}
                <span className="font-semibold text-bark">
                  {paymentSettings.bank_name}
                </span>
              </p>
              <p>
                <span className="text-warm-gray">No. Rek:</span>{" "}
                <span className="font-semibold text-bark font-mono">
                  {paymentSettings.account_number}
                </span>
              </p>
              <p>
                <span className="text-warm-gray">A/N:</span>{" "}
                <span className="font-semibold text-bark">
                  {paymentSettings.account_holder}
                </span>
              </p>
            </div>
            <p>
              3. Kirim bukti transfer via WhatsApp dengan kode booking{" "}
              <span className="font-bold">{bookingCode}</span>
            </p>
          </div>
        )}

        {/* If no QRIS, show bank only */}
        {!paymentSettings.qris_url && (
          <div className="text-xs text-amber-700 space-y-2">
            <p>2. Transfer ke:</p>
            <div className="bg-white rounded-lg p-3 space-y-1">
              <p>
                <span className="text-warm-gray">Bank:</span>{" "}
                <span className="font-semibold text-bark">
                  {paymentSettings.bank_name}
                </span>
              </p>
              <p>
                <span className="text-warm-gray">No. Rek:</span>{" "}
                <span className="font-semibold text-bark font-mono">
                  {paymentSettings.account_number}
                </span>
              </p>
              <p>
                <span className="text-warm-gray">A/N:</span>{" "}
                <span className="font-semibold text-bark">
                  {paymentSettings.account_holder}
                </span>
              </p>
            </div>
            <p>
              3. Kirim bukti transfer via WhatsApp dengan kode booking{" "}
              <span className="font-bold">{bookingCode}</span>
            </p>
          </div>
        )}
      </div>

      {/* WA button to send proof */}
      <a
        href={whatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl font-semibold h-11 px-5 bg-wa-green text-white hover:bg-wa-green/90 transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        Kirim Bukti Transfer via WhatsApp
      </a>
    </>
  );
}
