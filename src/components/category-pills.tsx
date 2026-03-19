"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { CATEGORIES, type ProviderCategory } from "@/lib/types";

export function CategoryPills() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("category") as ProviderCategory | null;

  function handleClick(category: ProviderCategory | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    router.push(`/providers?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => handleClick(null)}
        className={cn(
          "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
          !active
            ? "bg-amber-500 text-white shadow-sm"
            : "bg-amber-50 text-amber-700 hover:bg-amber-100"
        )}
      >
        Semua
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => handleClick(cat.value)}
          className={cn(
            "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
            active === cat.value
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
          )}
        >
          {cat.emoji} {cat.label}
        </button>
      ))}
    </div>
  );
}
