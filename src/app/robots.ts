import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

/**
 * Private pages (account, dashboard, booking, search) carry a "noindex" tag instead of being blocked here:
 * a crawler has to be able to open them to see that tag. Only technical paths and search parameters are blocked.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/visio/", "/auth/", "/m/", "/booking/", "/*?*sort="] }],
    sitemap: `${SITE}/sitemap_index.xml`,
  };
}
