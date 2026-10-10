/**
 * The public demo — three ready-made accounts a visitor can sign in to and
 * walk every side of the platform with, without registering or paying.
 *
 * Nothing here is a secret: the passwords are printed on the sign-in page on
 * purpose. What keeps the accounts usable for the next visitor is not the
 * password but the guards in `lib/demo/guard.ts` (nobody can change a demo
 * account's password, email or status) and the nightly reset in
 * `app/api/demo/reset/route.ts`, which puts the whole dataset back.
 *
 * Imported by client components (the sign-in page's one-click buttons), so it
 * must stay free of server-only imports.
 */

/**
 * Whether this deployment is the public demo. `NEXT_PUBLIC_` because the
 * sign-in page is a client component and has to decide whether to draw the
 * demo buttons at all.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true"

export type DemoRole = "student" | "instructor" | "admin"

export type DemoAccount = {
  role: DemoRole
  /** Stable row id, so the seed and the guards agree on who is a demo user. */
  id: string
  name: string
  email: string
  password: string
  /** Where the one-click sign-in lands, so each role opens on its own home. */
  landing: string
  label: string
  blurb: string
}

export const DEMO_PASSWORD = "lumen-demo-2026"

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    role: "student",
    id: "seed_user_student",
    name: "Alex Rivera",
    email: "student@lumen.demo",
    password: DEMO_PASSWORD,
    landing: "/dashboard",
    label: "Student",
    blurb: "Courses, certificates, cart, messages",
  },
  {
    role: "instructor",
    id: "seed_user_instructor",
    name: "Maya Chen",
    email: "instructor@lumen.demo",
    password: DEMO_PASSWORD,
    landing: "/dashboard/instructor",
    label: "Instructor",
    blurb: "Courses, students, revenue, Q&A",
  },
  {
    role: "admin",
    id: "seed_user_admin",
    name: "Jordan Blake",
    email: "admin@lumen.demo",
    password: DEMO_PASSWORD,
    landing: "/dashboard/admin",
    label: "Admin",
    blurb: "Overview, course review, users, reports",
  },
] as const

const DEMO_EMAILS = new Set(DEMO_ACCOUNTS.map((account) => account.email))
const DEMO_IDS = new Set(DEMO_ACCOUNTS.map((account) => account.id))

export function isDemoEmail(email: string | null | undefined): boolean {
  return !!email && DEMO_EMAILS.has(email.trim().toLowerCase())
}

export function isDemoUserId(id: string | null | undefined): boolean {
  return !!id && DEMO_IDS.has(id)
}

/** The Stripe test card the checkout banner tells visitors to use. */
export const DEMO_TEST_CARD = {
  number: "4242 4242 4242 4242",
  expiry: "Any future date",
  cvc: "Any 3 digits",
} as const
