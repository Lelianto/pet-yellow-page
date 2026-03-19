"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";
import { CATEGORIES } from "@/lib/types";

interface HeroSearchBarProps {
  cities: string[];
}

export function HeroSearchBar({ cities }: HeroSearchBarProps) {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  function handleSearch() {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (city) params.set("city", city);
    router.push(`/providers${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-bark/8 shadow-lg shadow-bark/5 p-2 flex flex-col sm:flex-row gap-2">
        {/* Category select */}
        <div className="relative flex-1">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full appearance-none bg-cream/60 rounded-xl px-3.5 py-2.5 text-sm text-bark font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-terracotta/20 transition-colors cursor-pointer"
          >
            <option value="">Semua Kategori</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.emoji} {cat.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-warm-gray pointer-events-none" />
        </div>

        {/* City select */}
        <div className="relative flex-1">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full appearance-none bg-cream/60 rounded-xl px-3.5 py-2.5 text-sm text-bark font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-terracotta/20 transition-colors cursor-pointer"
          >
            <option value="">Semua Kota</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-warm-gray pointer-events-none" />
        </div>

        {/* Search button */}
        <button
          onClick={handleSearch}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-terracotta to-terracotta-light text-white font-semibold px-5 py-2.5 text-sm transition-all duration-300 hover:shadow-md hover:shadow-terracotta/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <Search className="h-4 w-4" />
          <span>Cari</span>
        </button>
      </div>
    </div>
  );
}
