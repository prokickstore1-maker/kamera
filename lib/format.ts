export const IDR = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function rupiah(n: number): string {
  return IDR.format(n);
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(d));
}

/** Nomor WA Indonesia → tautan wa.me, aman untuk karakter spasi/strip. */
export function waLink(phone: string, text?: string): string {
  const digits = phone.replace(/[^\d]/g, "").replace(/^0/, "62");
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}

/** VMW-YYYYMMDD-NNN */
export function orderNumber(seq: number, date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `VMW-${y}${m}${d}-${String(seq).padStart(3, "0")}`;
}

/** Ubah teks judul kamera menjadi URL slug bersih dan ramah SEO */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
