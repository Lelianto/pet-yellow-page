export const revalidate = 3600; // ISR: revalidate every hour

import Link from "next/link";
import {
  PawPrint,
  Search,
  Scissors,
  Stethoscope,
  Hotel,
  ShoppingBag,
  Heart,
  MapPin,
  MessageCircle,
  Star,
  Users,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { Header } from "@/components/header";
import { HeroSearchBar } from "@/components/hero-search-bar";
import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { readHomepageCache } from "@/lib/homepage-cache";
import {
  getAvailableCities,
  getAggregateStats,
  getTopCities,
  getTopReviews,
} from "@/lib/providers";

const HERO_CATEGORIES = [
  {
    href: "/providers?category=grooming",
    icon: Scissors,
    label: "Grooming",
    desc: "Mandi, potong bulu, spa",
    bg: "bg-paw-pink-light",
    iconBg: "bg-paw-pink/20",
    iconColor: "text-terracotta-light",
    hoverBg: "hover:bg-paw-pink/15",
  },
  {
    href: "/providers?category=vet",
    icon: Stethoscope,
    label: "Dokter Hewan",
    desc: "Vaksin, periksa, operasi",
    bg: "bg-sky-light",
    iconBg: "bg-sky-soft/20",
    iconColor: "text-sky-soft",
    hoverBg: "hover:bg-sky-soft/15",
  },
  {
    href: "/providers?category=hotel",
    icon: Hotel,
    label: "Pet Hotel",
    desc: "Penitipan aman & nyaman",
    bg: "bg-lavender-light",
    iconBg: "bg-lavender/20",
    iconColor: "text-lavender",
    hoverBg: "hover:bg-lavender/15",
  },
  {
    href: "/providers?category=petshop",
    icon: ShoppingBag,
    label: "Pet Shop",
    desc: "Makanan, aksesoris, mainan",
    bg: "bg-sage-light",
    iconBg: "bg-sage/20",
    iconColor: "text-sage",
    hoverBg: "hover:bg-sage/15",
  },
];

const FEATURES = [
  {
    icon: MapPin,
    title: "Lokal & Terdekat",
    desc: "Data langsung dari Google Maps, terverifikasi komunitas lokal.",
    color: "text-terracotta",
    bg: "bg-terracotta/8",
  },
  {
    icon: MessageCircle,
    title: "Satu Tap WhatsApp",
    desc: "Langsung chat penyedia layanan tanpa ribet, tanpa registrasi.",
    color: "text-wa-green",
    bg: "bg-wa-green/8",
  },
  {
    icon: Heart,
    title: "Home Service",
    desc: "Temukan layanan yang bisa datang langsung ke rumahmu.",
    color: "text-paw-pink",
    bg: "bg-paw-pink/12",
  },
];

const HOW_IT_WORKS = [
  {
    icon: Search,
    title: "Cari layanan",
    desc: "Pilih kategori dan kota untuk menemukan layanan terdekat.",
    color: "text-terracotta",
    bg: "bg-terracotta/8",
  },
  {
    icon: Star,
    title: "Bandingkan rating & ulasan",
    desc: "Lihat penilaian dari komunitas untuk pilihan terbaik.",
    color: "text-amber-500",
    bg: "bg-amber-500/8",
  },
  {
    icon: MessageCircle,
    title: "Hubungi via WhatsApp",
    desc: "Langsung chat penyedia layanan tanpa perlu registrasi.",
    color: "text-wa-green",
    bg: "bg-wa-green/8",
  },
];

const PASTEL_COLORS = [
  "bg-paw-pink-light text-terracotta",
  "bg-sky-light text-sky-soft",
  "bg-lavender-light text-lavender",
  "bg-sage-light text-sage",
  "bg-cream-dark text-bark-light",
  "bg-paw-pink-light text-terracotta-light",
  "bg-sky-light text-sky-soft",
  "bg-lavender-light text-lavender",
];

export default async function HomePage() {
  // Try cached data first (1 read), fall back to full scan (4 reads)
  const cache = await readHomepageCache();

  const cities = cache?.cities ?? await getAvailableCities();
  const stats = cache?.stats ?? await getAggregateStats();
  const topCities = cache?.topCities ?? await getTopCities(8);
  const topReviews = cache?.topReviews ?? await getTopReviews(8);

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative">
          {/* Background layers — wrapped in overflow-hidden so blurs don't leak, but dropdown can escape */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cream-dark via-cream to-cream" />
            <div className="absolute inset-0 paw-pattern opacity-40" />
            <div className="absolute top-0 right-0 w-72 h-72 bg-terracotta/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-paw-pink/8 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto px-5 pt-10 pb-20 md:pt-16 md:pb-28">
            <div className="text-center space-y-5">
              {/* Badge */}
              <div className="animate-fade-up inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-terracotta/10 text-bark-light px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">
                <PawPrint className="h-3.5 w-3.5 text-terracotta animate-paw-bounce" />
                Direktori layanan hewan #1
              </div>

              {/* Heading */}
              <h1 className="animate-fade-up stagger-1 font-display font-extrabold text-4xl md:text-5xl text-bark leading-[1.15] tracking-tight">
                Temukan yang Terbaik
                <br />
                untuk{" "}
                <span className="text-gradient">Si Berbulu</span>
              </h1>

              {/* Subheading */}
              <p className="animate-fade-up stagger-2 text-warm-gray text-base md:text-lg max-w-md mx-auto leading-relaxed">
                Grooming, dokter hewan, hotel, dan pet shop terdekat &mdash; hubungi langsung via WhatsApp.
              </p>

              {/* Search Bar */}
              <div className="animate-fade-up stagger-3 pt-1">
                <HeroSearchBar cities={cities} />
              </div>
            </div>
          </div>
        </section>

        {/* Trust Signals / Stats Strip */}
        <section className="relative z-20 -mt-6 px-5">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-bark/5 shadow-sm p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <Users className="h-4 w-4 text-terracotta" />
                  <span className="font-display font-extrabold text-2xl text-bark">{stats.totalProviders}</span>
                </div>
                <p className="text-xs text-warm-gray">Penyedia Layanan</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-400" />
                  <span className="font-display font-extrabold text-2xl text-bark">{stats.totalReviews}</span>
                </div>
                <p className="text-xs text-warm-gray">Total Ulasan</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <Building2 className="h-4 w-4 text-sky-soft" />
                  <span className="font-display font-extrabold text-2xl text-bark">{stats.totalCities}</span>
                </div>
                <p className="text-xs text-warm-gray">Kota Terjangkau</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-sage" />
                  <span className="font-display font-extrabold text-2xl text-bark">{stats.verifiedProviders}</span>
                </div>
                <p className="text-xs text-warm-gray">Terverifikasi</p>
              </div>
            </div>
          </div>
        </section>

        {/* Category Grid */}
        <section className="px-5 mt-6 relative z-20">
          <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
            {HERO_CATEGORIES.map((cat, i) => (
              <Link
                key={cat.label}
                href={cat.href}
                className={`animate-scale-in stagger-${i + 2} group flex flex-col gap-3 p-4 md:p-5 rounded-2xl border border-transparent ${cat.bg} ${cat.hoverBg} transition-all duration-300 card-lift`}
              >
                <div className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center`}>
                  <cat.icon className={`h-5 w-5 ${cat.iconColor}`} />
                </div>
                <div>
                  <span className="font-display font-bold text-sm text-bark block">{cat.label}</span>
                  <span className="text-xs text-warm-gray mt-0.5 block">{cat.desc}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="px-5 py-14 md:py-20">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-display font-extrabold text-xl md:text-2xl text-bark">
                Cara <span className="text-terracotta">Kerjanya</span>
              </h2>
              <p className="text-sm text-warm-gray mt-1.5">3 langkah mudah menemukan layanan terbaik</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {HOW_IT_WORKS.map((step, i) => (
                <div
                  key={step.title}
                  className={`animate-fade-up stagger-${i + 2} relative group rounded-2xl bg-white border border-bark/5 p-5 transition-all hover:border-terracotta/10 hover:shadow-sm`}
                >
                  <div className="absolute -top-3 -left-1 w-7 h-7 rounded-full bg-terracotta text-white text-xs font-bold flex items-center justify-center shadow-sm">
                    {i + 1}
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${step.bg} flex items-center justify-center mb-3`}>
                    <step.icon className={`h-5 w-5 ${step.color}`} />
                  </div>
                  <h3 className="font-display font-bold text-sm text-bark mb-1">{step.title}</h3>
                  <p className="text-xs text-warm-gray leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features / Kenapa BuluBulu? */}
        <section className="px-5 pb-14 md:pb-20">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-display font-extrabold text-xl md:text-2xl text-bark">
                Kenapa <span className="text-terracotta">BuluBulu</span>?
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {FEATURES.map((feat, i) => (
                <div
                  key={feat.title}
                  className={`animate-fade-up stagger-${i + 2} group rounded-2xl bg-white border border-bark/5 p-5 transition-all hover:border-terracotta/10 hover:shadow-sm`}
                >
                  <div className={`w-10 h-10 rounded-xl ${feat.bg} flex items-center justify-center mb-3`}>
                    <feat.icon className={`h-5 w-5 ${feat.color}`} />
                  </div>
                  <h3 className="font-display font-bold text-sm text-bark mb-1">{feat.title}</h3>
                  <p className="text-xs text-warm-gray leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Kota Populer */}
        {topCities.length > 0 && (
          <section className="px-5 pb-14 md:pb-20">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="font-display font-extrabold text-xl md:text-2xl text-bark">
                  Kota <span className="text-terracotta">Populer</span>
                </h2>
                <p className="text-sm text-warm-gray mt-1.5">Temukan layanan pet care di kotamu</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2.5">
                {topCities.map((city, i) => (
                  <Link
                    key={city.name}
                    href={`/providers?city=${encodeURIComponent(city.name)}`}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-sm hover:-translate-y-0.5 ${PASTEL_COLORS[i % PASTEL_COLORS.length]}`}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {city.name}
                    <span className="text-xs opacity-70">{city.count} layanan</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Testimonials */}
        {topReviews.length > 0 && (
          <section className="pb-14 md:pb-20">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8 px-5">
                <h2 className="font-display font-extrabold text-xl md:text-2xl text-bark">
                  Kata <span className="text-terracotta">Mereka</span>
                </h2>
                <p className="text-sm text-warm-gray mt-1.5">Ulasan dari pemilik hewan peliharaan</p>
              </div>
              <TestimonialCarousel reviews={topReviews} />
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-bark/5 bg-white/50 py-6">
        <div className="max-w-2xl mx-auto px-5 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5">
            <PawPrint className="h-3.5 w-3.5 text-terracotta/50" />
            <span className="font-display font-bold text-sm text-bark/40">BuluBulu</span>
          </div>
          <p className="text-xs text-warm-gray/60">
            Sayang Bulu, Sayang Pemiliknya
          </p>
        </div>
      </footer>
    </>
  );
}
