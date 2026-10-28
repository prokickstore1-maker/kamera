"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CopyButton({
  value,
  label = "Salin",
  toastMessage = "Berhasil disalin ke papan klip",
}: {
  value: string;
  label?: string;
  toastMessage?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success(toastMessage);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          toast.error("Gagal menyalin teks.");
        }
      }}
      className="h-8 rounded-full px-3 text-xs font-semibold gap-1.5"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      <span>{copied ? "Tersalin" : label}</span>
    </Button>
  );
}

