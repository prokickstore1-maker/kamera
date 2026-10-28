"use client";

import { useState } from "react";
import { uploadProof } from "@/lib/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, UploadCloud, AlertCircle } from "lucide-react";

const MAX_BYTES = 1024 * 1024;

export function ProofUpload({
  orderId,
  initialUploadedAt,
}: {
  orderId: string;
  initialUploadedAt?: string | null;
}) {
  const [state, setState] = useState<"idle" | "busy" | "done">(
    initialUploadedAt ? "done" : "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [showReupload, setShowReupload] = useState(false);

  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-card p-5 transition-all hover:border-primary/50">
      <div className="flex items-center gap-2 mb-1">
        <UploadCloud className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-bold text-foreground">Upload Bukti Transfer</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Format JPG, PNG, atau WEBP, ukuran maksimal 1 MB. Disimpan di penyimpanan privat khusus verifikasi admin.
      </p>

      {state === "done" && !showReupload ? (
        <div className="mt-4 space-y-2.5">
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle className="text-xs font-bold">Bukti Pembayaran Telah Diterima</AlertTitle>
            <AlertDescription className="text-xs">
              {initialUploadedAt
                ? `Diunggah pada ${initialUploadedAt}. Admin sedang memverifikasi pembayaran Anda.`
                : "Admin vintagemeew akan memverifikasi pembayaran Anda dan memperbarui status pesanan."}
            </AlertDescription>
          </Alert>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowReupload(true)}
            className="h-8 rounded-full text-xs font-semibold"
          >
            Unggah ulang bukti transfer lain
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="sr-only">Pilih berkas struk atau bukti transfer</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={state === "busy"}
              aria-label="Pilih foto bukti transfer"
              className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-white hover:file:bg-primary/90 file:cursor-pointer cursor-pointer"
              onChange={async (e) => {
                const inputEl = e.currentTarget;
                const f = inputEl.files?.[0];
                if (!f) return;

                if (f.size > MAX_BYTES) {
                  const msg = "Ukuran file melebihi 1 MB. Silakan pilih gambar di bawah 1 MB.";
                  setError(msg);
                  toast.error(msg);
                  inputEl.value = "";
                  return;
                }

                setError(null);
                setState("busy");
                try {
                  const res = await uploadProof(orderId, f);
                  if (res.ok) {
                    setState("done");
                    setShowReupload(false);
                    toast.success("Bukti transfer berhasil diunggah.");
                  } else {
                    setState("idle");
                    setError(res.error ?? "Gagal mengunggah bukti transfer.");
                    toast.error(res.error ?? "Gagal mengunggah bukti transfer.");
                    inputEl.value = "";
                  }
                } catch {
                  setState("idle");
                  setError("Gagal mengunggah bukti transfer. Silakan coba lagi.");
                  toast.error("Gagal mengunggah bukti transfer.");
                  inputEl.value = "";
                }
              }}
            />
          </label>
          {state === "busy" && (
            <p className="text-xs font-semibold text-primary animate-pulse flex items-center gap-1.5">
              <span>Sedang mengunggah berkas bukti pembayaran…</span>
            </p>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
