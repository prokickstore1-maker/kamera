import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Healthcheck Coolify: verifikasi DB (SELECT 1). Bila DB mati, 503 →
 * Coolify menandai service unhealthy, bukan tetap "sehat" padahal aplikasi tak berfungsi.
 */
export async function GET() {
  try {
    const { db } = await import("@/db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "database unreachable" }, { status: 503 });
  }
}