import { NextResponse } from "next/server";
import { cancelExpiredOrders } from "@/lib/orders";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Auto-cancel scheduler. Coolify Scheduled Task memanggil route ini tiap 15 menit
 * dengan header `Authorization: Bearer $CRON_SECRET`.
 * Idempotensi restock ada di cancelExpiredOrders (stock_restored_at).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET belum diatur" }, { status: 503 });

  // otentikasi dulu, baru rate limit — coba-coba tanpa token tidak menghabis kan kuota
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rl = rateLimit("cron", req.headers.get("x-forwarded-for") ?? "cron", 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "rate limited" }, { status: 429 });

  const cancelled = await cancelExpiredOrders();
  return NextResponse.json({ ok: true, cancelled });
}