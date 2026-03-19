"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Loader2, CheckCircle, Lock } from "lucide-react";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canUsePayments, type ProviderTier } from "@/lib/tiers";
import type { PaymentSettings } from "@/lib/types";

interface ProviderPaymentData {
  id: string;
  name: string;
  tier: ProviderTier;
  is_premium: boolean;
  whatsapp_number: string;
  payment_settings?: PaymentSettings;
}

export default function PaymentSettingsPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [provider, setProvider] = useState<ProviderPaymentData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [minDp, setMinDp] = useState("20000");
  const [whatsappPayment, setWhatsappPayment] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
        if (!snap.empty) {
          const d = snap.docs[0];
          const data = d.data();
          const ps = data.payment_settings as PaymentSettings | undefined;
          setProvider({
            id: d.id,
            name: data.name as string,
            tier: (data.tier as ProviderTier) || "basic",
            is_premium: (data.is_premium as boolean) || false,
            whatsapp_number: (data.whatsapp_number as string) || "",
            payment_settings: ps,
          });
          if (ps) {
            setBankName(ps.bank_name || "");
            setAccountNumber(ps.account_number || "");
            setAccountHolder(ps.account_holder || "");
            setMinDp(String(ps.min_dp_amount || 20000));
            setWhatsappPayment(ps.whatsapp_payment || "");
          }
        }
      } catch (err) {
        console.error("Failed to fetch provider:", err);
      }
      setLoading(false);
    }

    fetchProvider();
  }, [user, authLoading]);

  async function handleSave() {
    if (!provider || !user) return;
    setSaving(true);
    setSaved(false);

    try {
      const settings: PaymentSettings = {
        bank_name: bankName,
        account_number: accountNumber,
        account_holder: accountHolder,
        min_dp_amount: parseInt(minDp) || 20000,
        whatsapp_payment: whatsappPayment || provider.whatsapp_number,
      };

      await updateDoc(doc(db, "providers", provider.id), {
        payment_settings: settings,
        updated_at: serverTimestamp(),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      alert("Gagal menyimpan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

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
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-gray hover:text-terracotta transition-colors">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <div className="bg-white rounded-2xl border border-bark/5 p-8 text-center space-y-4">
          <p className="text-sm text-warm-gray">Login terlebih dahulu.</p>
          <button onClick={signInWithGoogle} className="inline-flex items-center justify-center gap-2 bg-terracotta text-white font-semibold rounded-xl h-10 px-6 hover:bg-terracotta-dark transition-colors">
            Login dengan Google
          </button>
        </div>
      </div>
    );
  }

  if (provider && !canUsePayments(provider.tier, provider.is_premium)) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-gray hover:text-terracotta transition-colors">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <div className="bg-white rounded-2xl border border-bark/5 p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-bark/5 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="h-6 w-6 text-warm-gray" />
          </div>
          <h1 className="font-display font-extrabold text-lg text-bark">Fitur Business</h1>
          <p className="text-sm text-warm-gray max-w-sm mx-auto">
            Pengaturan pembayaran hanya tersedia untuk paket <span className="font-semibold text-terracotta">Business</span>.
          </p>
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 bg-terracotta text-white font-semibold rounded-xl h-10 px-6 hover:bg-terracotta-dark transition-colors">
            Upgrade Sekarang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-gray hover:text-terracotta transition-colors">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-lg text-bark">Metode Pembayaran</h1>
          <p className="text-xs text-warm-gray">Atur rekening untuk menerima DP dari pelanggan</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-bark/5 p-5 space-y-5">
        {/* Bank Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-bark">Nama Bank</label>
          <Input
            placeholder="BCA, BNI, Mandiri, dll."
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="rounded-lg h-10"
          />
        </div>

        {/* Account Number */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-bark">Nomor Rekening</label>
          <Input
            placeholder="1234567890"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="rounded-lg h-10"
          />
        </div>

        {/* Account Holder */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-bark">Nama Pemilik Rekening</label>
          <Input
            placeholder="Nama sesuai buku tabungan"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            className="rounded-lg h-10"
          />
        </div>

        {/* Min DP */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-bark">Minimum DP (Rp)</label>
          <Input
            type="number"
            placeholder="20000"
            value={minDp}
            onChange={(e) => setMinDp(e.target.value)}
            className="rounded-lg h-10"
            min={0}
          />
          <p className="text-xs text-warm-gray">Jumlah minimum DP yang harus dibayar pelanggan.</p>
        </div>

        {/* WhatsApp for payment proofs */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-bark">WhatsApp Penerima Bukti Transfer</label>
          <Input
            placeholder="628xxxxxxxxxx"
            value={whatsappPayment}
            onChange={(e) => setWhatsappPayment(e.target.value)}
            className="rounded-lg h-10"
          />
          <p className="text-xs text-warm-gray">
            Pelanggan akan mengirim bukti transfer ke nomor ini beserta kode booking.
            {provider?.whatsapp_number && !whatsappPayment && (
              <span className="text-bark-light"> Jika kosong, akan menggunakan nomor utama ({provider.whatsapp_number}).</span>
            )}
          </p>
        </div>

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={saving || !bankName || !accountNumber || !accountHolder}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-11 font-semibold disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="h-4 w-4" /> Tersimpan!
            </>
          ) : (
            "Simpan Pengaturan"
          )}
        </Button>
      </div>
    </div>
  );
}
