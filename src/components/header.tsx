import Link from "next/link";
import { Cat } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-amber-100">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-amber-100 p-1.5 rounded-lg">
            <Cat className="h-5 w-5 text-amber-600" />
          </div>
          <span className="font-bold text-lg text-amber-900">AnabulCare</span>
        </Link>
      </div>
    </header>
  );
}
