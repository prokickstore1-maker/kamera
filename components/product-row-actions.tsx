"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Star, Trash2, Pencil } from "lucide-react";
import {
  toggleMostWantedAction,
  toggleFeaturedAction,
  deleteProductAction,
} from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function ProductRowActions({
  productId,
  productName,
  isMostWanted,
  isFeatured,
}: {
  productId: string;
  productName: string;
  isMostWanted: boolean;
  isFeatured: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="inline-flex items-center gap-1">
      <Button
        asChild
        variant="outline"
        size="icon"
        title="Edit detail produk"
        aria-label={`Edit ${productName}`}
        className="h-8 w-8 rounded-full"
      >
        <Link href={`/admin/products/${productId}/edit`}>
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      </Button>

      <Button
        type="button"
        variant={isMostWanted ? "default" : "outline"}
        size="icon"
        disabled={pending}
        title={isMostWanted ? "Hapus dari Most Wanted" : "Tandai sebagai Most Wanted"}
        aria-label={isMostWanted ? "Hapus dari Most Wanted" : "Tandai sebagai Most Wanted"}
        onClick={() =>
          start(async () => {
            const r = await toggleMostWantedAction(productId);
            if (r.ok) {
              toast.success(
                r.isMostWanted
                  ? `${productName} ditambahkan ke Most Wanted.`
                  : `${productName} dihapus dari Most Wanted.`
              );
              router.refresh();
            } else {
              toast.error(r.error ?? "Gagal mengubah status Most Wanted.");
            }
          })
        }
        className="h-8 w-8 rounded-full"
      >
        <Flame className="h-3.5 w-3.5" />
      </Button>

      <Button
        type="button"
        variant={isFeatured ? "default" : "outline"}
        size="icon"
        disabled={pending}
        title={isFeatured ? "Hapus dari Unggulan" : "Tandai sebagai Unggulan"}
        aria-label={isFeatured ? "Hapus dari Unggulan" : "Tandai sebagai Unggulan"}
        onClick={() =>
          start(async () => {
            const r = await toggleFeaturedAction(productId);
            if (r.ok) {
              toast.success(
                r.isFeatured
                  ? `${productName} dijadikan produk unggulan.`
                  : `${productName} dihapus dari produk unggulan.`
              );
              router.refresh();
            } else {
              toast.error(r.error ?? "Gagal mengubah status unggulan.");
            }
          })
        }
        className="h-8 w-8 rounded-full"
      >
        <Star className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={pending}
            title="Hapus produk"
            aria-label={`Hapus ${productName}`}
            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold">Hapus Kamera dari Katalog?</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Anda yakin ingin menghapus <strong>{productName}</strong>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" className="rounded-full text-xs">
                Batal
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={() => {
                start(async () => {
                  const r = await deleteProductAction(productId);
                  if (r.ok) {
                    setDeleteOpen(false);
                    toast.success(`${productName} berhasil dihapus.`);
                    router.refresh();
                  } else {
                    toast.error(r.error ?? "Gagal menghapus produk.");
                  }
                });
              }}
              className="rounded-full text-xs font-bold"
            >
              {pending ? "Menghapus…" : "Ya, Hapus Produk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

