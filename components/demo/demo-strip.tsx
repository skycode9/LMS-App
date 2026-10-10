import Link from "next/link"
import { SparklesIcon } from "lucide-react"

import { DEMO_MODE } from "@/lib/demo/config"

/**
 * A slim strip above the marketing header on the public demo: this is a
 * portfolio project, and the fastest way in is a ready-made account.
 */
function DemoStrip() {
  if (!DEMO_MODE) return null
  return (
    <div className="bg-foreground text-background">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-center gap-2 px-4 py-2 text-center text-[13px]">
        <SparklesIcon className="size-3.5 shrink-0 opacity-80" />
        <span className="opacity-90">
          Live portfolio demo — explore as a student, instructor or admin.
        </span>
        <Link
          href="/login"
          className="font-semibold underline underline-offset-2 hover:opacity-80"
        >
          Try it
        </Link>
      </div>
    </div>
  )
}

export { DemoStrip }
