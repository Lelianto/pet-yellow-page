"use client";

import { Star, Quote } from "lucide-react";
import type { TopReview } from "@/lib/providers";

interface TestimonialCarouselProps {
  reviews: TopReview[];
}

export function TestimonialCarousel({ reviews }: TestimonialCarouselProps) {
  if (reviews.length === 0) return null;

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
      <div className="flex gap-3" style={{ scrollSnapType: "x mandatory" }}>
        {reviews.map((review, i) => (
          <div
            key={`${review.author}-${i}`}
            className="shrink-0 w-[280px] sm:w-[320px] bg-white rounded-2xl border border-bark/5 p-5 space-y-3"
            style={{ scrollSnapAlign: "start" }}
          >
            <Quote className="h-5 w-5 text-terracotta/20" />
            <p className="text-sm text-bark leading-relaxed line-clamp-4">
              {review.text}
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star
                  key={j}
                  className={`h-3 w-3 ${j < review.rating ? "text-amber-400 fill-amber-400" : "text-bark/10"}`}
                />
              ))}
            </div>
            <div className="pt-1 border-t border-bark/5">
              <p className="text-xs font-semibold text-bark">{review.author}</p>
              <p className="text-[11px] text-warm-gray">untuk {review.providerName}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
