"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { CATEGORIES, type ProviderCategory } from "@/lib/types";

const PILL_BASE = "shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border";
const PILL_ACTIVE = "bg-gradient-to-r from-terracotta to-terracotta-light text-white border-transparent shadow-sm shadow-terracotta/20";
const PILL_INACTIVE = "bg-white text-bark-light border-bark/8 hover:border-terracotta/20 hover:text-terracotta";

function pillCn(isActive: boolean) {
  return cn(PILL_BASE, isActive ? PILL_ACTIVE : PILL_INACTIVE);
}

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
    <>
      <button onClick={() => handleClick(null)} className={pillCn(!active)}>
        Semua
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => handleClick(cat.value)}
          className={pillCn(active === cat.value)}
        >
          {cat.emoji} {cat.label}
        </button>
      ))}
    </>
  );
}
