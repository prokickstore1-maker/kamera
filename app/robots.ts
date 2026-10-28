import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products", "/product/"],
        disallow: ["/admin/", "/cart/", "/checkout/", "/invoice/", "/track-order/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}