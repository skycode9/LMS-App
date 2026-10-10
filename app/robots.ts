import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/config/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/certificates/"],
      // Everything behind sign-in, plus the API and checkout.
      disallow: ["/dashboard", "/checkout", "/api/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
