import { S3Client } from "@aws-sdk/client-s3";

/** Env alias: .env.example & admin-actions.ts pakai nama panjang, blueprint lama pakai nama pendek. Baca keduanya. */
const aliases: Record<string, string[]> = {
  S3_ACCESS_KEY_ID: ["S3_ACCESS_KEY_ID", "S3_ACCESS_KEY"],
  S3_SECRET_ACCESS_KEY: ["S3_SECRET_ACCESS_KEY", "S3_SECRET_KEY"],
  S3_BUCKET_PUBLIC: ["S3_BUCKET_PUBLIC", "S3_PUBLIC_BUCKET"],
  S3_BUCKET_PRIVATE: ["S3_BUCKET_PRIVATE", "S3_PRIVATE_BUCKET"],
};

export function s3Env(key: string): string | undefined {
  for (const name of aliases[key] ?? [key]) {
    const v = process.env[name];
    if (v) return v;
  }
  return undefined;
}

export function s3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT;
  if (!endpoint) throw new Error("S3_ENDPOINT kosong");
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

/**
 * storeProof() selalu membuat key berawalan "proofs/", jadi ekstraksi lewat marker
 * itu deterministik terhadap bentuk endpoint (termasuk endpoint berprefiks path).
 */
export function s3KeyFromUrl(url: string, marker: string): string | null {
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx);
}