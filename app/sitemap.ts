import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/config/site"

/** The public pages. Everything else sits behind sign-in. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${siteConfig.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteConfig.url}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${siteConfig.url}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ]
}
