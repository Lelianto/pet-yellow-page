import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PawPrint, MapPin } from "lucide-react";
import { Header } from "@/components/header";
import { ProviderCard } from "@/components/provider-card";
import { ItemListJsonLd } from "@/components/json-ld";
import { getProvidersByCategoryAndCity } from "@/lib/providers";
import { CATEGORIES, type ProviderCategory } from "@/lib/types";

const CATEGORY_SLUGS: Record<string, ProviderCategory> = {
  grooming: "grooming",
  "dokter-hewan": "vet",
  "pet-hotel": "hotel",
  "pet-shop": "petshop",
  "pet-sitter": "sitter",
};

const CATEGORY_SEO: Record<ProviderCategory, { title: string; desc: string }> = {
  grooming: { title: "Grooming", desc: "grooming hewan peliharaan" },
  vet: { title: "Dokter Hewan", desc: "dokter hewan & klinik veteriner" },
  hotel: { title: "Pet Hotel", desc: "penitipan & hotel hewan peliharaan" },
  petshop: { title: "Pet Shop", desc: "toko hewan & aksesoris peliharaan" },
  sitter: { title: "Pet Sitter", desc: "jasa penitipan & penjagaan hewan" },
};

function slugToCategory(slug: string): ProviderCategory | null {
  return CATEGORY_SLUGS[slug] || null;
}

function decodeCity(encoded: string): string {
  return decodeURIComponent(encoded).replace(/-/g, " ");
}

function cityToSlug(city: string): string {
  return encodeURIComponent(city.replace(/\s+/g, "-").toLowerCase());
}

interface PageProps {
  params: Promise<{ category: string; city: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: catSlug, city: citySlug } = await params;
  const category = slugToCategory(catSlug);
  if (!category) return { title: "Tidak Ditemukan | BuluBulu.id" };

  const city = decodeCity(citySlug);
  const seo = CATEGORY_SEO[category];

  const title = `10+ ${seo.title} Terpercaya di ${city} - BuluBulu.id`;
  const description = `Cari jasa ${seo.desc} terbaik di ${city}. Cek rating, lokasi, dan hubungi langsung via WhatsApp. Gratis & Terverifikasi.`;

  return {
    title,
    description,
    keywords: [seo.title.toLowerCase(), city, "pet care", "hewan peliharaan", "whatsapp"],
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://bulubuluid.vercel.app/jasa/${catSlug}/${citySlug}`,
    },
    alternates: {
      canonical: `https://bulubuluid.vercel.app/jasa/${catSlug}/${citySlug}`,
    },
  };
}

export default async function JasaCategoryCity({ params }: PageProps) {
  const { category: catSlug, city: citySlug } = await params;
  const category = slugToCategory(catSlug);
  if (!category) notFound();

  const city = decodeCity(citySlug);
  const seo = CATEGORY_SEO[category];
  const catInfo = CATEGORIES.find((c) => c.value === category);
  const providers = await getProvidersByCategoryAndCity(category, city);

  const pageUrl = `https://bulubuluid.vercel.app/jasa/${catSlug}/${citySlug}`;

  return (
    <>
      <Header />
      <ItemListJsonLd
        providers={providers}
        title={`${seo.title} di ${city}`}
        url={pageUrl}
      />
      <main className="flex-1 bg-cream">
        <div className="max-w-2xl mx-auto px-5 py-5 space-y-5">
          {/* Back */}
          <Link
            href="/providers"
            className="animate-fade-up inline-flex items-center gap-1.5 text-sm font-medium text-warm-gray hover:text-terracotta transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke semua layanan
          </Link>

          {/* Title */}
          <div className="animate-fade-up stagger-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{catInfo?.emoji}</span>
              <h1 className="font-display font-extrabold text-xl text-bark">
                {seo.title} di {city}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 text-warm-gray">
              <MapPin className="h-3.5 w-3.5" />
              <p className="text-sm">
                {providers.length > 0
                  ? `${providers.length} jasa ${seo.desc} ditemukan`
                  : `Belum ada jasa ${seo.desc} terdaftar`}
              </p>
            </div>
          </div>

          {/* Breadcrumb for SEO */}
          <nav className="animate-fade-up stagger-1 text-xs text-warm-gray" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1 flex-wrap">
              <li><Link href="/" className="hover:text-terracotta transition-colors">Beranda</Link></li>
              <li>/</li>
              <li><Link href={`/providers?category=${category}`} className="hover:text-terracotta transition-colors">{seo.title}</Link></li>
              <li>/</li>
              <li className="text-bark font-medium">{city}</li>
            </ol>
          </nav>

          {/* Provider grid */}
          {providers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((provider, i) => (
                <ProviderCard key={provider.id} provider={provider} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-14 h-14 bg-cream-dark rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
                <PawPrint className="h-6 w-6 text-terracotta/40" />
              </div>
              <p className="font-display font-bold text-bark text-sm">
                Belum ada {seo.title.toLowerCase()} di {city}
              </p>
              <p className="mt-1.5 text-xs text-warm-gray">
                Coba cari di kota lain atau rekomendasikan jasa yang Anda kenal.
              </p>
            </div>
          )}

          {/* Related categories in same city */}
          <div className="bg-white rounded-2xl border border-bark/5 p-5 space-y-3">
            <h2 className="font-display font-bold text-sm text-bark">Layanan Lain di {city}</h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter((c) => c.value !== category).map((c) => {
                const slug = Object.entries(CATEGORY_SLUGS).find(([, v]) => v === c.value)?.[0];
                return (
                  <Link
                    key={c.value}
                    href={`/jasa/${slug}/${cityToSlug(city)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream-dark text-sm font-medium text-bark hover:bg-terracotta/10 hover:text-terracotta transition-colors"
                  >
                    <span>{c.emoji}</span>
                    {c.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
