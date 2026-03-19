import Link from "next/link";
import { PawPrint, Search, Scissors, Stethoscope, Hotel, ShoppingBag } from "lucide-react";
import { Header } from "@/components/header";

const HERO_CATEGORIES = [
  { href: "/providers?category=grooming", icon: Scissors, label: "Grooming", color: "bg-pink-50 text-pink-600 hover:bg-pink-100" },
  { href: "/providers?category=vet", icon: Stethoscope, label: "Dokter Hewan", color: "bg-blue-50 text-blue-600 hover:bg-blue-100" },
  { href: "/providers?category=hotel", icon: Hotel, label: "Pet Hotel", color: "bg-purple-50 text-purple-600 hover:bg-purple-100" },
  { href: "/providers?category=petshop", icon: ShoppingBag, label: "Pet Shop", color: "bg-green-50 text-green-600 hover:bg-green-100" },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-amber-50 to-white px-4 pt-8 pb-12">
          <div className="max-w-lg mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
              <PawPrint className="h-4 w-4" />
              Layanan hewan terpercaya di sekitarmu
            </div>
            <h1 className="text-3xl font-bold text-amber-950 leading-tight">
              Temukan Layanan Terbaik<br />
              untuk <span className="text-amber-600">Anabulmu</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Grooming, dokter hewan, hotel, dan pet shop terdekat — langsung hubungi via WhatsApp.
            </p>

            <Link
              href="/providers"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium h-10 px-6 w-full max-w-xs transition-colors"
            >
              <Search className="h-4 w-4" />
              Cari Layanan
            </Link>
          </div>
        </section>

        {/* Category Grid */}
        <section className="px-4 -mt-6">
          <div className="max-w-lg mx-auto grid grid-cols-2 gap-3">
            {HERO_CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className={`flex flex-col items-center gap-2 p-5 rounded-2xl transition-colors ${cat.color}`}
              >
                <cat.icon className="h-7 w-7" />
                <span className="text-sm font-medium">{cat.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Info */}
        <section className="px-4 py-12">
          <div className="max-w-lg mx-auto text-center space-y-2">
            <h2 className="font-semibold text-amber-900">Kenapa AnabulCare?</h2>
            <div className="grid grid-cols-1 gap-4 mt-4 text-sm text-muted-foreground">
              <div className="space-y-1">
                <p className="font-medium text-amber-800">Lokal & Terpercaya</p>
                <p>Data dari Google Maps, diverifikasi komunitas.</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-amber-800">Hubungi Langsung</p>
                <p>Satu tap langsung chat WhatsApp — tanpa ribet.</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-amber-800">Home Service</p>
                <p>Filter layanan yang bisa datang ke rumahmu.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-amber-100 py-4 text-center text-xs text-muted-foreground">
        AnabulCare &mdash; Sayang Anabul, Sayang Pemiliknya
      </footer>
    </>
  );
}
