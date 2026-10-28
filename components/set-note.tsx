"use client";

import { useState, useTransition } from "react";
import { setInternalNote } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function SetNote({ orderId, initial }: { orderId: string; initial: string }) {
  const [note, setNote] = useState(initial);
  const [pending, start] = useTransition();

  return (
    <div className="flex gap-2 items-start">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Catatan internal pengemasan atau permintaan khusus pembeli..."
        className="flex-1 text-xs"
      />
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await setInternalNote(orderId, note);
            if (r.ok) {
              toast.success("Catatan internal disimpan.");
            } else {
              toast.error("Gagal menyimpan catatan.");
            }
          })
        }
        className="rounded-full text-xs shrink-0"
      >
        {pending ? "Menyimpan…" : "Simpan Catatan"}
      </Button>
    </div>
  );
}