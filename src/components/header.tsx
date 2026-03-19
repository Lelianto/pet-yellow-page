import Link from "next/link";
import { PawPrint, UserPlus } from "lucide-react";
import { HeaderAuth } from "@/components/header-auth";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-cream/85 backdrop-blur-lg border-b border-terracotta/8">
      <div className="max-w-2xl mx-auto flex items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative bg-gradient-to-br from-terracotta to-terracotta-light p-2 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
            <PawPrint className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="font-display font-extrabold text-lg tracking-tight text-bark">
              BuluBulu
            </span>
            <span className="font-display font-bold text-sm text-terracotta">.id</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/gabung-mitra"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-bark-light hover:text-terracotta transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden md:inline">Gabung Mitra</span>
          </Link>
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
