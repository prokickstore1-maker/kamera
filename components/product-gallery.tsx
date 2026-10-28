"use client";

import { useState } from "react";

export function ProductGallery({ images, name }: { images: { url: string; kind: string }[]; name: string }) {
  const [active, setActive] = useState(0);
  if (!images.length) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-border bg-secondary text-sm text-muted-foreground">
        Belum ada foto
      </div>
    );
  }
  const img = images[Math.min(active, images.length - 1)];
  return (
    <div className="space-y-3">
      <div className="camera-viewfinder-frame relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-secondary/60 shadow-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.url}
          alt={`${name} foto ${active + 1}`}
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
        {img.kind === "sample" && (
          <span className="absolute top-3 right-3 rounded-full bg-foreground/85 backdrop-blur px-3 py-1 text-[10px] font-bold text-background uppercase tracking-wider">
            Hasil Jepretan Asli
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2.5">
          {images.map((im, i) => (
            <button
              key={`${im.url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Lihat foto ${i + 1} dari ${images.length}`}
              aria-current={i === active ? "true" : undefined}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                i === active
                  ? "border-primary shadow-xs"
                  : "border-border/70 opacity-80 hover:opacity-100 hover:border-primary/50"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={im.url}
                alt={`${name} pratinjau ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {im.kind === "sample" && (
                <span className="absolute inset-x-0 bottom-0 bg-foreground/75 py-0.5 text-center text-[9px] font-bold uppercase tracking-wider text-background">
                  Sampel
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
