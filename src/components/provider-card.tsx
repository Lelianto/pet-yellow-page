import Link from "next/link";
import { Star, Home, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { CATEGORIES, type Provider } from "@/lib/types";

interface ProviderCardProps {
  provider: Provider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const category = CATEGORIES.find((c) => c.value === provider.category);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/providers/${provider.id}`}>
        {provider.photo_url && (
          <div className="aspect-video bg-amber-50 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={provider.photo_url}
              alt={provider.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {!provider.photo_url && (
          <div className="aspect-video bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
            <span className="text-4xl">{category?.emoji || "🐾"}</span>
          </div>
        )}
      </Link>

      <CardContent className="p-4 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link href={`/providers/${provider.id}`} className="hover:underline">
              <h3 className="font-semibold text-amber-900 line-clamp-1">
                {provider.name}
              </h3>
            </Link>
            {provider.is_verified && (
              <CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
            {provider.address}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-xs">
            {category?.emoji} {category?.label}
          </Badge>
          {provider.rating > 0 && (
            <span className="flex items-center gap-1 text-sm text-amber-600">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {provider.rating.toFixed(1)}
            </span>
          )}
          {provider.is_home_service && (
            <Badge variant="outline" className="text-xs border-green-200 text-green-700">
              <Home className="h-3 w-3 mr-1" />
              Home Service
            </Badge>
          )}
        </div>

        <WhatsAppButton
          phone={provider.whatsapp_number}
          providerName={provider.name}
          size="sm"
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}
