"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRightIcon,
  GraduationCapIcon,
  PresentationIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { DEMO_ACCOUNTS, type DemoRole } from "@/lib/demo/config"
import { cn } from "@/lib/utils"

const ICONS: Record<DemoRole, React.ComponentType<{ className?: string }>> = {
  student: GraduationCapIcon,
  instructor: PresentationIcon,
  admin: ShieldCheckIcon,
}

const TONES: Record<DemoRole, string> = {
  student: "bg-role-student/10 text-role-student",
  instructor: "bg-role-instructor/10 text-role-instructor",
  admin: "bg-role-admin/10 text-role-admin",
}

/**
 * One-click sign-in to the public demo's three accounts, above the regular
 * form. Each lands on its own home — the student dashboard, the instructor
 * overview, the admin console — so a visitor sees the right side of the
 * platform straight away.
 */
function DemoSignIn({ onError }: { onError: (message: string) => void }) {
  const router = useRouter()
  const [pending, setPending] = React.useState<DemoRole | null>(null)

  async function signInAs(role: DemoRole) {
    const account = DEMO_ACCOUNTS.find((entry) => entry.role === role)
    if (!account || pending) return
    setPending(role)

    const { error } = await authClient.signIn.email({
      email: account.email,
      password: account.password,
      rememberMe: true,
    })

    if (error) {
      setPending(null)
      onError(
        error.message ??
          "The demo accounts aren't set up on this server yet — run `npm run db:seed:demo`."
      )
      return
    }

    router.push(account.landing)
    router.refresh()
  }

  return (
    <section aria-labelledby="demo-heading" className="mt-7">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="demo-heading" className="text-[15px] font-semibold">
          Explore the live demo
        </h2>
        <span className="text-[12px] text-subtle-foreground">
          One click · no sign-up
        </span>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {DEMO_ACCOUNTS.map((account) => {
          const Icon = ICONS[account.role]
          const busy = pending === account.role
          return (
            <li key={account.role}>
              <button
                type="button"
                onClick={() => signInAs(account.role)}
                disabled={pending !== null}
                aria-busy={busy}
                className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border bg-card px-3.5 py-3 text-left transition-colors hover:bg-hover focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-lg",
                    TONES[account.role]
                  )}
                >
                  <Icon className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    Continue as {account.label}
                  </span>
                  <span className="block truncate text-[13px] text-muted-foreground">
                    {account.blurb}
                  </span>
                </span>
                {busy ? (
                  <Spinner className="size-4 text-muted-foreground" />
                ) : (
                  <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <p className="mt-2.5 text-[12px] leading-relaxed text-subtle-foreground">
        Or sign in below with{" "}
        <span className="font-medium text-muted-foreground">student@lumen.demo</span>{" "}
        (also <span className="font-medium text-muted-foreground">instructor@</span>,{" "}
        <span className="font-medium text-muted-foreground">admin@</span>) and
        password{" "}
        <span className="font-medium text-muted-foreground">
          {DEMO_ACCOUNTS[0]!.password}
        </span>
        . Demo data resets every night.
      </p>
    </section>
  )
}

export { DemoSignIn }
