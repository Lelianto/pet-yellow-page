"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, X } from "lucide-react";

interface CityFilterProps {
  cities: string[];
}

export function CityFilter({ cities }: CityFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCity = searchParams.get("city");

  function handleChange(city: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (city) {
      params.set("city", city);
    } else {
      params.delete("city");
    }
    router.push(`/providers?${params.toString()}`);
  }

  if (cities.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray pointer-events-none" />
        <select
          value={activeCity || ""}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-bark/8 bg-white pl-9 pr-8 py-2 text-sm font-medium text-bark focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none cursor-pointer"
        >
          <option value="">Semua Kota</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {activeCity && (
        <button
          onClick={() => handleChange("")}
          className="shrink-0 p-2 rounded-xl bg-cream-dark text-warm-gray hover:text-terracotta transition-colors"
          title="Hapus filter kota"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
