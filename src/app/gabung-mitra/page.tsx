"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle, PawPrint } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { AreaSelector, type AreaSelection } from "@/components/area-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES, type ProviderCategory } from "@/lib/types";

export default function GabungMitraPage() {
  const { user, signInWithGoogle } = useAuth();
  const [name, setName] = useState("");
  const [categories, setCategories] = useState<ProviderCategory[]>([]);
  const [whatsapp, setWhatsapp] = useState("");
  const [area, setArea] = useState<AreaSelection | null>(null);
  const [isHomeService, setIsHomeService] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleAreaSelect = useCallback((selected: AreaSelection) => {
    setArea(selected);
  }, []);

  function toggleCategory(cat: ProviderCategory) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!name || categories.length === 0 || !whatsapp || !area?.full) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "providers"), {
        name,
        category: categories[0],
        services: categories,
        whatsapp_number: whatsapp,
        address: area.full,
        area_province: area.province,
        area_city: area.city,
        area_district: area.district,
        area_village: area.village || null,
        is_home_service: isHomeService,
        is_verified: false,
        rating: 0,
        review_count: 0,
        google_place_id: "",
        location: { latitude: 0, longitude: 0 },
        source: "organic",
        claim_status: "approved",
        owner_uid: user.uid,
        claimant_uid: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Registration error:", err);
      alert("Gagal mendaftar. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
        <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
          <Link
            href="/"
            className="animate-fade-up inline-flex items-center gap-1.5 text-sm font-medium text-warm-gray hover:text-terracotta transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>

          {submitted ? (
            <div className="animate-scale-in bg-white rounded-2xl border border-bark/5 p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-sage-light rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-sage" />
              </div>
              <h1 className="font-display font-extrabold text-xl text-bark">Pendaftaran Berhasil!</h1>
              <p className="text-sm text-warm-gray max-w-sm mx-auto">
                Profil Anda sedang ditinjau tim kami. Setelah diverifikasi, layanan Anda akan muncul di direktori BuluBulu.id.
              </p>
              <Link
                href="/providers"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-terracotta text-white font-semibold h-10 px-6 hover:bg-terracotta-dark transition-colors"
              >
                Lihat Direktori
              </Link>
            </div>
          ) : (
            <>
              <div className="animate-fade-up space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-terracotta to-terracotta-light rounded-xl flex items-center justify-center">
                    <PawPrint className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="font-display font-extrabold text-xl text-bark">Gabung Mitra</h1>
                    <p className="text-xs text-warm-gray">Daftarkan layanan pet care Anda</p>
                  </div>
                </div>
              </div>

              {!user ? (
                <div className="animate-fade-up stagger-1 bg-white rounded-2xl border border-bark/5 p-6 text-center space-y-4">
                  <p className="text-sm text-warm-gray">Login terlebih dahulu untuk mendaftar sebagai mitra.</p>
                  <Button
                    onClick={signInWithGoogle}
                    className="bg-terracotta hover:bg-terracotta-dark text-white rounded-xl h-10 px-6"
                  >
                    Login dengan Google
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="animate-fade-up stagger-1 bg-white rounded-2xl border border-bark/5 p-5 space-y-5">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-bark">Nama Usaha / Anda</label>
                    <Input
                      placeholder="Contoh: Grooming Paws & Claws"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="rounded-lg h-10"
                    />
                  </div>

                  {/* Categories - multi-select */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-bark">Kategori Layanan</label>
                    <p className="text-xs text-warm-gray">Pilih satu atau lebih</p>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => toggleCategory(cat.value)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                            categories.includes(cat.value)
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
                      required
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

                  {/* Home Service toggle */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        isHomeService ? "bg-terracotta" : "bg-bark/15"
                      }`}
                      onClick={() => setIsHomeService(!isHomeService)}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          isHomeService ? "translate-x-5" : ""
                        }`}
                      />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-bark block">Layanan Panggilan</span>
                      <span className="text-xs text-warm-gray">Bisa datang ke rumah pelanggan</span>
                    </div>
                  </label>

                  <Button
                    type="submit"
                    disabled={submitting || !name || categories.length === 0 || !whatsapp || !area?.full}
                    className="w-full bg-terracotta hover:bg-terracotta-dark text-white rounded-xl h-11 font-semibold disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mendaftar...
                      </>
                    ) : (
                      "Daftar Sekarang"
                    )}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
