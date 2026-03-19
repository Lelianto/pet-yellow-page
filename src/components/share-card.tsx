"use client";

import { useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { Share2, Download, Loader2, Star, MapPin, PawPrint, Link2, Check } from "lucide-react";
import { CATEGORIES, type Provider } from "@/lib/types";

interface ShareCardProps {
  provider: Provider;
}

function ShareCardTemplate({ provider, cardRef }: { provider: Provider; cardRef: React.RefObject<HTMLDivElement | null> }) {
  const category = CATEGORIES.find((c) => c.value === provider.category);
  const providerUrl = `https://bulubulu.biz.id/providers/${provider.id}`;
  const stars = Math.round(provider.rating);

  return (
    <div
      ref={cardRef}
      style={{
        width: 1080,
        height: 1080,
        fontFamily: "'Plus Jakarta Sans', 'Nunito', sans-serif",
        background: "linear-gradient(135deg, #FFF9F0 0%, #FFF0DE 40%, #FDE4EC 100%)",
        display: "flex",
        flexDirection: "column",
        padding: 80,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background paw prints */}
      <div style={{ position: "absolute", top: -40, right: -40, opacity: 0.05, fontSize: 300 }}>🐾</div>
      <div style={{ position: "absolute", bottom: -30, left: -30, opacity: 0.04, fontSize: 250 }}>🐾</div>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: "linear-gradient(135deg, #C75B39, #E8845F)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <PawPrint style={{ width: 28, height: 28, color: "white" }} />
        </div>
        <span style={{ fontSize: 28, fontWeight: 800, color: "#3D2B1F", letterSpacing: -0.5 }}>
          BuluBulu
        </span>
      </div>

      {/* Category badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "rgba(199, 91, 57, 0.1)", borderRadius: 20,
        padding: "8px 20px", marginBottom: 24, alignSelf: "flex-start",
      }}>
        <span style={{ fontSize: 22 }}>{category?.emoji}</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#C75B39" }}>{category?.label}</span>
      </div>

      {/* Provider name */}
      <h1 style={{
        fontSize: 64, fontWeight: 900, color: "#3D2B1F",
        lineHeight: 1.15, marginBottom: 20, maxWidth: 700,
        letterSpacing: -1,
      }}>
        {provider.name}
      </h1>

      {/* Rating */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              style={{
                width: 28, height: 28,
                fill: i < stars ? "#F59E0B" : "#D1D5DB",
                color: i < stars ? "#F59E0B" : "#D1D5DB",
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 24, fontWeight: 700, color: "#3D2B1F" }}>
          {provider.rating.toFixed(1)}
        </span>
        <span style={{ fontSize: 20, color: "#8B7E74" }}>
          ({provider.review_count} ulasan)
        </span>
      </div>

      {/* Location */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <MapPin style={{ width: 22, height: 22, color: "#C75B39" }} />
        <span style={{ fontSize: 22, color: "#8B7E74", maxWidth: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {provider.area_city || provider.address}
        </span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom row: QR + CTA */}
      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        background: "white", borderRadius: 24, padding: 36,
        border: "1px solid rgba(61, 43, 31, 0.06)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          <span style={{ fontSize: 18, color: "#8B7E74", fontWeight: 500 }}>
            Scan untuk lihat detail & hubungi
          </span>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#C75B39" }}>
            via WhatsApp
          </span>
          <span style={{ fontSize: 16, color: "#8B7E74", marginTop: 8 }}>
            bulubulu.biz.id
          </span>
        </div>
        <div style={{
          background: "white", borderRadius: 16, padding: 12,
          border: "2px solid rgba(199, 91, 57, 0.15)",
        }}>
          <QRCodeSVG
            value={providerUrl}
            size={160}
            level="M"
            bgColor="white"
            fgColor="#3D2B1F"
          />
        </div>
      </div>
    </div>
  );
}

export function ShareButton({ provider }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const dataUrl = await toPng(cardRef.current, {
      pixelRatio: 1,
      cacheBust: true,
    });
    const res = await fetch(dataUrl);
    return res.blob();
  }, []);

  const handleShare = useCallback(async () => {
    setGenerating(true);
    try {
      const blob = await generateImage();
      if (!blob) return;

      const file = new File([blob], `${provider.name.replace(/\s+/g, "-").toLowerCase()}-bulubulu.png`, {
        type: "image/png",
      });

      const shareUrl = `https://bulubulu.biz.id/providers/${provider.id}`;
      const shareText = `${provider.name} — layanan ${CATEGORIES.find(c => c.value === provider.category)?.label?.toLowerCase()} terpercaya!\n\nCek di BuluBulu:\n${shareUrl}`;

      // Copy text + link to clipboard first, so user can paste it after sharing the image
      try {
        await navigator.clipboard.writeText(shareText);
      } catch {
        // Clipboard write may fail in some contexts, continue with share
      }

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: provider.name,
          text: shareText,
          url: shareUrl,
          files: [file],
        });
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Share error:", err);
      }
    } finally {
      setGenerating(false);
    }
  }, [provider, generateImage]);

  const handleDownload = useCallback(async () => {
    setGenerating(true);
    try {
      const blob = await generateImage();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${provider.name.replace(/\s+/g, "-").toLowerCase()}-bulubulu.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setGenerating(false);
    }
  }, [provider, generateImage]);

  const handleCopyLink = useCallback(async () => {
    const shareUrl = `https://bulubulu.biz.id/providers/${provider.id}`;
    const text = `${provider.name} — layanan ${CATEGORIES.find(c => c.value === provider.category)?.label?.toLowerCase()} terpercaya!\n\nCek di BuluBulu:\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Copy error:", err);
    }
  }, [provider]);

  return (
    <>
      {/* Hidden card for image generation */}
      <div style={{ position: "absolute", left: -9999, top: -9999, overflow: "hidden" }}>
        <ShareCardTemplate provider={provider} cardRef={cardRef} />
      </div>

      {/* Share buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleShare}
          disabled={generating}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl font-semibold h-11 px-5 bg-paw-pink-light text-terracotta hover:bg-paw-pink/30 transition-colors active:translate-y-px disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          Bagikan
        </button>
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold h-11 px-4 bg-cream-dark text-bark hover:bg-bark/10 transition-colors active:translate-y-px"
          title="Salin link"
        >
          {linkCopied ? <Check className="h-4 w-4 text-sage" /> : <Link2 className="h-4 w-4" />}
        </button>
        <button
          onClick={handleDownload}
          disabled={generating}
          className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold h-11 px-4 bg-cream-dark text-bark hover:bg-bark/10 transition-colors active:translate-y-px disabled:opacity-50"
          title="Download gambar"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
