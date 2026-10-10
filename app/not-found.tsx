import type { Metadata } from "next"

import { HomeButton, StatusPage } from "@/components/shared/status-page"
import { siteConfig } from "@/lib/config/site"

export const metadata: Metadata = {
  title: `Page not found · ${siteConfig.name}`,
}

/** Any URL nothing answers, and every `notFound()` outside a shell. */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background">
      <StatusPage
        code="404"
        title="We couldn't find that page"
        description="The link may be broken, or the page may have moved. Head back home, or jump into the demo."
      >
        <HomeButton href="/" label="Go home" />
        <HomeButton href="/login" label="Try the demo" variant="outline" />
      </StatusPage>
    </main>
  )
}
