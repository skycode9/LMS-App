export const siteConfig = {
  name: "Lumen",
  description: "Learn anything. Teach everything.",
  /** Footer strapline — shorter than the description, per the design. */
  tagline: "One platform for both sides of the classroom.",
  legalName: "Lumen Learning, Inc.",
  /**
   * The deployment's own origin — certificate share links and OpenGraph
   * image URLs are built from it. Set `NEXT_PUBLIC_SITE_URL` in production.
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
} as const

/** Where the project itself lives — shown in the footer. */
export const siteLinks = {
  repo: "https://github.com/skycode9/LMS-App",
} as const

export type NavItem = {
  title: string
  href: string
}

/** Primary navigation for the marketing site. */
export const marketingNav: NavItem[] = [
  { title: "Features", href: "/features" },
  { title: "Courses", href: "/courses" },
  { title: "Teach", href: "/teach" },
  { title: "Pricing", href: "/pricing" },
]

export type NavGroup = {
  title: string
  items: NavItem[]
}

/** Footer link columns, in the order the design lays them out. */
export const footerNav: NavGroup[] = [
  {
    title: "Learn",
    items: [
      { title: "Browse courses", href: "/courses" },
      { title: "Categories", href: "/categories" },
      { title: "Certificates", href: "/certificates" },
      { title: "Lumen Business", href: "/business" },
    ],
  },
  {
    title: "Teach",
    items: [
      { title: "Become an instructor", href: "/teach" },
      { title: "Instructor help", href: "/teach/help" },
      { title: "Payouts", href: "/teach/payouts" },
      { title: "Course standards", href: "/teach/standards" },
    ],
  },
  {
    title: "Project",
    items: [
      { title: "Try the live demo", href: "/login" },
      { title: "Source code", href: siteLinks.repo },
      { title: "Pricing", href: "/pricing" },
      { title: "Create an account", href: "/register" },
    ],
  },
]

/** Bottom bar of the footer, opposite the copyright line. */
export const footerLegalNav: NavItem[] = [
  { title: "GitHub", href: siteLinks.repo },
  { title: "Demo accounts", href: "/login" },
]
