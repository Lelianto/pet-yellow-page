"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation, Loader2, X } from "lucide-react";

export function NearMeButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const isActive = searchParams.has("lat") && searchParams.has("lng");

  function handleClear() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lat");
    params.delete("lng");
    router.push(`/providers?${params.toString()}`);
  }

  function handleClick() {
    if (isActive) {
      handleClear();
      return;
    }

    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung geolocation.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", position.coords.latitude.toFixed(6));
        params.set("lng", position.coords.longitude.toFixed(6));
        router.push(`/providers?${params.toString()}`);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          alert("Izin lokasi ditolak. Aktifkan izin lokasi di pengaturan browser Anda.");
        } else {
          alert("Gagal mendapatkan lokasi. Coba lagi.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
        isActive
          ? "bg-terracotta text-white border-transparent shadow-sm shadow-terracotta/20"
          : "bg-white text-bark-light border-bark/8 hover:border-terracotta/20 hover:text-terracotta"
      } disabled:opacity-50`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Navigation className="h-4 w-4" />
      )}
      {isActive ? (
        <>
          Dekat Saya
          <X className="h-3.5 w-3.5 ml-0.5" />
        </>
      ) : (
        "Dekat Saya"
      )}
    </button>
  );
}
