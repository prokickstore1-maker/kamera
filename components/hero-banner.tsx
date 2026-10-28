"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  ctaText: string | null;
  ctaUrl: string | null;
};

export function HeroBanner({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => setIndex((n) => (n + 1) % banners.length), 7000);
    return () => clearInterval(id);
  }, [banners.length]);

  if (!banners.length) return null;
  const b = banners[Math.min(index, banners.length - 1)];

  return (
    <div className="relative">
      <div className="relative aspect-[16/7] sm:aspect-[16/5] w-full overflow-hidden rounded-2xl border border-border bg-secondary shadow-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={b.imageUrl}
          alt={b.title}
          loading={index === 0 ? "eager" : "lazy"}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
        <div className="absolute inset-y-0 left-0 flex max-w-[75%] flex-col justify-center gap-2 p-4 sm:p-7">
          <h2 className="text-base sm:text-2xl font-extrabold leading-tight text-white">{b.title}</h2>
          {b.subtitle && <p className="hidden sm:block text-xs sm:text-sm text-white/90 leading-relaxed">{b.subtitle}</p>}
          {b.ctaText && b.ctaUrl && (
            <Link
              href={b.ctaUrl}
              className="mt-1 inline-flex h-9 w-fit items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-foreground hover:bg-white/90 transition-colors"
            >
              <span>{b.ctaText}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {banners.length > 1 && (
        <div className="mt-2 flex justify-center gap-1" role="tablist" aria-label="Pilih slide banner">
          {banners.map((x, i) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Tampilkan banner ${i + 1}`}
              onClick={() => setIndex(i)}
              className="inline-flex h-8 items-center justify-center px-1.5 focus:outline-none"
            >
              <span
                className={`block h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-primary" : "w-2 bg-border hover:bg-primary/50"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
