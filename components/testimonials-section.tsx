"use client";

import { useRef } from "react";
import { Star, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TestimonialItem = {
  id: string;
  customerName: string;
  rating: number;
  content: string;
  screenshotUrl: string | null;
};

export function TestimonialsSection({
  items,
  title = "Pengalaman Pembeli",
  subtitle = "Testimoni & Hasil Jepretan",
}: {
  items: TestimonialItem[];
  title?: string;
  subtitle?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (!items.length) return null;

  function scrollByCards(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 260, behavior: "smooth" });
  }

  return (
    <section className="mt-10 sm:mt-12 pt-6 border-t border-border">
      <div className="mb-3.5 flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
            {subtitle}
          </p>
          <h2 className="text-base font-extrabold tracking-tight sm:text-lg text-foreground">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => scrollByCards(-1)}
            aria-label="Geser testimoni ke kiri"
            className="h-8 w-8 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => scrollByCards(1)}
            aria-label="Geser testimoni ke kanan"
            className="h-8 w-8 rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {items.map((t) => {
          const stars = Math.min(5, Math.max(1, t.rating || 5));
          return (
            <figure
              key={t.id}
              className="y2k-card snap-start shrink-0 w-[210px] sm:w-[235px] flex flex-col justify-between overflow-hidden p-3"
            >
              <div className="space-y-2.5">
                {t.screenshotUrl && (
                  <a
                    href={t.screenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="camera-viewfinder-frame block aspect-square w-full overflow-hidden rounded-xl border border-border bg-secondary/40 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.screenshotUrl}
                      alt={`Testimoni dari ${t.customerName}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </a>
                )}

                <div
                  className="flex items-center gap-0.5 text-primary"
                  aria-label={`Rating ${stars} dari 5 bintang`}
                >
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-3 w-3 ${
                        idx < stars
                          ? "fill-primary text-primary"
                          : "fill-muted text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>

                {t.content && (
                  <blockquote className="line-clamp-3 text-[11px] leading-relaxed text-foreground/90">
                    &ldquo;{t.content}&rdquo;
                  </blockquote>
                )}
              </div>

              <figcaption className="mt-2.5 flex items-center justify-between border-t border-border/70 pt-2 text-[11px]">
                <span className="font-bold text-foreground truncate max-w-[115px]">
                  {t.customerName}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Verified</span>
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
