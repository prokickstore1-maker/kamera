import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "vmw_admin";
const TTL_MS = 24 * 3600_000;

function secret(): Buffer {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") throw new Error("ADMIN_SESSION_SECRET wajib diisi di production");
    return Buffer.from("dev-secret-min-32-characters-0000", "utf8");
  }
  if (s.length < 32) throw new Error("ADMIN_SESSION_SECRET minimal 32 karakter");
  return Buffer.from(s, "utf8");
}

export function signToken(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + TTL_MS })).toString("base64url");
  const mac = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [body, mac] = token.split(".");
  if (!body || !mac) return false;
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      exp?: unknown;
      role?: unknown;
    };
    return (
      payload.role === "admin" &&
      typeof payload.exp === "number" &&
      payload.exp > Date.now()
    );
  } catch {
    return false;
  }
}

/** bcrypt dari environment — bandingkan pakai bcryptjs di server actions. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE)?.value);
}

export const ADMIN_COOKIE = COOKIE;

export async function setAdminCookie() {
  const store = await cookies();
  store.set(COOKIE, signToken({ role: "admin" }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}