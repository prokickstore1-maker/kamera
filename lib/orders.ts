/**
 * Logika auto-cancel pesanan kedaluwarsa — server-only, bukan bagian dari
 * Server Action publik. Hanya boleh dipanggil dari route cron ber-CRON_SECRET.
 */
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { and, eq, lt, isNull, sql } from "drizzle-orm";

export async function cancelExpiredOrders(): Promise<number> {
  let cancelled = 0;
  try {
    const expired = await db
      .select({ id: orders.id })
      .from(orders)
      .where(
        and(
          eq(orders.status, "PENDING_PAYMENT"),
          isNull(orders.proofUploadedAt),
          lt(orders.expiresAt, new Date()),
        ),
      )
      .limit(50);

    for (const o of expired) {
      await db.transaction(async (tx) => {
        // cek ulang status di dalam transaksi: pesanan bisa saja sudah dibayar
        // antara query awal dan update ini
        const [upd] = await tx
          .update(orders)
          .set({ status: "CANCELLED", updatedAt: new Date(), stockRestoredAt: new Date() })
          .where(
            and(
              eq(orders.id, o.id),
              eq(orders.status, "PENDING_PAYMENT"),
              isNull(orders.proofUploadedAt),
              isNull(orders.stockRestoredAt),
            ),
          )
          .returning({ id: orders.id });
        if (!upd) return; // sudah dibayar / diproses / pernah restock
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, o.id));
        for (const i of items) {
          if (!i.productId) continue;
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} + ${i.quantity}` })
            .where(eq(products.id, i.productId));
        }
        cancelled++;
      });
    }
  } catch {
    /* DB sedang maintenance — biarkan cron berikutnya */
  }
  return cancelled;
}