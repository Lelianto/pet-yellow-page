"use client";

import { useState, useCallback } from "react";
import { Heart, Loader2, CheckCircle } from "lucide-react";
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
import { AreaSelector, type AreaSelection } from "@/components/area-selector";
import { CATEGORIES, type ProviderCategory } from "@/lib/types";

interface RecommendServiceButtonProps {
  className?: string;
  variant?: "default" | "inline";
}

export function RecommendServiceButton({ className, variant = "default" }: RecommendServiceButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProviderCategory | "">("");
  const [whatsapp, setWhatsapp] = useState("");
  const [area, setArea] = useState<AreaSelection | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleAreaSelect = useCallback((selected: AreaSelection) => {
    setArea(selected);
  }, []);

  function resetForm() {
    setName("");
    setCategory("");
    setWhatsapp("");
    setArea(null);
    setReason("");
  }

  async function handleSubmit() {
    if (!name || !category || !whatsapp || !area?.full) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "providers"), {
        name,
        category,
        services: [category],
        whatsapp_number: whatsapp,
        address: area.full,
        area_province: area.province,
        area_city: area.city,
        area_district: area.district,
        area_village: area.village || null,
        is_home_service: false,
        is_verified: false,
        rating: 0,
        review_count: 0,
        google_place_id: "",
        location: { latitude: 0, longitude: 0 },
        source: "user_recommendation",
        claim_status: "none",
        description: reason || null,
        submitted_by_uid: user?.uid || null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      setSubmitted(true);
      resetForm();
    } catch (err) {
      console.error("Recommend error:", err);
      alert("Gagal mengirim rekomendasi. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  const isValid = name && category && whatsapp && area?.full;

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSubmitted(false); }}>
      <SheetTrigger
        render={
          variant === "inline" ? (
            <button className={`inline-flex items-center gap-1.5 text-sm font-medium text-terracotta hover:text-terracotta-dark transition-colors ${className}`} />
          ) : (
            <button className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold h-10 px-5 bg-paw-pink-light text-terracotta hover:bg-paw-pink/30 transition-colors active:translate-y-px ${className}`} />
          )
        }
      >
        <Heart className="h-4 w-4" />
        Rekomendasikan Jasa
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto md:!inset-auto md:!top-1/2 md:!left-1/2 md:!-translate-x-1/2 md:!-translate-y-1/2 md:rounded-2xl md:border md:border-bark/10 md:max-w-lg md:w-full">
        <SheetHeader>
          <SheetTitle className="font-display font-bold text-bark">Rekomendasikan Jasa</SheetTitle>
          <SheetDescription>
            Kenal jasa pet care yang bagus? Bantu pet owner lain menemukannya!
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          {submitted ? (
            <div className="text-center py-6 animate-scale-in">
              <CheckCircle className="h-8 w-8 text-sage mx-auto mb-2" />
              <p className="font-display font-bold text-bark">Terima kasih!</p>
              <p className="text-sm text-warm-gray mt-1">
                Rekomendasi Anda akan segera muncul di direktori BuluBulu.
              </p>
            </div>
          ) : (
            <>
              {/* Nama */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-bark">Nama Jasa / Tempat</label>
                <Input
                  placeholder="Contoh: Grooming Bu Ani"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg h-10"
                />
              </div>

              {/* Kategori */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-bark">Kategori</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                        category === cat.value
                          ? "bg-terracotta text-white border-terracotta"
                          : "bg-cream-dark text-bark-light border-transparent hover:border-terracotta/20"
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-bark">Nomor WhatsApp</label>
                <Input
                  placeholder="628xxxxxxxxxx"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="rounded-lg h-10"
                />
              </div>

              {/* Area */}
              <AreaSelector onSelect={handleAreaSelect} />
              {area && (
                <p className="text-xs text-sage font-medium">
                  Lokasi: {area.full}
                </p>
              )}

              {/* Alasan (opsional) */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-bark">
                  Kenapa direkomendasikan?
                  <span className="ml-1 text-xs font-normal text-warm-gray">(opsional)</span>
                </label>
                <textarea
                  placeholder="Ceritakan pengalaman positif Anda..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || !isValid}
                className="w-full bg-terracotta hover:bg-terracotta-dark text-white rounded-xl h-11 font-semibold disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4" />
                    Kirim Rekomendasi
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
