import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
    `Halo ${providerName}, saya menemukan layanan Anda di AnabulCare. Saya ingin bertanya tentang layanan yang tersedia.`
  );
  const href = `https://wa.me/${phone}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ size, variant: "default" }),
        "bg-green-500 hover:bg-green-600 text-white",
        className
      )}
    >
      <MessageCircle className="h-4 w-4" />
      WhatsApp
    </a>
  );
}
