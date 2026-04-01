"use client";

import { useState } from "react";
import Image from "next/image";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Copy,
  Loader2,
  MessageCircle,
  QrCode,
} from "lucide-react";
import { TIER_DEFS, type ProviderTier } from "@/lib/tiers";
import type { SubscriptionOrderStatus } from "@/lib/types";

const ADMIN_WA = "6281578777654";

function generateOrderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SUB-${code}`;
}

function generateUniqueCode(): number {
  return Math.floor(Math.random() * 999) + 1;
}

interface SubscriptionPaymentSheetProps {
  tier: ProviderTier;
  providerId: string;
  providerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionPaymentSheet({
  tier,
  providerId,
  providerName,
  open,
  onOpenChange,
}: SubscriptionPaymentSheetProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderCode, setOrderCode] = useState("");
  const [uniqueCode, setUniqueCode] = useState(0);
  const [total, setTotal] = useState(0);
  const [copied, setCopied] = useState(false);

  const tierDef = TIER_DEFS[tier];

  async function handleCreateOrder() {
    if (!user) return;
    setSubmitting(true);

    try {
      const code = generateOrderCode();
      const uCode = generateUniqueCode();
      const orderTotal = tierDef.price + uCode;

      const status: SubscriptionOrderStatus = "pending";

      await addDoc(collection(db, "subscription_orders"), {
        provider_id: providerId,
        provider_name: providerName,
        customer_uid: user.uid,
        tier,
        amount: tierDef.price,
        unique_code: uCode,
        total: orderTotal,
        status,
        order_code: code,
        duration_days: 30,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      setOrderCode(code);
      setUniqueCode(uCode);
      setTotal(orderTotal);
      setSubmitted(true);
    } catch (err) {
      console.error("Order error:", err);
      alert("Gagal membuat pesanan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  function buildWhatsAppUrl() {
    const text = [
      `Halo, saya ingin konfirmasi pembayaran langganan BuluBulu.`,
      ``,
      `Kode Pesanan: *${orderCode}*`,
      `Paket: *${tierDef.name}* (${tierDef.priceLabel}/bulan)`,
      `Mitra: ${providerName}`,
      `Total Transfer: *Rp ${total.toLocaleString("id-ID")}*`,
      `(${tierDef.priceLabel} + kode unik Rp ${uniqueCode})`,
      ``,
      `Mohon diverifikasi. Terima kasih!`,
    ].join("\n");
    return `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(text)}`;
  }

  function handleCopyTotal() {
    navigator.clipboard.writeText(total.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSheetChange(value: boolean) {
    onOpenChange(value);
    if (!value && submitted) {
      // Reset state when closing after submission
      setTimeout(() => {
        setSubmitted(false);
        setOrderCode("");
        setUniqueCode(0);
        setTotal(0);
      }, 300);
    }
  }

  const sheetClassName =
    "rounded-t-2xl max-h-[92vh] overflow-y-auto md:!inset-auto md:!top-1/2 md:!left-1/2 md:!-translate-x-1/2 md:!-translate-y-1/2 md:rounded-2xl md:border md:border-bark/10 md:max-w-lg md:w-full";

  if (submitted) {
    return (
      <Sheet open={open} onOpenChange={handleSheetChange}>
        <SheetContent side="bottom" className={sheetClassName}>
          <SheetHeader>
            <SheetTitle className="font-display font-bold text-bark">
              Pembayaran Langganan
            </SheetTitle>
            <SheetDescription>
              Scan QRIS dan konfirmasi via WhatsApp
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-6 space-y-4">
            {/* Order code */}
            <div className="bg-cream rounded-xl p-4 text-center">
              <p className="text-xs text-warm-gray mb-1">Kode Pesanan</p>
              <p className="font-mono font-extrabold text-2xl text-bark tracking-wider">
                {orderCode}
              </p>
            </div>

            {/* Total */}
            <div className="bg-terracotta/5 border border-terracotta/15 rounded-xl p-4 text-center space-y-1">
              <p className="text-xs text-warm-gray">Total Transfer</p>
              <div className="flex items-center justify-center gap-2">
                <p className="font-mono font-extrabold text-2xl text-terracotta">
                  Rp {total.toLocaleString("id-ID")}
                </p>
                <button
                  onClick={handleCopyTotal}
                  className="p-1.5 rounded-lg hover:bg-terracotta/10 transition-colors"
                  title="Salin nominal"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-sage" />
                  ) : (
                    <Copy className="h-4 w-4 text-terracotta" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-terracotta/70">
                {tierDef.priceLabel} + kode unik Rp {uniqueCode}
              </p>
            </div>

            {/* QRIS Image */}
            <div className="bg-white rounded-xl border border-bark/5 p-4 space-y-3">
              <div className="flex items-center gap-2 justify-center">
                <QrCode className="h-4 w-4 text-bark" />
                <span className="text-sm font-semibold text-bark">
                  Scan QRIS
                </span>
              </div>
              <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-lg overflow-hidden bg-white">
                <Image
                  src="/qris-payment.jpeg"
                  alt="QRIS Payment"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <p className="text-[10px] text-warm-gray text-center">
                Buka aplikasi e-wallet/mobile banking, scan QR di atas, dan
                masukkan nominal tepat Rp {total.toLocaleString("id-ID")}
              </p>
            </div>

            {/* Steps */}
            <div className="bg-cream-dark/50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-bark">Langkah:</p>
              <ol className="text-xs text-warm-gray space-y-1.5 list-decimal list-inside">
                <li>
                  Scan QRIS di atas menggunakan aplikasi e-wallet atau mobile
                  banking
                </li>
                <li>
                  Transfer{" "}
                  <span className="font-bold text-bark">
                    tepat Rp {total.toLocaleString("id-ID")}
                  </span>
                </li>
                <li>
                  Screenshot bukti pembayaran, lalu klik tombol di bawah untuk
                  konfirmasi via WhatsApp
                </li>
              </ol>
            </div>

            {/* WhatsApp confirmation button */}
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl font-semibold h-11 px-5 bg-wa-green text-white hover:bg-wa-green/90 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Konfirmasi via WhatsApp
            </a>

            <p className="text-[10px] text-warm-gray text-center">
              Langganan akan aktif setelah pembayaran diverifikasi admin (maks
              1x24 jam)
            </p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleSheetChange}>
      <SheetContent side="bottom" className={sheetClassName}>
        <SheetHeader>
          <SheetTitle className="font-display font-bold text-bark">
            Upgrade ke {tierDef.name}
          </SheetTitle>
          <SheetDescription>
            Bayar via QRIS dan konfirmasi via WhatsApp
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Plan summary */}
          <div className="bg-white rounded-xl border border-bark/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-bark">
                Paket {tierDef.name}
              </span>
              <span className="font-display font-extrabold text-lg text-terracotta">
                {tierDef.priceLabel}
                <span className="text-xs font-normal text-warm-gray">
                  /bulan
                </span>
              </span>
            </div>
            <div className="h-px bg-bark/5" />
            <ul className="space-y-1.5">
              {tierDef.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-xs text-bark"
                >
                  <CheckCircle className="h-3.5 w-3.5 text-sage shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Payment method info */}
          <div className="bg-cream rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-bark" />
              <span className="text-sm font-semibold text-bark">
                Pembayaran via QRIS
              </span>
            </div>
            <p className="text-xs text-warm-gray">
              Setelah klik tombol di bawah, Anda akan mendapat kode pesanan dan
              QR code untuk pembayaran. Bisa pakai GoPay, OVO, Dana, ShopeePay,
              atau mobile banking.
            </p>
          </div>

          <Button
            onClick={handleCreateOrder}
            disabled={submitting}
            className="w-full bg-terracotta hover:bg-terracotta-dark text-white rounded-xl h-11 font-semibold disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
              </>
            ) : (
              `Bayar ${tierDef.priceLabel} — Lanjutkan`
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
