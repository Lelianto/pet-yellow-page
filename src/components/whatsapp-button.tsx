import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  phone: string;
  providerName: string;
  className?: string;
  size?: "sm" | "default";
}

export function WhatsAppButton({ phone, providerName, className, size = "default" }: WhatsAppButtonProps) {
  if (!phone) return null;

  const message = encodeURIComponent(
    `Halo ${providerName}, saya menemukan layanan Anda di BuluBulu.id. Saya ingin bertanya tentang layanan yang tersedia.`
  );
  const href = `https://wa.me/${phone}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 bg-wa-green hover:bg-wa-green-dark text-white hover:shadow-md hover:shadow-wa-green/20 active:translate-y-px",
        size === "sm" ? "h-9 px-4 text-sm" : "h-11 px-5",
        className
      )}
    >
      <MessageCircle className="h-4 w-4" />
      Hubungi via WhatsApp
    </a>
  );
}
