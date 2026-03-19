import { SERVICES } from "@/lib/types";

interface ServiceChipsProps {
  services: string[];
  size?: "sm" | "default";
}

export function ServiceChips({ services, size = "default" }: ServiceChipsProps) {
  if (!services || services.length === 0) return null;

  const isSmall = size === "sm";
  const padding = isSmall ? "px-2 py-0.5" : "px-2.5 py-1";
  const textSize = isSmall ? "text-[10px]" : "text-xs";

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {services.map((svcId) => {
        const svc = SERVICES[svcId];
        if (!svc) return null;
        return (
          <span
            key={svcId}
            className={`inline-flex items-center gap-1 ${padding} ${textSize} font-medium rounded-md bg-cream-dark text-bark-light`}
          >
            <span>{svc.emoji}</span>
            {svc.label}
          </span>
        );
      })}
    </div>
  );
}
