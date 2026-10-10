import { CreditCardIcon } from "lucide-react"

import { DEMO_MODE, DEMO_TEST_CARD } from "@/lib/demo/config"

/**
 * Stripe runs in test mode on the public demo, so a visitor can complete a
 * purchase end-to-end — enrolment, receipt, instructor earning — with the
 * test card instead of a real one.
 */
function TestCardNotice() {
  if (!DEMO_MODE) return null
  return (
    <div className="mb-3 flex items-start gap-3 rounded-xl border border-accent-2/30 bg-accent-2/5 px-4 py-3 text-sm">
      <CreditCardIcon className="mt-0.5 size-4 shrink-0 text-accent-2" />
      <p className="text-muted-foreground">
        <span className="font-semibold text-foreground">Demo checkout — no real charge.</span>{" "}
        Pay with Stripe&apos;s test card{" "}
        <span className="font-mono font-medium text-foreground">{DEMO_TEST_CARD.number}</span>,{" "}
        {DEMO_TEST_CARD.expiry.toLowerCase()} and {DEMO_TEST_CARD.cvc.toLowerCase()}.
      </p>
    </div>
  )
}

export { TestCardNotice }
