import Link from "next/link";
import { conditionLabel } from "@/lib/condition";
import { rupiah } from "@/lib/format";
import type { ProductListItem } from "@/lib/catalog";
import { Badge } from "@/components/ui/badge";
import { CameraOff } from "lucide-react";

export function ProductCard({ p, priority = false }: { p: ProductListItem; priority?: boolean }) {
  const label = conditionLabel(p.conditionGrade);
  const soldOut = p.stock <= 0;
  return (
    <Link
      href={`/product/${p.slug}`}
      className="y2k-card group flex flex-col overflow-hidden bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="camera-viewfinder-frame relative aspect-[4/3] w-full overflow-hidden bg-secondary/40">
        {p.primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.primaryImage}
            alt={p.name}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Tanpa foto</div>
        )}

        {soldOut ? (
          <Badge
            variant="destructive"
            className="absolute left-2.5 top-2.5 text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full shadow-xs"
          >
            Terjual
          </Badge>
        ) : label ? (
          <span
            className="absolute right-2.5 top-2.5 bg-card/95 text-secondary-foreground border border-primary/25 text-[10px] font-bold px-2.5 py-0.5 tracking-wider uppercase backdrop-blur rounded-full shadow-xs"
          >
            {p.conditionGrade ? `${Number(p.conditionGrade).toFixed(1).replace(".0", "")}/10 ` : ""}{label}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
        {p.brandName && (
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            {p.brandName}
          </p>
        )}
        <p className="line-clamp-1 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
          {p.name}
        </p>

        <div className="mt-auto pt-2.5 flex items-baseline justify-between gap-2 border-t border-border/60">
          <p className="text-sm font-extrabold font-mono text-primary shrink-0">{rupiah(p.priceIdr)}</p>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground shrink-0">
            {soldOut ? "Habis" : "Siap Pakai"}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="y2k-card flex flex-col items-center gap-2.5 py-16 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
        <CameraOff className="h-6 w-6" aria-hidden />
      </div>
      <p className="font-bold text-foreground">{title}</p>
      {hint && <p className="text-xs sm:text-sm text-muted-foreground max-w-md">{hint}</p>}
    </div>
  );
}
