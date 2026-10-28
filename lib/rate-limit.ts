/** In-memory sliding-window limiter per IP. MVP: satu instance (lihat HANDOFF). */
const hits = new Map<string, number[]>();

export function rateLimit(bucket: string, ip: string, max: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    const retryAfter = Math.ceil((windowMs - (now - arr[0])) / 1000);
    hits.set(key, arr);
    return { ok: false, retryAfter };
  }
  arr.push(now);
  hits.set(key, arr);
  // bersihkan sesekali agar peta tak bocor
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t > windowMs)) hits.delete(k);
  }
  return { ok: true, retryAfter: 0 };
}

export function resetRateLimit(bucket: string, ip: string): void {
  hits.delete(`${bucket}:${ip}`);
}

export async function clientIp(): Promise<string> {
  const h = await import("next/headers").then((m) => m.headers());
  // x-real-ip diutamakan: di reverse proxy (Coolify/Traefik) header ini disetel
  // proxy, bukan klien. x-forwarded-for paling kiri dapat dipalsukan klien.
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}