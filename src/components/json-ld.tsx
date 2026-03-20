import type { Provider } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** LocalBusiness schema for individual provider page */
export function LocalBusinessJsonLd({ provider }: { provider: Provider }) {
  const category = CATEGORIES.find((c) => c.value === provider.category);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: provider.name,
    description: provider.description || `Layanan ${category?.label?.toLowerCase()} terpercaya`,
    address: {
      "@type": "PostalAddress",
      streetAddress: provider.address,
      addressLocality: provider.area_city || "",
      addressRegion: provider.area_province || "",
      addressCountry: "ID",
    },
    url: `https://bulubulu.biz.id/providers/${provider.id}`,
  };

  if (provider.location.latitude !== 0) {
    data.geo = {
      "@type": "GeoCoordinates",
      latitude: provider.location.latitude,
      longitude: provider.location.longitude,
    };
  }

  if (provider.rating > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: provider.rating,
      reviewCount: provider.review_count || 1,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (provider.whatsapp_number) {
    data.telephone = `+${provider.whatsapp_number}`;
  }

  if (provider.website) {
    data.sameAs = [provider.website];
  }

  if (provider.opening_hours_text && provider.opening_hours_text.length > 0) {
    data.openingHoursSpecification = provider.opening_hours_text;
  }

  if (provider.reviews && provider.reviews.length > 0) {
    data.review = provider.reviews.slice(0, 3).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
      },
      reviewBody: r.text,
    }));
  }

  return <JsonLd data={data} />;
}

/** ItemList schema for directory listing pages */
export function ItemListJsonLd({ providers, title, url }: {
  providers: Provider[];
  title: string;
  url: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    url,
    numberOfItems: providers.length,
    itemListElement: providers.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: p.name,
        url: `https://bulubulu.biz.id/providers/${p.id}`,
        address: p.address,
        ...(p.rating > 0 && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: p.rating,
            reviewCount: p.review_count || 1,
          },
        }),
      },
    })),
  };

  return <JsonLd data={data} />;
}
