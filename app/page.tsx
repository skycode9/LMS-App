import Link from "next/link"

import { Logo } from "@/components/shared/logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"

// Placeholder home. The real marketing site lands in Phase 3 (route group
// `(marketing)`); for now this just gives a way into the auth screens.
export default function Page() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <Logo />
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Lumen LMS</h1>
        <p className="text-muted-foreground text-sm">
          Auth is wired up. Sign in or create an account to test it.
        </p>
      </div>
      <div className="flex gap-3">
        <Button render={<Link href="/login" />}>Log in</Button>
        <Button variant="outline" render={<Link href="/register" />}>
          Register
        </Button>
      </div>
      <ThemeToggle />
    </div>
  )
}
