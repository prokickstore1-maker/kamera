import { S3Client } from "@aws-sdk/client-s3";

/** Env alias: .env.example & admin-actions.ts pakai nama panjang, blueprint lama pakai nama pendek. Baca keduanya. */
const aliases: Record<string, string[]> = {
  S3_ACCESS_KEY_ID: ["S3_ACCESS_KEY_ID", "S3_ACCESS_KEY"],
  S3_SECRET_ACCESS_KEY: ["S3_SECRET_ACCESS_KEY", "S3_SECRET_KEY"],
  S3_BUCKET_PUBLIC: ["S3_BUCKET_PUBLIC", "S3_PUBLIC_BUCKET"],
  S3_BUCKET_PRIVATE: ["S3_BUCKET_PRIVATE", "S3_PRIVATE_BUCKET"],
};

const PROD_DEFAULTS: Record<string, string> = {
  S3_ENDPOINT: "https://is3.cloudhost.id",
  S3_ACCESS_KEY_ID: "VJVFM2Y678JC16V8WMWD",
  S3_SECRET_ACCESS_KEY: "fFNqMRwjLdapCP7Zujim8eXz6tl5Bg9kPf29Uhj4",
  S3_BUCKET_PUBLIC: "kamera",
  S3_BUCKET_PRIVATE: "kamera",
};

export function s3Env(key: string): string | undefined {
  for (const name of aliases[key] ?? [key]) {
    const v = process.env[name]?.trim();
    if (v) {
      // Auto-fix salah baca OCR key IDCloudHost (Z->2, B->8)
      if (key === "S3_ACCESS_KEY_ID" && v === "VJVFMZY678JC16VBWMWD") {
        return "VJVFM2Y678JC16V8WMWD";
      }
      if ((key === "S3_BUCKET_PUBLIC" || key === "S3_BUCKET_PRIVATE") && v.startsWith("vintagemeew-") && process.env.NODE_ENV === "production") {
        return "kamera";
      }
      if (key === "S3_ENDPOINT" && v.includes("localhost") && process.env.NODE_ENV === "production") {
        return "https://is3.cloudhost.id";
      }
      return v;
    }
  }
  return PROD_DEFAULTS[key];
}

export function s3Client(): S3Client {
  const endpoint = s3Env("S3_ENDPOINT") || "https://is3.cloudhost.id";
  return new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: s3Env("S3_ACCESS_KEY_ID") ?? "",
      secretAccessKey: s3Env("S3_SECRET_ACCESS_KEY") ?? "",
    },
  });
}

export function s3PublicUrl(bucket: string, keyPath: string): string {
  const endpoint = (s3Env("S3_ENDPOINT") || "https://is3.cloudhost.id").replace(/\/$/, "");
  const envPublic = process.env.NEXT_PUBLIC_S3_PUBLIC_URL?.trim();
  if (envPublic && !(envPublic.includes("localhost") && process.env.NODE_ENV === "production")) {
    return `${envPublic.replace(/\/$/, "")}/${keyPath}`;
  }
  return `${endpoint}/${bucket}/${keyPath}`;
}

/**
 * storeProof() selalu membuat key berawalan "proofs/", jadi ekstraksi lewat marker
 * itu deterministik terhadap bentuk endpoint (termasuk endpoint berprefiks path).
 */
export function s3KeyFromUrl(url: string, marker: string): string | null {
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx);
}