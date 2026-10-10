# Lumen — a full-stack learning platform

Lumen is a two-sided learning marketplace. Students can browse, buy and take courses and earn certificates. Instructors can build, publish and sell courses. Admins can moderate content and run the platform.

It's a production-style Next.js 16 app with **70 routes, 68 database models**, real Stripe payments, role-based access and three separate dashboards.

**[Live demo →](#-try-it)** · no sign-up needed: sign in as a student, an instructor or an admin with one click.

<!-- Add screenshots to docs/screenshots/ and uncomment:
![Student dashboard](docs/screenshots/student-dashboard.png)
-->

---

## 🚀 Try it

The sign-in page has **one-click demo accounts**, each pre-filled with realistic data:

| Role | Email | Password | What to try |
|---|---|---|---|
| 🎓 Student | `student@lumen.demo` | `lumen-demo-2026` | Resume a course, take a quiz, view certificates, check out with a test card, message an instructor |
| 🧑‍🏫 Instructor | `instructor@lumen.demo` | `lumen-demo-2026` | Revenue & payouts, analytics, answer Q&A, reply to reviews, edit a course's curriculum, create coupons |
| 🛡️ Admin | `admin@lumen.demo` | `lumen-demo-2026` | Approve the course waiting in review, handle reported content, manage users and categories, read the audit log |

Payments run in **Stripe test mode**. Use card `4242 4242 4242 4242`, any future date and any CVC.
Demo data **resets every night**, so feel free to click everything.

---

## ✨ Features

**Students**
- Course catalog with filters (category, price, level, rating), sale pages with free preview lessons
- Cart, wishlist and a custom **Stripe Elements** checkout; enrollment is granted by a verified webhook
- Course player with video, rich-text articles and graded quizzes, progress tracking and lesson notes
- Certificates on completion, with a public verification page and PNG download
- Dashboard with progress stats, activity charts, learning streak and "continue learning"
- Q&A, reviews, community discussions, direct messages with instructors and a notification feed

**Instructors**
- Multi-step course editor: landing page, pricing, drag-and-drop curriculum, Tiptap article editor, quiz builder, video upload to S3-compatible storage via presigned URLs
- Submit for review, then admin approval before a course goes live
- Revenue ledger (pending → available → paid out), payout history, earnings by course
- Analytics (enrollments by month, sources, completion), students table, Q&A inbox, review replies
- Course coupons with redemption limits and expiry

**Admins**
- Platform overview: users, live courses, gross revenue, uptime, and a "needs your attention" queue
- Course moderation (approve / request changes / reject, with a submission checklist)
- Users (invite, suspend, roles), categories, promotions, reported content, community topics
- Full audit log of privileged actions, and platform settings

---

## 🧱 Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, React Server Components, Server Actions), **React 19** |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, shadcn/ui (Base UI), light (default) and dark themes |
| Database | PostgreSQL on **Neon**, **Prisma 7** with the `pg` driver adapter |
| Auth | **Better Auth**: email/password, Google and GitHub OAuth, admin plugin, DB-backed rate limiting |
| Payments | **Stripe**: Elements checkout, webhooks, idempotent fulfilment |
| Storage | S3-compatible object storage (avatars, lesson video) with presigned uploads |
| Email | Resend (falls back to logging in development) |
| Charts / editor | Recharts, Tiptap |
| Quality | ESLint, Vitest, GitHub Actions CI |

---

## 🏗️ Architecture highlights

- **Route groups per audience.** `(marketing)`, `(auth)`, `(dashboard)`, `(instructor)`, `(admin)` and `(checkout)` each have their own layout, chrome and access guard. The admin guard answers `404`, not a redirect, so the console's existence isn't revealed.
- **Server-first data.** Pages are async Server Components that query Prisma directly. Mutations are Server Actions that re-check the session and role on every call, because a Server Action is a public endpoint.
- **Payments you can trust.** Enrollment is created only by the Stripe webhook (signature-verified, idempotent, guarded on `payment_status`), never by the return page.
- **Content gating at the data layer.** Locked lessons are never read from the database for a viewer who isn't enrolled. The check lives in one function (`lib/course-access.ts`).
- **Safe rich text.** Articles are stored as editor JSON and sanitised against a whitelist (`lib/article-body.ts`), never stored as HTML.
- **Fast data loading.** Prisma `relationJoins` loads nested relations in one SQL query instead of one round trip per level (the course player went from 8 sequential rounds to 3), and independent reads run in parallel.
- **Money in minor units** end to end, with a revenue-share ledger per order item and monthly payout runs.
- **Public demo mode.** `lib/demo/` holds the demo seed, the guards that keep shared accounts usable, and a nightly reset job (below).

```
app/            routes, grouped by audience
components/     UI, one folder per surface (dashboard/, instructor/, admin/, checkout/ …)
lib/            data access (one module per page), server actions, config
lib/demo/       demo accounts, seed data, media links, guards
prisma/         schema (68 models), migrations, seeds
tests/          unit tests (Vitest)
```

---

## 🛠️ Run it locally

**Prerequisites:** Node.js 20+, a PostgreSQL database (a free Neon project works), and Stripe test keys if you want payments.

```bash
npm install
# create .env — see the variables below
npm run db:deploy        # apply migrations
npm run db:seed:demo     # load the demo dataset (safe to re-run)
npm run dev              # http://localhost:3000
```

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Pooled Postgres connection string (the app) |
| `DIRECT_URL` | ✅ | Direct connection string (migrations, seeds) |
| `BETTER_AUTH_SECRET` | ✅ | Random 32+ character secret |
| `BETTER_AUTH_URL` | ✅ | App origin, e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_SITE_URL` | ✅ in prod | Public origin; used for certificate links and OpenGraph images |
| `NEXT_PUBLIC_DEMO_MODE` | – | `true` shows the one-click demo accounts and freezes platform settings |
| `CRON_SECRET` | demo only | Protects the nightly `/api/demo/reset` job |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | for payments | Stripe test keys; run `stripe listen --forward-to localhost:3000/api/stripe/webhook` locally |
| `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` | – | OAuth buttons appear only when both keys are set |
| `RESEND_API_KEY`, `EMAIL_FROM` | – | Real emails; otherwise they are printed to the server console |
| `AWS_*` (S3-compatible) | for uploads | Avatar and lesson-video storage |

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` · `typecheck` · `test` | ESLint · `tsc --noEmit` · Vitest |
| `npm run db:seed:demo` | Loads the demo dataset: 3 demo accounts, 14 courses, ~150 learners, a year of orders, reviews, Q&A, messages |
| `npm run db:seed:demo -- --wipe` | Empties **every table** first. Only use this on a demo-only database |

---

## 🌐 Deploying the public demo (Vercel + Neon)

1. Create a **separate Neon branch or database** for the demo. The nightly reset truncates it.
2. Import the repo in Vercel and set the environment variables above, including `NEXT_PUBLIC_DEMO_MODE=true`, `NEXT_PUBLIC_SITE_URL=https://<your-domain>` and a random `CRON_SECRET`.
3. Run `npm run db:deploy` and `npm run db:seed:demo` once against that database.
4. In Stripe (test mode), add a webhook endpoint for `https://<your-domain>/api/stripe/webhook` with the `checkout.session.*` events, and put its signing secret in `STRIPE_WEBHOOK_SECRET`.
5. `vercel.json` schedules `GET /api/demo/reset` daily at 00:30 UTC. Vercel sends the `CRON_SECRET` automatically.
6. `vercel.json` pins functions to **`cle1` (Cleveland, us-east-2)**, the same region as the Neon database. Keep them together: every query is a network round trip, and that is ~1–2 ms in-region versus 50 ms+ across regions. If your Neon project is elsewhere, change the region to match.

**How the shared accounts stay usable:** the demo accounts can't change their password or email, delete themselves, or be suspended or demoted by the admin (`lib/demo/guard.ts`). Platform-wide settings are read-only in demo mode. Everything else is fully interactive, and the nightly reset restores the data.

### Adding your own images and videos

All demo media URLs live in **`lib/demo/media.ts`**: course covers by slug, lesson videos (direct `.mp4`/`.webm` links) and avatars. Fill in the links and re-run `npm run db:seed:demo`. Any empty slot falls back to a gradient cover, initials or a "video coming soon" state.

---

## ✅ Quality

- `npm run lint`: 0 errors
- `npm run typecheck`: strict TypeScript, no errors
- `npm test`: unit tests for the article sanitiser, formatting helpers, time-zone-safe date bucketing, demo accounts and demo catalog integrity
- CI runs lint, typecheck, tests and a production build on every push (`.github/workflows/ci.yml`)
