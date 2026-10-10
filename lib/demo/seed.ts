import { hashPassword } from "better-auth/crypto"

import { DEMO_ACCOUNTS } from "@/lib/demo/config"
import {
  CATEGORIES,
  COUNTRIES,
  COURSES,
  DISCUSSIONS,
  FIRST_NAMES,
  INSTRUCTORS,
  LAST_NAMES,
  QUESTIONS,
  REVIEW_REPLIES,
  REVIEWS,
  STUDENT_THREAD,
  TOPICS,
  type CourseSpec,
  type QuizQuestionSpec,
} from "@/lib/demo/content"
import { AVATARS, COURSE_COVERS, LESSON_VIDEOS } from "@/lib/demo/media"
import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client"

/**
 * The demo dataset: three sign-in-able accounts (student, instructor, admin)
 * inside a living platform — 14 courses, ~70 learners, a year of orders,
 * earnings and payouts, reviews, Q&A, messages, community threads, reports
 * and an audit trail — so every screen of the app has something real on it.
 *
 * Everything is built **in memory first** and written with one `createMany`
 * per table. That keeps the whole run to a few dozen round trips, which is
 * what lets the nightly reset (`app/api/demo/reset/route.ts`) finish inside a
 * serverless function's time limit.
 *
 * Every id starts with `seed_`, and a pseudo-random generator with a fixed
 * seed drives the variety, so two runs produce the same platform (dates move
 * with "now", so the demo never looks stale).
 */

const SEED = "seed_"
const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000

/** Credential accounts, exactly as Better Auth's sign-up writes them. */
const CREDENTIAL_ISSUER = "local:credential"

const REVENUE_SHARE_BPS = 7000
const LEARNER_COUNT = 150

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** mulberry32 — small, fast, deterministic. */
function createRandom(seed: number) {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)]!,
    chance: (p: number) => next() < p,
  }
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/** Mirrors `buildSerial` in `lib/completion.ts`. */
function buildSerial(categorySlug: string, seed: string): string {
  const letters = categorySlug
    .split("-")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2)
    .padEnd(2, "X")
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return `LMN-${letters}-${String(Math.abs(hash) % 10000).padStart(4, "0")}`
}

/** Mirrors `buildPublicSlug` in `lib/completion.ts`. */
function buildPublicSlug(seed: string): string {
  let a = 2166136261
  let b = 1099511628211
  for (let i = 0; i < seed.length; i += 1) {
    a ^= seed.charCodeAt(i)
    a = Math.imul(a, 16777619)
    b ^= seed.charCodeAt(seed.length - 1 - i)
    b = Math.imul(b, 16777619)
  }
  return (
    Math.abs(a).toString(36).padStart(7, "0") +
    Math.abs(b).toString(36).padStart(7, "0")
  ).slice(0, 14)
}

function gradeFor(percent: number): string | null {
  if (percent >= 90) return "A"
  if (percent >= 80) return "B"
  if (percent >= 70) return "C"
  return null
}

/**
 * Turns the content file's light markdown (`## heading`, `- bullets`,
 * `1. numbered`, `**bold**`, `*italic*`) into the editor's JSON document —
 * the only format `lib/article-body.ts` renders.
 */
export function articleDoc(paragraphs: string[]) {
  const inline = (text: string) => {
    const nodes: Prisma.InputJsonObject[] = []
    const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
    let last = 0
    for (const match of text.matchAll(pattern)) {
      const index = match.index ?? 0
      if (index > last) nodes.push({ type: "text", text: text.slice(last, index) })
      const token = match[0]
      if (token.startsWith("**")) {
        nodes.push({ type: "text", text: token.slice(2, -2), marks: [{ type: "bold" }] })
      } else if (token.startsWith("*")) {
        nodes.push({ type: "text", text: token.slice(1, -1), marks: [{ type: "italic" }] })
      } else {
        nodes.push({ type: "text", text: token.slice(1, -1), marks: [{ type: "bold" }] })
      }
      last = index + token.length
    }
    if (last < text.length) nodes.push({ type: "text", text: text.slice(last) })
    return nodes
  }

  const content = paragraphs.map((block) => {
    if (block.startsWith("## ")) {
      return { type: "heading", attrs: { level: 2 }, content: inline(block.slice(3)) }
    }
    const lines = block.split("\n")
    if (lines.every((line) => line.startsWith("- "))) {
      return {
        type: "bulletList",
        content: lines.map((line) => ({
          type: "listItem",
          content: [{ type: "paragraph", content: inline(line.slice(2)) }],
        })),
      }
    }
    if (lines.every((line) => /^\d+\.\s/.test(line))) {
      return {
        type: "orderedList",
        attrs: { start: 1 },
        content: lines.map((line) => ({
          type: "listItem",
          content: [{ type: "paragraph", content: inline(line.replace(/^\d+\.\s/, "")) }],
        })),
      }
    }
    return { type: "paragraph", content: inline(block) }
  })
  return JSON.stringify({ type: "doc", content })
}

/** A short article for lessons the content file leaves without a body. */
function generatedArticle(course: CourseSpec, lessonTitle: string) {
  const outcomes = course.outcomes.slice(0, 3)
  return articleDoc([
    `In this lesson we look at **${lessonTitle.toLowerCase()}** — one of the building blocks of ${course.title}.`,
    "## Why it matters",
    `It connects directly to what this course is about: ${course.subtitle.charAt(0).toLowerCase()}${course.subtitle.slice(1)}`,
    "## Key ideas",
    outcomes.map((outcome) => `- ${outcome}`).join("\n"),
    "## Try it yourself",
    "Pause here and apply the idea to your own project before moving on. Write down one question you still have and post it in the course Q&A — explaining what confused you is often the fastest way to understand it.",
  ])
}

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

// ---------------------------------------------------------------------------
// Clearing
// ---------------------------------------------------------------------------

/**
 * Removes the previous demo dataset and anything demo visitors created on
 * top of it — a course the demo instructor drafted, a thread the demo student
 * started — so a reset really does return to day one. Rows real people made
 * (no `seed_` prefix, not owned by a seed account) are left alone.
 */
async function clearDemo(db: PrismaClient) {
  const seeded = { startsWith: SEED }
  const demoEmails = DEMO_ACCOUNTS.map((account) => account.email)

  // Courses first: `Course.instructor` is RESTRICT, so a course the demo
  // instructor created would otherwise pin the instructor row.
  await db.course.deleteMany({
    where: { OR: [{ id: seeded }, { instructorId: seeded }] },
  })
  await db.instructorFollow.deleteMany({ where: { id: seeded } })
  await db.promotion.deleteMany({ where: { id: seeded } })
  await db.contentReport.deleteMany({
    where: { OR: [{ id: seeded }, { reporterId: seeded }] },
  })
  await db.auditLog.deleteMany({
    where: { OR: [{ id: seeded }, { actorId: seeded }] },
  })
  await db.communityTopic.deleteMany({ where: { id: seeded } })
  await db.userInvitation.deleteMany({
    where: { OR: [{ id: seeded }, { invitedById: seeded }] },
  })
  await db.payoutRun.deleteMany({ where: { id: seeded } })
  await db.mediaAsset.deleteMany({ where: { id: seeded } })
  // Cascades to sessions, accounts, orders, enrolments, reviews, messages,
  // notifications, discussions — everything a person owns.
  await db.user.deleteMany({
    where: { OR: [{ id: seeded }, { email: { in: demoEmails } }] },
  })
  await db.instructor.deleteMany({ where: { id: seeded } })
  // A conversation has no owner to cascade from; once its participants are
  // gone it is unreachable, whoever started it.
  await db.conversation.deleteMany({ where: { participants: { none: {} } } })
  await db.uptimeSample.deleteMany({})
}

/**
 * Empties every application table. Only for a database that exists to serve
 * the public demo (`DEMO_MODE`), where visitors' sign-ups and the categories
 * the demo admin made are part of what the nightly reset should undo.
 */
async function wipeDatabase(db: PrismaClient) {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `
  if (tables.length === 0) return
  const list = tables.map((row) => `"public"."${row.tablename}"`).join(", ")
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${list} CASCADE`)
}

// ---------------------------------------------------------------------------
// Build + write
// ---------------------------------------------------------------------------

export type SeedDemoOptions = {
  /** Truncate every table first (the public demo's nightly reset). */
  wipe?: boolean
  log?: (message: string) => void
}

export async function seedDemo(db: PrismaClient, options: SeedDemoOptions = {}) {
  const log = options.log ?? (() => {})
  const rand = createRandom(20260930)
  const NOW = new Date()
  const daysAgo = (days: number, hours = 0) =>
    new Date(NOW.getTime() - days * DAY - hours * HOUR)
  const between = (from: Date, to: Date) =>
    new Date(from.getTime() + rand.next() * Math.max(0, to.getTime() - from.getTime()))

  if (options.wipe) {
    log("Wiping every table…")
    await wipeDatabase(db)
  } else {
    log("Clearing the previous demo data…")
    await clearDemo(db)
  }

  // --- Platform ------------------------------------------------------------
  await db.platformSetting.deleteMany({})
  await db.platformSetting.create({
    data: { id: "singleton", defaultRevenueShareBps: REVENUE_SHARE_BPS },
  })

  // --- Categories (upserted by slug: an existing taxonomy is kept) ----------
  for (const [order, category] of CATEGORIES.entries()) {
    await db.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        accentColor: category.accentColor,
      },
      create: {
        id: `${SEED}cat_${category.slug}`,
        slug: category.slug,
        name: category.name,
        description: category.description,
        accentColor: category.accentColor,
        order,
      },
    })
  }
  const categoryRows = await db.category.findMany({
    where: { slug: { in: CATEGORIES.map((category) => category.slug) } },
    select: { id: true, slug: true },
  })
  const categoryId = new Map(categoryRows.map((row) => [row.slug, row.id]))

  // --- People ---------------------------------------------------------------
  const users: Prisma.UserCreateManyInput[] = []
  const accounts: Prisma.AccountCreateManyInput[] = []
  const passwordHash = await hashPassword(DEMO_ACCOUNTS[0]!.password)

  const [studentAccount, instructorAccount, adminAccount] = [
    DEMO_ACCOUNTS.find((account) => account.role === "student")!,
    DEMO_ACCOUNTS.find((account) => account.role === "instructor")!,
    DEMO_ACCOUNTS.find((account) => account.role === "admin")!,
  ]

  const adminId = adminAccount.id
  const studentId = studentAccount.id

  users.push({
    id: adminId,
    name: adminAccount.name,
    email: adminAccount.email,
    emailVerified: true,
    image: AVATARS.admin || null,
    role: "admin",
    username: "jordanblake",
    bio: "Platform operations at Lumen.",
    country: "US",
    createdAt: daysAgo(540),
  })
  users.push({
    id: studentId,
    name: studentAccount.name,
    email: studentAccount.email,
    emailVerified: true,
    image: AVATARS.student || null,
    role: "user",
    username: "alexrivera",
    bio: "Frontend developer in the making. Currently learning React, TypeScript and design.",
    urls: ["https://github.com/alexrivera"],
    country: "US",
    language: "en",
    timeZone: "America/New_York",
    createdAt: daysAgo(120),
  })

  type Person = { id: string; name: string; email: string; createdAt: Date }
  const instructorUsers: Person[] = []
  for (const [index, spec] of INSTRUCTORS.entries()) {
    const isDemo = index === 0
    const id = isDemo ? instructorAccount.id : `${SEED}user_${spec.key}`
    const email = isDemo ? instructorAccount.email : `${spec.username}@lumen.demo`
    const createdAt = daysAgo(560 - index * 12)
    users.push({
      id,
      name: spec.name,
      email,
      emailVerified: true,
      image: (isDemo ? AVATARS.instructor : AVATARS.instructors[index - 1]) || null,
      role: "instructor",
      intent: "TEACHING",
      username: spec.username,
      bio: spec.bio,
      country: spec.country,
      createdAt,
    })
    instructorUsers.push({ id, name: spec.name, email, createdAt })
  }

  for (const account of [studentAccount, instructorAccount, adminAccount]) {
    accounts.push({
      id: `${SEED}acct_${account.role}`,
      issuer: CREDENTIAL_ISSUER,
      accountId: account.id,
      providerId: "credential",
      userId: account.id,
      password: passwordHash,
    })
  }

  const learners: Person[] = []
  const usedNames = new Set<string>()
  for (let i = 0; i < LEARNER_COUNT; i += 1) {
    let name = ""
    do {
      name = `${rand.pick(FIRST_NAMES)} ${rand.pick(LAST_NAMES)}`
    } while (usedNames.has(name))
    usedNames.add(name)
    const handle = slugify(name).replace(/-/g, ".")
    const id = `${SEED}user_learner_${i}`
    const createdAt = daysAgo(Math.round(3 + Math.pow(rand.next(), 0.8) * 417))
    // A handful of accounts in every state, so the console's filters have
    // something to find.
    const status =
      i < 2 ? "SUSPENDED" : i < 4 ? "PENDING" : i < 6 ? "INACTIVE" : "ACTIVE"
    users.push({
      id,
      name,
      email: `${handle}${i}@example.com`,
      emailVerified: status !== "PENDING",
      image: i < AVATARS.learners.length ? AVATARS.learners[i] || null : null,
      role: "user",
      username: `${handle.replace(/\./g, "")}${i}`,
      country: rand.pick(COUNTRIES),
      status,
      banned: status === "SUSPENDED",
      banReason: status === "SUSPENDED" ? "Suspended from the admin console" : null,
      createdAt,
    })
    learners.push({ id, name, email: `${handle}${i}@example.com`, createdAt })
  }
  const activeLearners = learners.slice(6)
  const personById = new Map(
    [...instructorUsers, ...learners].map((person) => [person.id, person])
  )
  personById.set(studentId, {
    id: studentId,
    name: studentAccount.name,
    email: studentAccount.email,
    createdAt: daysAgo(120),
  })

  // --- Instructors ------------------------------------------------------------
  const instructorId = new Map<string, string>()
  const instructorUserId = new Map<string, string>()
  for (const [index, spec] of INSTRUCTORS.entries()) {
    instructorId.set(spec.key, `${SEED}instructor_${spec.key}`)
    instructorUserId.set(spec.key, instructorUsers[index]!.id)
  }

  // --- Catalog ----------------------------------------------------------------
  const courses: Prisma.CourseCreateManyInput[] = []
  const sections: Prisma.CourseSectionCreateManyInput[] = []
  const lessons: Prisma.CourseLessonCreateManyInput[] = []
  const mediaAssets: Prisma.MediaAssetCreateManyInput[] = []
  const quizzes: Prisma.QuizCreateManyInput[] = []
  const quizQuestions: Prisma.QuizQuestionCreateManyInput[] = []
  const quizOptions: Prisma.QuizOptionCreateManyInput[] = []

  type LessonInfo = { id: string; type: string; minutes: number; order: number }
  type QuizInfo = {
    id: string
    questions: { id: string; options: { id: string; correct: boolean }[] }[]
  }
  type CourseInfo = {
    id: string
    spec: CourseSpec
    publishedAt: Date | null
    lessons: LessonInfo[]
    quiz: QuizInfo | null
  }
  const courseInfo = new Map<string, CourseInfo>()
  let videoCursor = 0

  for (const [courseIndex, spec] of COURSES.entries()) {
    const id = `${SEED}course_${courseIndex}`
    const published = spec.status === "PUBLISHED"
    const publishedAt = published ? daysAgo(400 - courseIndex * 18) : null
    const info: CourseInfo = { id, spec, publishedAt, lessons: [], quiz: null }

    let videoMinutes = 0
    let articles = 0
    let quizCount = 0
    let totalMinutes = 0
    let lessonOrder = 0

    for (const [sectionIndex, section] of spec.sections.entries()) {
      const sectionId = `${id}_s${sectionIndex}`
      sections.push({ id: sectionId, courseId: id, title: section.title, order: sectionIndex })

      for (const [lessonIndex, lesson] of section.lessons.entries()) {
        const lessonId = `${sectionId}_l${lessonIndex}`
        const base = {
          id: lessonId,
          sectionId,
          title: lesson[1],
          order: lessonIndex,
          isPublished: true,
        }

        if (lesson[0] === "v") {
          const minutes = lesson[2]
          const video = LESSON_VIDEOS.length
            ? LESSON_VIDEOS[videoCursor++ % LESSON_VIDEOS.length]!
            : null
          const assetId = video ? `${SEED}media_${lessonId}` : null
          if (video && assetId) {
            mediaAssets.push({
              id: assetId,
              ownerType: "LESSON_VIDEO",
              ownerId: lessonId,
              title: lesson[1],
              storageKey: `seed/${lessonId}`,
              url: video.url,
              mimeType: video.url.toLowerCase().includes(".webm") ? "video/webm" : "video/mp4",
              sizeBytes: 0,
              durationSeconds: video.durationSeconds,
              uploadedById: instructorUserId.get(spec.instructor) ?? null,
            })
          }
          lessons.push({
            ...base,
            type: "VIDEO",
            durationMinutes: minutes,
            isPreview: lesson[3]?.preview ?? false,
            videoAssetId: assetId,
          })
          videoMinutes += minutes
          totalMinutes += minutes
          info.lessons.push({ id: lessonId, type: "VIDEO", minutes, order: lessonOrder++ })
        } else if (lesson[0] === "a") {
          const minutes = lesson[2]
          lessons.push({
            ...base,
            type: "ARTICLE",
            durationMinutes: minutes,
            articleBody: lesson[3] ? articleDoc(lesson[3]) : generatedArticle(spec, lesson[1]),
          })
          articles += 1
          totalMinutes += minutes
          info.lessons.push({ id: lessonId, type: "ARTICLE", minutes, order: lessonOrder++ })
        } else {
          const questions: QuizQuestionSpec[] = lesson[2]
          const quizId = `${SEED}quiz_${lessonId}`
          const minutes = questions.length * 2
          lessons.push({
            ...base,
            type: "QUIZ",
            durationMinutes: minutes,
            questionsCount: questions.length,
          })
          quizzes.push({ id: quizId, lessonId, title: lesson[1], passPercent: 70 })
          const quiz: QuizInfo = { id: quizId, questions: [] }
          for (const [qIndex, question] of questions.entries()) {
            const questionId = `${quizId}_q${qIndex}`
            quizQuestions.push({
              id: questionId,
              quizId,
              prompt: question.prompt,
              explanation: question.explanation ?? null,
              order: qIndex,
            })
            const options = question.options.map((label, oIndex) => {
              const optionId = `${questionId}_o${oIndex}`
              quizOptions.push({
                id: optionId,
                questionId,
                label,
                isCorrect: oIndex === question.answer,
                order: oIndex,
              })
              return { id: optionId, correct: oIndex === question.answer }
            })
            quiz.questions.push({ id: questionId, options })
          }
          info.quiz = quiz
          quizCount += 1
          totalMinutes += minutes
          info.lessons.push({ id: lessonId, type: "QUIZ", minutes, order: lessonOrder++ })
        }
      }
    }

    const createdAt = publishedAt
      ? new Date(publishedAt.getTime() - 20 * DAY)
      : daysAgo(spec.status === "IN_REVIEW" ? 40 : 9)
    courses.push({
      id,
      slug: spec.slug,
      title: spec.title,
      subtitle: spec.subtitle,
      description: spec.description,
      instructorId: instructorId.get(spec.instructor)!,
      categoryId: categoryId.get(spec.category)!,
      level: spec.level,
      durationHours: Math.max(1, Math.round(totalMinutes / 60)),
      priceCents: spec.priceCents,
      listPriceCents: spec.listPriceCents,
      requirements: spec.requirements,
      learningOutcomes: spec.outcomes,
      intendedAudience: spec.audience,
      videoHours: Math.max(1, Math.round(videoMinutes / 60)),
      articlesCount: articles,
      quizzesCount: quizCount,
      thumbnailUrl: COURSE_COVERS[spec.slug] || null,
      status: spec.status,
      submittedAt:
        spec.status === "IN_REVIEW"
          ? daysAgo(1, 5)
          : publishedAt
            ? new Date(publishedAt.getTime() - 2 * DAY)
            : null,
      publishedAt,
      welcomeMessage: `Welcome to ${spec.title}! Start with the first section and post any questions in the Q&A.`,
      congratulationsMessage: `Congratulations on finishing ${spec.title}! Your certificate is ready.`,
      lessonCount: info.lessons.length,
      totalDurationMinutes: totalMinutes,
      createdAt,
      updatedAt: publishedAt ?? createdAt,
    })
    courseInfo.set(spec.slug, info)
  }

  const publishedCourses = [...courseInfo.values()].filter((course) => course.publishedAt)
  const courseBySlug = (slug: string) => courseInfo.get(slug)!

  // --- Coupons ------------------------------------------------------------------
  const coupons: Prisma.CouponCreateManyInput[] = []
  const couponFor = new Map<string, { id: string; percentOff: number; code: string }>()
  const addCoupon = (
    slug: string,
    code: string,
    percentOff: number,
    startsAt: Date,
    endsAt: Date | null,
    limit: number | null
  ) => {
    const course = courseBySlug(slug)
    const id = `${SEED}coupon_${code.toLowerCase()}`
    coupons.push({
      id,
      code,
      courseId: course.id,
      instructorId: instructorId.get(course.spec.instructor)!,
      percentOff,
      resultingPriceCents: Math.round(course.spec.priceCents * (1 - percentOff / 100)),
      redemptionLimit: limit,
      startsAt,
      endsAt,
      createdAt: startsAt,
    })
    if (!endsAt || endsAt > NOW) couponFor.set(slug, { id, percentOff, code })
  }
  addCoupon("modern-react-and-nextjs", "REACTLAUNCH", 50, daysAgo(390), daysAgo(360), 200)
  addCoupon("modern-react-and-nextjs", "MAYA20", 20, daysAgo(120), null, null)
  addCoupon("typescript-from-zero-to-confident", "TSFRIENDS", 30, daysAgo(60), new Date(NOW.getTime() + 30 * DAY), 100)
  addCoupon("node-apis-with-postgres", "API25", 25, daysAgo(90), null, 150)

  // --- Enrolments, orders, earnings ------------------------------------------------
  const enrollments: Prisma.EnrollmentCreateManyInput[] = []
  const progress: Prisma.LessonProgressCreateManyInput[] = []
  const orders: Prisma.OrderCreateManyInput[] = []
  const orderItems: Prisma.OrderItemCreateManyInput[] = []
  const earnings: (Prisma.InstructorEarningCreateManyInput & { createdAt: Date })[] = []
  const refunds: Prisma.RefundCreateManyInput[] = []
  const redemptions: Prisma.CouponRedemptionCreateManyInput[] = []
  const quizAttempts: Prisma.QuizAttemptCreateManyInput[] = []
  const quizAnswers: Prisma.QuizAnswerCreateManyInput[] = []

  type EnrollmentInfo = {
    id: string
    userId: string
    course: CourseInfo
    createdAt: Date
    lastAccessedAt: Date
    progressPercent: number
    completedAt: Date | null
  }
  const enrollmentList: EnrollmentInfo[] = []
  let orderSeq = 0

  const addOrder = (
    userId: string,
    course: CourseInfo,
    at: Date,
    options: { coupon?: { id: string; percentOff: number }; refunded?: boolean } = {}
  ) => {
    const id = `${SEED}order_${orderSeq}`
    const itemId = `${SEED}orderitem_${orderSeq}`
    orderSeq += 1
    const subtotal = course.spec.priceCents
    const discount = options.coupon ? Math.round((subtotal * options.coupon.percentOff) / 100) : 0
    const total = subtotal - discount
    const person = personById.get(userId)
    orders.push({
      id,
      userId,
      stripeSessionId: `${SEED}cs_${id}`,
      stripePaymentIntentId: `${SEED}pi_${id}`,
      status: options.refunded ? "REFUNDED" : "PAID",
      amountTotal: total,
      subtotalCents: subtotal,
      discountCents: discount,
      email: person?.email ?? null,
      couponId: options.coupon?.id ?? null,
      createdAt: at,
      paidAt: at,
    })
    orderItems.push({
      id: itemId,
      orderId: id,
      courseSlug: course.spec.slug,
      courseId: course.id,
      title: course.spec.title,
      unitAmount: total,
      instructorId: instructorId.get(course.spec.instructor)!,
      revenueShareBps: REVENUE_SHARE_BPS,
    })
    const net = Math.round((total * REVENUE_SHARE_BPS) / 10000)
    earnings.push({
      id: `${SEED}earning_${itemId}`,
      instructorId: instructorId.get(course.spec.instructor)!,
      courseId: course.id,
      source: "SALE",
      orderItemId: itemId,
      grossCents: total,
      platformFeeCents: total - net,
      netCents: net,
      status: options.refunded ? "REVERSED" : "PENDING",
      clearsAt: new Date(at.getTime() + 30 * DAY),
      createdAt: at,
    })
    if (options.coupon) {
      redemptions.push({
        id: `${SEED}redemption_${id}`,
        couponId: options.coupon.id,
        orderId: id,
        userId,
        discountCents: discount,
        createdAt: at,
      })
    }
    if (options.refunded) {
      refunds.push({
        id: `${SEED}refund_${id}`,
        orderId: id,
        stripeRefundId: `${SEED}re_${id}`,
        amountCents: total,
        reason: "requested_by_customer",
        createdAt: new Date(at.getTime() + 3 * DAY),
      })
    }
    return id
  }

  /**
   * One enrolment with its lesson progress. `completedTimes` spreads the
   * finished lessons across the enrolment's life so activity charts and the
   * learning streak have a real shape.
   */
  const addEnrollment = (input: {
    userId: string
    course: CourseInfo
    createdAt: Date
    completedLessons: number
    lastAccessedAt: Date
    source: "PURCHASE" | "BUSINESS_PLAN" | "COUPON" | "FREE"
    orderId: string | null
    completedTimes?: Date[]
  }) => {
    const id = `${SEED}enrollment_${enrollments.length}`
    const total = input.course.lessons.length
    const done = Math.min(total, input.completedLessons)
    const percent = total ? Math.round((done / total) * 100) : 0
    const completedAt = done === total ? input.lastAccessedAt : null
    const next = input.course.lessons[done] ?? input.course.lessons[total - 1]
    enrollments.push({
      id,
      userId: input.userId,
      courseId: input.course.id,
      source: input.source,
      orderId: input.orderId,
      progressPercent: percent,
      completedLessons: done,
      currentLessonId: next?.id ?? null,
      lastAccessedAt: input.lastAccessedAt,
      completedAt,
      createdAt: input.createdAt,
    })
    for (let i = 0; i < done; i += 1) {
      const lesson = input.course.lessons[i]!
      const at =
        input.completedTimes?.[i] ??
        new Date(
          input.createdAt.getTime() +
            ((i + 1) / done) * (input.lastAccessedAt.getTime() - input.createdAt.getTime())
        )
      progress.push({
        id: `${id}_p${i}`,
        enrollmentId: id,
        lessonId: lesson.id,
        secondsWatched: lesson.type === "VIDEO" ? lesson.minutes * 60 : 0,
        completedAt: at,
        updatedAt: at,
      })
    }
    const info: EnrollmentInfo = {
      id,
      userId: input.userId,
      course: input.course,
      createdAt: input.createdAt,
      lastAccessedAt: input.lastAccessedAt,
      progressPercent: percent,
      completedAt,
    }
    enrollmentList.push(info)
    return info
  }

  // The demo student — a believable learner a few months in.
  const studentPlan: {
    slug: string
    enrolledDaysAgo: number
    done: number | "all"
    /** Days ago the finished lessons were spread over, oldest first. */
    activity: [number, number]
    lastHoursAgo: number
  }[] = [
    { slug: "typescript-from-zero-to-confident", enrolledDaysAgo: 95, done: "all", activity: [92, 60], lastHoursAgo: 60 * 24 },
    { slug: "deep-work-and-focus", enrolledDaysAgo: 58, done: "all", activity: [56, 40], lastHoursAgo: 40 * 24 },
    { slug: "modern-react-and-nextjs", enrolledDaysAgo: 38, done: 11, activity: [30, 0.2], lastHoursAgo: 3 },
    { slug: "ui-design-foundations", enrolledDaysAgo: 14, done: 3, activity: [9, 1], lastHoursAgo: 26 },
    { slug: "python-for-data-analysis", enrolledDaysAgo: 2, done: 1, activity: [1, 1], lastHoursAgo: 30 },
  ]
  const studentEnrollments = new Map<string, EnrollmentInfo>()
  for (const plan of studentPlan) {
    const course = courseBySlug(plan.slug)
    const at = daysAgo(plan.enrolledDaysAgo)
    const done = plan.done === "all" ? course.lessons.length : plan.done
    const [from, to] = plan.activity
    const times = Array.from({ length: done }, (_, i) => {
      const day = done > 1 ? from - ((from - to) * i) / (done - 1) : from
      return new Date(NOW.getTime() - day * DAY - rand.int(1, 8) * HOUR)
    })
    const orderId = addOrder(studentId, course, at)
    studentEnrollments.set(
      plan.slug,
      addEnrollment({
        userId: studentId,
        course,
        createdAt: at,
        completedLessons: done,
        lastAccessedAt: new Date(NOW.getTime() - plan.lastHoursAgo * HOUR),
        source: "PURCHASE",
        orderId,
        completedTimes: times,
      })
    )
  }

  // Everyone else — weighted towards popular courses and recent months.
  const popularityTotal = publishedCourses.reduce((sum, course) => sum + course.spec.popularity, 0)
  const pickCourse = () => {
    let roll = rand.next() * popularityTotal
    for (const course of publishedCourses) {
      roll -= course.spec.popularity
      if (roll <= 0) return course
    }
    return publishedCourses[0]!
  }

  for (const learner of learners) {
    const wanted = rand.int(1, 4)
    const taken = new Set<string>()
    for (let n = 0; n < wanted; n += 1) {
      const course = pickCourse()
      if (taken.has(course.id)) continue
      taken.add(course.id)

      const earliest = new Date(
        Math.max(course.publishedAt!.getTime(), learner.createdAt.getTime())
      )
      const spanDays = Math.max(1, (NOW.getTime() - earliest.getTime()) / DAY)
      // r^1.2 leans slightly towards recent enrolments — a growing platform —
      // while every month still has sales for the charts to draw.
      const at = new Date(NOW.getTime() - Math.pow(rand.next(), 1.2) * spanDays * DAY - rand.int(1, 20) * HOUR)

      const roll = rand.next()
      const coupon = couponFor.get(course.spec.slug)
      const source =
        roll < 0.08 ? "BUSINESS_PLAN" : roll < 0.12 ? "FREE" : coupon && roll < 0.22 ? "COUPON" : "PURCHASE"

      // A couple of refunds, which means no enrolment survives.
      if (source === "PURCHASE" && rand.chance(0.02) && at < daysAgo(10)) {
        addOrder(learner.id, course, at, { refunded: true })
        continue
      }

      const orderId =
        source === "PURCHASE" || source === "COUPON"
          ? addOrder(learner.id, course, at, source === "COUPON" ? { coupon } : {})
          : null

      const total = course.lessons.length
      const finished = rand.chance(0.32)
      const done = finished ? total : Math.floor(rand.next() * 0.9 * total)
      const age = NOW.getTime() - at.getTime()
      const last = new Date(at.getTime() + age * (0.3 + rand.next() * 0.7))
      addEnrollment({
        userId: learner.id,
        course,
        createdAt: at,
        completedLessons: done,
        lastAccessedAt: last,
        source,
        orderId,
      })
    }
  }

  // --- Earnings → available / paid, payout runs -------------------------------------
  const payouts: Prisma.PayoutCreateManyInput[] = []
  const payoutRuns: Prisma.PayoutRunCreateManyInput[] = []
  const payoutMethods: Prisma.PayoutMethodCreateManyInput[] = []
  const thisMonth = monthStart(NOW)
  const lastMonth = new Date(Date.UTC(thisMonth.getUTCFullYear(), thisMonth.getUTCMonth() - 1, 1))

  for (const [index, spec] of INSTRUCTORS.entries()) {
    const id = instructorId.get(spec.key)!
    payoutMethods.push({
      id: `${SEED}payout_method_${spec.key}`,
      instructorId: id,
      type: "BANK_TRANSFER",
      label: `${["Chase", "Barclays", "Santander", "Wells Fargo", "Deutsche Bank"][index]} checking`,
      last4: String(4000 + index * 1111).slice(-4),
      role: "PRIMARY",
      verifiedAt: daysAgo(500),
      createdAt: daysAgo(500),
    })
    if (index === 0) {
      payoutMethods.push({
        id: `${SEED}payout_method_${spec.key}_paypal`,
        instructorId: id,
        type: "PAYPAL",
        label: "PayPal · maya@…",
        role: "BACKUP",
        verifiedAt: daysAgo(300),
        createdAt: daysAgo(300),
      })
    }
  }

  // Earnings from before last month were paid out on the 1st of the month
  // after they cleared; last month's cleared ones are available; the last 30
  // days are still pending.
  const payoutGroups = new Map<string, typeof earnings>()
  for (const earning of earnings) {
    if (earning.status === "REVERSED") continue
    if (earning.createdAt >= daysAgo(30)) continue
    if (earning.createdAt >= lastMonth) {
      earning.status = "AVAILABLE"
      continue
    }
    earning.status = "PAID"
    const key = `${monthKey(earning.createdAt)}|${earning.instructorId}`
    payoutGroups.set(key, [...(payoutGroups.get(key) ?? []), earning])
  }
  const runTotals = new Map<string, { total: number; recipients: number; paidAt: Date }>()
  for (const [key, group] of payoutGroups) {
    const [month, instructor] = key.split("|") as [string, string]
    const created = group[0]!.createdAt
    const paidAt = new Date(Date.UTC(created.getUTCFullYear(), created.getUTCMonth() + 2, 1, 14))
    const amount = group.reduce((sum, earning) => sum + earning.netCents, 0)
    const payoutId = `${SEED}payout_${month}_${instructor.replace(SEED, "")}`
    payouts.push({
      id: payoutId,
      reference: `PO-${month}-${instructor.replace(`${SEED}instructor_`, "").toUpperCase()}`,
      payoutRunId: `${SEED}payout_run_${month}`,
      instructorId: instructor,
      payoutMethodId: `${SEED}payout_method_${instructor.replace(`${SEED}instructor_`, "")}`,
      amountCents: amount,
      status: "PAID",
      paidAt,
      createdAt: paidAt,
    })
    for (const earning of group) earning.payoutId = payoutId
    const run = runTotals.get(month) ?? { total: 0, recipients: 0, paidAt }
    run.total += amount
    run.recipients += 1
    runTotals.set(month, run)
  }
  for (const [month, run] of runTotals) {
    payoutRuns.push({
      id: `${SEED}payout_run_${month}`,
      reference: `PR-${month}`,
      scheduledFor: run.paidAt,
      status: "COMPLETED",
      totalCents: run.total,
      recipientCount: run.recipients,
      completedAt: run.paidAt,
      createdAt: run.paidAt,
    })
  }
  const nextRun = new Date(Date.UTC(thisMonth.getUTCFullYear(), thisMonth.getUTCMonth() + 1, 1, 14))
  payoutRuns.push({
    id: `${SEED}payout_run_next`,
    reference: `PR-${monthKey(nextRun)}-NEXT`,
    scheduledFor: nextRun,
    status: "SCHEDULED",
    totalCents: earnings
      .filter((earning) => earning.status === "AVAILABLE")
      .reduce((sum, earning) => sum + earning.netCents, 0),
    recipientCount: new Set(
      earnings.filter((earning) => earning.status === "AVAILABLE").map((earning) => earning.instructorId)
    ).size,
  })

  // --- Certificates + quiz attempts ---------------------------------------------------
  const certificates: Prisma.CertificateCreateManyInput[] = []
  const usedSerials = new Set<string>()
  for (const enrollment of enrollmentList) {
    if (!enrollment.completedAt) continue
    const score = enrollment.userId === studentId ? 100 : rand.int(72, 100)
    let serialSeed = enrollment.id
    let serial = buildSerial(enrollment.course.spec.category, serialSeed)
    while (usedSerials.has(serial)) {
      serialSeed += "+"
      serial = buildSerial(enrollment.course.spec.category, serialSeed)
    }
    usedSerials.add(serial)
    certificates.push({
      id: `${SEED}certificate_${enrollment.id}`,
      serial,
      publicSlug: buildPublicSlug(enrollment.id + enrollment.course.id),
      enrollmentId: enrollment.id,
      userId: enrollment.userId,
      courseId: enrollment.course.id,
      grade: gradeFor(score),
      scorePercent: score,
      issuedAt: enrollment.completedAt,
    })

    const quiz = enrollment.course.quiz
    if (!quiz) continue
    const attemptId = `${SEED}attempt_${enrollment.id}`
    const correct = Math.round((score / 100) * quiz.questions.length)
    const submittedAt = new Date(enrollment.completedAt.getTime() - HOUR)
    quizAttempts.push({
      id: attemptId,
      enrollmentId: enrollment.id,
      quizId: quiz.id,
      startedAt: new Date(submittedAt.getTime() - 8 * 60 * 1000),
      submittedAt,
      scorePercent: Math.round((correct / quiz.questions.length) * 100),
      correctCount: correct,
      passed: correct / quiz.questions.length >= 0.7,
    })
    if (enrollment.userId === studentId) {
      for (const question of quiz.questions) {
        quizAnswers.push({
          id: `${attemptId}_${question.id.slice(-3)}`,
          attemptId,
          questionId: question.id,
          selectedOptionId: question.options.find((option) => option.correct)?.id ?? null,
        })
      }
    }
  }

  // --- Reviews --------------------------------------------------------------------
  const reviews: Prisma.CourseReviewCreateManyInput[] = []
  const reviewReplies: Prisma.CourseReviewReplyCreateManyInput[] = []
  const reviewStats = new Map<string, { sum: number; count: number }>()
  const ratingRoll = () => {
    const roll = rand.next()
    return roll < 0.56 ? 5 : roll < 0.86 ? 4 : roll < 0.96 ? 3 : 2
  }
  let flaggedReviewId: string | null = null
  const addReview = (enrollment: EnrollmentInfo, rating: number, text: { title: string; body: string }) => {
    const id = `${SEED}review_${enrollment.id}`
    const at = between(enrollment.createdAt, enrollment.lastAccessedAt)
    reviews.push({
      id,
      courseId: enrollment.course.id,
      userId: enrollment.userId,
      enrollmentId: enrollment.id,
      rating,
      title: text.title,
      body: text.body,
      createdAt: at,
      updatedAt: at,
    })
    const stats = reviewStats.get(enrollment.course.id) ?? { sum: 0, count: 0 }
    stats.sum += rating
    stats.count += 1
    reviewStats.set(enrollment.course.id, stats)
    if (enrollment.course.spec.instructor === "maya" && rand.chance(0.45)) {
      reviewReplies.push({
        id: `${SEED}review_reply_${enrollment.id}`,
        reviewId: id,
        authorId: instructorAccount.id,
        body: rand.pick(REVIEW_REPLIES),
        createdAt: new Date(at.getTime() + rand.int(4, 60) * HOUR),
        updatedAt: new Date(at.getTime() + rand.int(4, 60) * HOUR),
      })
    }
    return id
  }

  for (const enrollment of enrollmentList) {
    if (enrollment.userId === studentId) continue
    if (enrollment.progressPercent < 35 || !rand.chance(0.6)) continue
    const rating = ratingRoll()
    const id = addReview(enrollment, rating, rand.pick(REVIEWS[rating]!))
    if (!flaggedReviewId && rating <= 3 && enrollment.course.spec.instructor === "maya") {
      flaggedReviewId = id
    }
  }
  addReview(studentEnrollments.get("typescript-from-zero-to-confident")!, 5, {
    title: "Finally, TypeScript makes sense",
    body: "I'd bounced off TypeScript twice before. The narrowing and generics sections were the clearest explanations I've found anywhere. The quiz at the end was a nice confidence boost.",
  })
  addReview(studentEnrollments.get("deep-work-and-focus")!, 4, {
    title: "Short and genuinely useful",
    body: "Changed how I plan my week. I'd love a follow-up with more examples for remote workers.",
  })

  // --- Aggregates on courses and instructors -----------------------------------------
  const enrollCount = new Map<string, number>()
  for (const enrollment of enrollmentList) {
    enrollCount.set(enrollment.course.id, (enrollCount.get(enrollment.course.id) ?? 0) + 1)
  }
  for (const course of courses) {
    const stats = reviewStats.get(course.id!)
    course.rating = stats ? Math.round((stats.sum / stats.count) * 10) / 10 : 0
    course.reviewsCount = stats?.count ?? 0
    course.enrollmentCount = enrollCount.get(course.id!) ?? 0
  }

  const instructors: Prisma.InstructorCreateManyInput[] = INSTRUCTORS.map((spec, index) => {
    const id = instructorId.get(spec.key)!
    const mine = [...courseInfo.values()].filter((course) => course.spec.instructor === spec.key)
    let sum = 0
    let count = 0
    for (const course of mine) {
      const stats = reviewStats.get(course.id)
      if (stats) {
        sum += stats.sum
        count += stats.count
      }
    }
    const students = new Set(
      enrollmentList
        .filter((enrollment) => enrollment.course.spec.instructor === spec.key)
        .map((enrollment) => enrollment.userId)
    )
    return {
      id,
      slug: spec.username,
      userId: instructorUsers[index]!.id,
      name: spec.name,
      title: spec.title,
      bio: spec.bio,
      about: spec.about,
      skills: spec.skills,
      imageUrl: (index === 0 ? AVATARS.instructor : AVATARS.instructors[index - 1]) || null,
      teachingSince: spec.teachingSince,
      rating: count ? Math.round((sum / count) * 10) / 10 : 0,
      reviewsCount: count,
      studentsCount: students.size,
    }
  })

  // --- Q&A ------------------------------------------------------------------------
  const questions: Prisma.CourseQuestionCreateManyInput[] = []
  const questionReplies: Prisma.CourseQuestionReplyCreateManyInput[] = []
  const questionVotes: Prisma.CourseQuestionVoteCreateManyInput[] = []
  const questionCourses = [
    "modern-react-and-nextjs",
    "modern-react-and-nextjs",
    "modern-react-and-nextjs",
    "typescript-from-zero-to-confident",
    "tailwind-css-in-practice",
    "modern-react-and-nextjs",
  ]
  for (const [index, question] of QUESTIONS.entries()) {
    const course = courseBySlug(questionCourses[index]!)
    const enrolled = enrollmentList.filter(
      (enrollment) => enrollment.course.id === course.id && enrollment.userId !== studentId
    )
    // The demo student asked the first one, so their own Q&A tab has a thread.
    const author =
      index === 0 ? studentEnrollments.get("modern-react-and-nextjs")! : rand.pick(enrolled)
    const id = `${SEED}question_${index}`
    const at = index === 0 ? daysAgo(12) : daysAgo(rand.int(2, 90))
    const lesson = course.lessons[Math.min(course.lessons.length - 1, 3 + index)]!
    const replyCount = question.answer ? (index === 1 ? 2 : 1) : 0
    const voters = enrolled.slice(0, rand.int(1, Math.min(6, enrolled.length)))
    questions.push({
      id,
      courseId: course.id,
      lessonId: lesson.id,
      authorId: author.userId,
      title: question.title,
      body: question.body,
      voteCount: voters.length,
      replyCount,
      answeredByInstructor: !!question.answer,
      createdAt: at,
      updatedAt: at,
    })
    for (const voter of voters) {
      if (voter.userId === author.userId) continue
      questionVotes.push({
        id: `${id}_vote_${voter.userId}`,
        questionId: id,
        userId: voter.userId,
        createdAt: at,
      })
    }
    if (question.answer) {
      questionReplies.push({
        id: `${id}_reply_0`,
        questionId: id,
        authorId: instructorAccount.id,
        body: question.answer,
        createdAt: new Date(at.getTime() + 5 * HOUR),
        updatedAt: new Date(at.getTime() + 5 * HOUR),
      })
    }
    if (index === 1) {
      questionReplies.push({
        id: `${id}_reply_1`,
        questionId: id,
        authorId: author.userId,
        body: "That fixed it — thank you!",
        createdAt: new Date(at.getTime() + 9 * HOUR),
        updatedAt: new Date(at.getTime() + 9 * HOUR),
      })
    }
  }
  // Vote counts must match the rows actually written.
  for (const question of questions) {
    question.voteCount = questionVotes.filter((vote) => vote.questionId === question.id).length
  }

  // --- Submissions (the review trail every published course went through) ------------
  const submissions: Prisma.CourseSubmissionCreateManyInput[] = []
  for (const course of courseInfo.values()) {
    const submittedById = instructorUserId.get(course.spec.instructor)!
    if (course.spec.slug === "tailwind-css-in-practice" && course.publishedAt) {
      submissions.push({
        id: `${SEED}submission_${course.id}_0`,
        courseId: course.id,
        submittedById,
        submittedAt: new Date(course.publishedAt.getTime() - 9 * DAY),
        decision: "CHANGES_REQUESTED",
        reviewedById: adminId,
        reviewedAt: new Date(course.publishedAt.getTime() - 8 * DAY),
        changeReasons: ["AUDIO_VIDEO_QUALITY"],
        noteToInstructor: "Great course! The audio in section 2 has some background noise — could you re-record those two lessons?",
      })
    }
    if (course.publishedAt) {
      submissions.push({
        id: `${SEED}submission_${course.id}`,
        courseId: course.id,
        submittedById,
        submittedAt: new Date(course.publishedAt.getTime() - 2 * DAY),
        decision: "APPROVED",
        reviewedById: adminId,
        reviewedAt: course.publishedAt,
      })
    } else if (course.spec.status === "IN_REVIEW") {
      submissions.push({
        id: `${SEED}submission_${course.id}`,
        courseId: course.id,
        submittedById,
        submittedAt: daysAgo(1, 5),
      })
    }
  }

  // The two automated checks `submitCourse` writes, computed by the same rules.
  const submissionChecks: Prisma.CourseSubmissionCheckCreateManyInput[] = []
  for (const submission of submissions) {
    const course = [...courseInfo.values()].find((entry) => entry.id === submission.courseId)!
    const row = courses.find((entry) => entry.id === course.id)!
    submissionChecks.push(
      {
        id: `${submission.id}_check_length`,
        submissionId: submission.id!,
        key: "min_lessons_and_video",
        label: "At least 10 lessons and 5 hours of video",
        passed: course.lessons.length >= 10 && (row.durationHours ?? 0) >= 5,
      },
      {
        id: `${submission.id}_check_quiz`,
        submissionId: submission.id!,
        key: "closes_with_quiz",
        label: "Closes with a graded quiz or project",
        passed: course.lessons.some((lesson) => lesson.type === "QUIZ"),
      }
    )
  }

  // --- Community ------------------------------------------------------------------
  const topics: Prisma.CommunityTopicCreateManyInput[] = TOPICS.map((topic, order) => ({
    id: `${SEED}topic_${topic.slug}`,
    slug: topic.slug,
    name: topic.name,
    description: topic.description,
    accentColor: topic.accentColor,
    order,
    createdAt: daysAgo(500),
  }))
  const moderators: Prisma.TopicModeratorCreateManyInput[] = [
    { id: `${SEED}moderator_general`, topicId: `${SEED}topic_general`, userId: adminId, canDelete: true, canSuspend: true },
    { id: `${SEED}moderator_web`, topicId: `${SEED}topic_web-development`, userId: instructorAccount.id },
  ]
  const discussions: Prisma.DiscussionCreateManyInput[] = []
  const discussionReplies: Prisma.DiscussionReplyCreateManyInput[] = []
  const discussionLikes: Prisma.DiscussionLikeCreateManyInput[] = []
  let reportedDiscussionId: string | null = null
  for (const [index, spec] of DISCUSSIONS.entries()) {
    const id = `${SEED}discussion_${index}`
    const authorId =
      index === 0 ? adminId : index === 2 ? studentId : rand.pick(activeLearners).id
    const at = daysAgo(index === 0 ? 300 : rand.int(3, 60))
    const likers = [...activeLearners].sort(() => rand.next() - 0.5).slice(0, rand.int(2, 14))
    discussions.push({
      id,
      topicId: `${SEED}topic_${spec.topic}`,
      authorId,
      courseId: spec.course ? courseBySlug(spec.course).id : null,
      title: spec.title,
      body: spec.body,
      tags: spec.tags,
      isPinned: spec.pinned ?? false,
      likeCount: likers.length,
      replyCount: spec.replies.length,
      createdAt: at,
      updatedAt: at,
    })
    for (const liker of likers) {
      discussionLikes.push({
        id: `${id}_like_${liker.id}`,
        userId: liker.id,
        targetType: "DISCUSSION",
        targetId: id,
        createdAt: at,
      })
    }
    for (const [rIndex, body] of spec.replies.entries()) {
      const replyAt = new Date(at.getTime() + (rIndex + 1) * 7 * HOUR)
      discussionReplies.push({
        id: `${id}_reply_${rIndex}`,
        discussionId: id,
        authorId: index === 1 && rIndex === 0 ? studentId : rand.pick(activeLearners).id,
        body,
        likeCount: rand.int(0, 6),
        createdAt: replyAt,
        updatedAt: replyAt,
      })
    }
    if (index === 5) reportedDiscussionId = id
  }
  discussions.push({
    id: `${SEED}discussion_pending`,
    topicId: `${SEED}topic_careers`,
    authorId: activeLearners[3]!.id,
    title: "Anyone selling course notes? DM me",
    body: "Looking to buy notes for the ML course, will pay.",
    tags: [],
    status: "PENDING_APPROVAL",
    createdAt: daysAgo(0, 6),
    updatedAt: daysAgo(0, 6),
  })

  // --- Messages -------------------------------------------------------------------
  const conversations: Prisma.ConversationCreateManyInput[] = []
  const participants: Prisma.ConversationParticipantCreateManyInput[] = []
  const messages: Prisma.MessageCreateManyInput[] = []
  const addConversation = (
    key: string,
    courseSlug: string,
    people: [string, string],
    thread: { from: 0 | 1; body: string }[],
    startDaysAgo: number,
    unreadFor: string | null
  ) => {
    const id = `${SEED}conversation_${key}`
    let at = daysAgo(startDaysAgo)
    const times = thread.map(() => {
      at = new Date(Math.min(at.getTime() + rand.int(2, 20) * HOUR, NOW.getTime() - HOUR))
      return at
    })
    const last = times[times.length - 1]!
    conversations.push({
      id,
      courseId: courseBySlug(courseSlug).id,
      lastMessageAt: last,
      createdAt: times[0]!,
    })
    for (const person of people) {
      participants.push({
        id: `${id}_${person}`,
        conversationId: id,
        userId: person,
        lastReadAt: person === unreadFor ? times[times.length - 2] ?? null : last,
      })
    }
    thread.forEach((message, index) => {
      messages.push({
        id: `${id}_m${index}`,
        conversationId: id,
        senderId: people[message.from],
        body: message.body,
        sentAt: times[index]!,
      })
    })
  }
  addConversation(
    "student_maya",
    "modern-react-and-nextjs",
    [studentId, instructorAccount.id],
    STUDENT_THREAD.map((message) => ({
      from: message.from === "student" ? 0 : 1,
      body: message.body,
    })),
    3,
    studentId
  )
  const reactLearner = enrollmentList.find(
    (enrollment) =>
      enrollment.course.spec.slug === "modern-react-and-nextjs" && enrollment.userId !== studentId
  )!
  addConversation(
    "learner_maya",
    "modern-react-and-nextjs",
    [reactLearner.userId, instructorAccount.id],
    [
      { from: 0, body: "Hi Maya, is there a recommended order for the bonus articles?" },
      { from: 0, body: "Also — will there be a section on testing? Thanks!" },
    ],
    1,
    instructorAccount.id
  )
  addConversation(
    "student_sofia",
    "ui-design-foundations",
    [studentId, instructorUserId.get("sofia")!],
    [
      { from: 0, body: "Hi Sofia, which fonts would you recommend for a developer portfolio?" },
      { from: 1, body: "Inter or Geist for UI, paired with a serif like Lora for headings if you want some personality. Keep it to two families." },
      { from: 0, body: "Perfect, thank you!" },
    ],
    8,
    null
  )

  // --- Moderation, applications, audit --------------------------------------------------
  const reports: Prisma.ContentReportCreateManyInput[] = []
  if (flaggedReviewId) {
    reports.push({
      id: `${SEED}report_review`,
      reporterId: activeLearners[10]!.id,
      targetType: "REVIEW",
      targetId: flaggedReviewId,
      targetLabel: "Review on Modern React & Next.js",
      reason: "SPAM",
      note: "Looks like a copy-pasted review.",
      createdAt: daysAgo(2),
    })
  }
  if (reportedDiscussionId) {
    reports.push({
      id: `${SEED}report_discussion`,
      reporterId: activeLearners[12]!.id,
      targetType: "DISCUSSION",
      targetId: reportedDiscussionId,
      targetLabel: DISCUSSIONS[5]!.title,
      reason: "OTHER",
      note: "Off-topic salary numbers, maybe move to careers?",
      status: "DISMISSED",
      resolvedById: adminId,
      resolvedAt: daysAgo(4),
      resolutionNote: "It is in the careers topic already — no action needed.",
      createdAt: daysAgo(5),
    })
  }
  reports.push({
    id: `${SEED}report_question`,
    reporterId: activeLearners[14]!.id,
    targetType: "COURSE_QUESTION",
    targetId: `${SEED}question_5`,
    targetLabel: QUESTIONS[5]!.title,
    reason: "SPOILERS",
    note: "Contains the quiz answers.",
    createdAt: daysAgo(1, 3),
  })
  reports.push({
    id: `${SEED}report_user`,
    reporterId: activeLearners[16]!.id,
    targetType: "USER",
    targetId: learners[0]!.id,
    targetLabel: learners[0]!.name,
    reason: "ABUSIVE",
    note: "Sent aggressive messages in the community.",
    status: "REMOVED",
    resolvedById: adminId,
    resolvedAt: daysAgo(20),
    resolutionNote: "Account suspended.",
    createdAt: daysAgo(21),
  })

  const applications: Prisma.InstructorApplicationCreateManyInput[] = [
    {
      id: `${SEED}application_0`,
      userId: activeLearners[20]!.id,
      pitch: "I'm a senior iOS engineer with 9 years of experience and I'd like to teach a SwiftUI course for web developers.",
      portfolioUrls: ["https://github.com/example-ios", "https://example.dev"],
      createdAt: daysAgo(1, 2),
    },
    {
      id: `${SEED}application_1`,
      userId: activeLearners[21]!.id,
      pitch: "Data engineer at a logistics company. I want to teach practical SQL for analysts.",
      portfolioUrls: ["https://example.com/sql-talk"],
      createdAt: daysAgo(3),
    },
    {
      id: `${SEED}application_2`,
      userId: activeLearners[22]!.id,
      pitch: "I'd like to teach crypto trading strategies.",
      portfolioUrls: [],
      status: "REJECTED",
      reviewedById: adminId,
      reviewedAt: daysAgo(30),
      decisionNote: "Financial trading advice falls outside our course guidelines.",
      createdAt: daysAgo(32),
    },
  ]

  const invitations: Prisma.UserInvitationCreateManyInput[] = [
    {
      id: `${SEED}invitation_0`,
      email: "new.teammate@example.com",
      name: "Riley Morgan",
      role: "admin",
      token: `${SEED}invitation_token_0`,
      sendEmail: true,
      expiresAt: new Date(NOW.getTime() + 5 * DAY),
      invitedById: adminId,
      createdAt: daysAgo(2),
    },
  ]

  const adminActor = { actorId: adminId, actorName: adminAccount.name, actorRole: "admin" }
  const audit: Prisma.AuditLogCreateManyInput[] = [
    ...publishedCourses.slice(0, 8).map((course, index) => ({
      id: `${SEED}audit_approve_${index}`,
      ...adminActor,
      action: "Approved a course submission",
      targetType: "course",
      targetId: course.id,
      targetLabel: course.spec.title,
      category: "COURSES" as const,
      createdAt: course.publishedAt!,
    })),
    {
      id: `${SEED}audit_changes`,
      ...adminActor,
      action: "Requested changes on a course",
      targetType: "course",
      targetId: courseBySlug("tailwind-css-in-practice").id,
      targetLabel: "Tailwind CSS in Practice",
      category: "COURSES",
      createdAt: new Date(courseBySlug("tailwind-css-in-practice").publishedAt!.getTime() - 8 * DAY),
    },
    ...CATEGORIES.slice(0, 4).map((category, index) => ({
      id: `${SEED}audit_category_${index}`,
      ...adminActor,
      action: "Created a category",
      targetType: "category",
      targetId: categoryId.get(category.slug) ?? null,
      targetLabel: category.name,
      category: "COURSES" as const,
      createdAt: daysAgo(520 - index),
    })),
    {
      id: `${SEED}audit_suspend`,
      ...adminActor,
      action: "Suspended an account",
      targetType: "user",
      targetId: learners[0]!.id,
      targetLabel: learners[0]!.email,
      category: "MEMBERS",
      createdAt: daysAgo(20),
    },
    {
      id: `${SEED}audit_invite`,
      ...adminActor,
      action: "Invited a new member",
      targetType: "user",
      targetLabel: "new.teammate@example.com",
      category: "MEMBERS",
      createdAt: daysAgo(2),
    },
    {
      id: `${SEED}audit_settings`,
      ...adminActor,
      action: "Updated platform settings",
      targetType: "platform_setting",
      targetLabel: "default instructor revenue share",
      category: "BILLING",
      createdAt: daysAgo(45),
    },
    {
      id: `${SEED}audit_signin`,
      ...adminActor,
      action: "Signed in from a new device",
      category: "SECURITY",
      ipAddress: "203.0.113.24",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      createdAt: daysAgo(6),
    },
  ]

  // --- Promotions ----------------------------------------------------------------------
  const dataAiId = categoryId.get("data-ai")!

  // --- Notifications -------------------------------------------------------------------
  const notifications: Prisma.NotificationCreateManyInput[] = []
  const notify = (
    userId: string,
    audience: "LEARNER" | "INSTRUCTOR" | "ADMIN",
    category: Prisma.NotificationCreateManyInput["category"],
    title: string,
    body: string,
    hoursAgo: number,
    read: boolean,
    target?: { type: string; id: string }
  ) => {
    const at = new Date(NOW.getTime() - hoursAgo * HOUR)
    notifications.push({
      id: `${SEED}notification_${notifications.length}`,
      userId,
      audience,
      category,
      title,
      body,
      targetType: target?.type ?? null,
      targetId: target?.id ?? null,
      readAt: read ? new Date(at.getTime() + HOUR) : null,
      createdAt: at,
    })
  }
  const react = courseBySlug("modern-react-and-nextjs")
  const advanced = courseBySlug("advanced-nextjs-patterns")
  notify(studentId, "LEARNER", "MESSAGE", "Maya Chen replied to your message", "“Great! Share it in the community when it's done…”", 2, false)
  notify(studentId, "LEARNER", "COURSE", "Your question got an answer", "Maya answered “When should I use a Server Action vs an API route?”", 20, false, { type: "course", id: react.id })
  notify(studentId, "LEARNER", "COMMUNITY", "3 new replies in a thread you follow", "Show your final project from the React course", 30, true)
  notify(studentId, "LEARNER", "CERTIFICATE", "You earned a certificate 🎉", "Deep Work & Focus for Makers — well done!", 40 * 24, true, { type: "certificate", id: `${SEED}certificate_${studentEnrollments.get("deep-work-and-focus")!.id}` })
  notify(studentId, "LEARNER", "CERTIFICATE", "You earned a certificate 🎉", "TypeScript: From Zero to Confident — well done!", 60 * 24, true, { type: "certificate", id: `${SEED}certificate_${studentEnrollments.get("typescript-from-zero-to-confident")!.id}` })
  notify(studentId, "LEARNER", "BILLING", "Receipt for Python for Data Analysis", "Thanks for your purchase — your course is ready.", 48, true)

  const recentMaya = enrollmentList
    .filter((enrollment) => enrollment.course.spec.instructor === "maya" && enrollment.userId !== studentId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  for (const [index, enrollment] of recentMaya.slice(0, 4).entries()) {
    const person = personById.get(enrollment.userId)!
    notify(instructorAccount.id, "INSTRUCTOR", "COURSE", `${person.name} enrolled in ${enrollment.course.spec.title}`, "A new student joined your course.", Math.max(1, (NOW.getTime() - enrollment.createdAt.getTime()) / HOUR), index > 1, { type: "course", id: enrollment.course.id })
  }
  notify(instructorAccount.id, "INSTRUCTOR", "MESSAGE", "New message from a student", "“Also — will there be a section on testing? Thanks!”", 5, false)
  notify(instructorAccount.id, "INSTRUCTOR", "COURSE", "New question in Modern React & Next.js", QUESTIONS[5]!.title, 26, false, { type: "course", id: react.id })
  notify(instructorAccount.id, "INSTRUCTOR", "COURSE", "Advanced Next.js Patterns was submitted for review", "We'll email you when the review is done — usually within 2 business days.", 29, true, { type: "course", id: advanced.id })
  notify(instructorAccount.id, "INSTRUCTOR", "BILLING", "Your monthly payout was sent", "Check Revenue for the breakdown.", 24 * 12, true)

  notify(adminId, "ADMIN", "COURSE", "Advanced Next.js Patterns is awaiting review", "Maya Chen submitted it for approval.", 29, false, { type: "course", id: advanced.id })
  notify(adminId, "ADMIN", "MEMBERS", "New instructor application", "A learner applied to teach SwiftUI.", 26, false)
  notify(adminId, "ADMIN", "COMMUNITY", "A question was reported", "“Can I use this with the Pages Router?” — reported as spoilers.", 27, false)
  notify(adminId, "ADMIN", "COMMUNITY", "A post is waiting for approval", "In Careers & Jobs.", 6, true)
  notify(adminId, "ADMIN", "BILLING", "Payout run completed", "Last month's instructor payouts were sent.", 24 * 12, true)

  // --- Cart, wishlist, follows, notes -------------------------------------------------------
  const cartItems: Prisma.CartItemCreateManyInput[] = ["machine-learning-essentials", "figma-for-product-teams"].map((slug, index) => ({
    id: `${SEED}cart_${index}`,
    userId: studentId,
    courseSlug: slug,
    courseId: courseBySlug(slug).id,
    createdAt: daysAgo(index + 1),
  }))
  const wishlistItems: Prisma.WishlistItemCreateManyInput[] = [
    "node-apis-with-postgres",
    "prompt-engineering-for-builders",
    "growth-marketing-playbook",
  ].map((slug, index) => ({
    id: `${SEED}wishlist_${index}`,
    userId: studentId,
    courseSlug: slug,
    courseId: courseBySlug(slug).id,
    createdAt: daysAgo(index * 4 + 3),
  }))
  const follows: Prisma.InstructorFollowCreateManyInput[] = [
    { id: `${SEED}follow_student_maya`, userId: studentId, instructorId: instructorId.get("maya")!, createdAt: daysAgo(30) },
    { id: `${SEED}follow_student_sofia`, userId: studentId, instructorId: instructorId.get("sofia")!, createdAt: daysAgo(12) },
    ...activeLearners.slice(0, 24).map((learner, index) => ({
      id: `${SEED}follow_${index}`,
      userId: learner.id,
      instructorId: instructorId.get(INSTRUCTORS[index % INSTRUCTORS.length]!.key)!,
      createdAt: daysAgo(rand.int(1, 200)),
    })),
  ]
  const reactLessons = react.lessons
  const notes: Prisma.LessonNoteCreateManyInput[] = [
    {
      id: `${SEED}note_0`,
      userId: studentId,
      lessonId: reactLessons[5]!.id,
      body: "useState setter is async-ish — read the new value in the next render, not right after calling it.",
      timestampSeconds: 312,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
    {
      id: `${SEED}note_1`,
      userId: studentId,
      lessonId: reactLessons[9]!.id,
      body: "Server Components can't use hooks or event handlers. Push interactivity down into small client components.",
      timestampSeconds: 540,
      createdAt: daysAgo(6),
      updatedAt: daysAgo(6),
    },
  ]

  // --- Uptime ---------------------------------------------------------------------------
  const failures = new Map<number, number>([[6, 5], [19, 4], [33, 21], [41, 12], [48, 9], [55, 10], [67, 14], [78, 7]])
  const uptime: Prisma.UptimeSampleCreateManyInput[] = Array.from({ length: 90 }, (_, index) => {
    const day = daysAgo(index + 1)
    day.setUTCHours(0, 0, 0, 0)
    return {
      id: `${SEED}up_${day.toISOString().slice(0, 10)}`,
      day,
      checksTotal: 1440,
      checksOk: 1440 - (failures.get(index + 1) ?? 0),
    }
  })

  // ---------------------------------------------------------------------------
  // Write, in dependency order.
  // ---------------------------------------------------------------------------
  log("Writing people…")
  await db.user.createMany({ data: users })
  await db.account.createMany({ data: accounts })
  await db.instructor.createMany({ data: instructors })

  log("Writing the catalog…")
  await db.course.createMany({ data: courses })
  await db.courseSection.createMany({ data: sections })
  await db.courseLesson.createMany({ data: lessons })
  if (mediaAssets.length) await db.mediaAsset.createMany({ data: mediaAssets })
  await db.quiz.createMany({ data: quizzes })
  await db.quizQuestion.createMany({ data: quizQuestions })
  await db.quizOption.createMany({ data: quizOptions })
  await db.courseSubmission.createMany({ data: submissions })
  await db.courseSubmissionCheck.createMany({ data: submissionChecks })
  await db.coupon.createMany({ data: coupons })

  log("Writing orders, enrolments and earnings…")
  await db.order.createMany({ data: orders })
  await db.orderItem.createMany({ data: orderItems })
  await db.refund.createMany({ data: refunds })
  await db.couponRedemption.createMany({ data: redemptions })
  await db.payoutMethod.createMany({ data: payoutMethods })
  await db.payoutRun.createMany({ data: payoutRuns })
  await db.payout.createMany({ data: payouts })
  await db.instructorEarning.createMany({ data: earnings })
  await db.enrollment.createMany({ data: enrollments })
  await db.lessonProgress.createMany({ data: progress })
  await db.quizAttempt.createMany({ data: quizAttempts })
  await db.quizAnswer.createMany({ data: quizAnswers })
  await db.certificate.createMany({ data: certificates })

  log("Writing reviews, Q&A and community…")
  await db.courseReview.createMany({ data: reviews })
  await db.courseReviewReply.createMany({ data: reviewReplies })
  await db.courseQuestion.createMany({ data: questions })
  await db.courseQuestionReply.createMany({ data: questionReplies })
  await db.courseQuestionVote.createMany({ data: questionVotes })
  await db.communityTopic.createMany({ data: topics })
  await db.topicModerator.createMany({ data: moderators })
  await db.discussion.createMany({ data: discussions })
  await db.discussionReply.createMany({ data: discussionReplies })
  await db.discussionLike.createMany({ data: discussionLikes })
  await db.conversation.createMany({ data: conversations })
  await db.conversationParticipant.createMany({ data: participants })
  await db.message.createMany({ data: messages })

  log("Writing the console's data…")
  await db.contentReport.createMany({ data: reports })
  await db.instructorApplication.createMany({ data: applications })
  await db.userInvitation.createMany({ data: invitations })
  await db.auditLog.createMany({ data: audit })
  await db.promotion.create({
    data: {
      id: `${SEED}promotion_data_week`,
      name: "Data & AI Week",
      discountType: "PERCENT",
      value: 25,
      scope: "CATEGORIES",
      categories: { connect: [{ id: dataAiId }] },
      startsAt: daysAgo(2),
      endsAt: new Date(NOW.getTime() + 5 * DAY),
      redemptionCount: 14,
      revenueCents: 14 * 1499,
    },
  })
  await db.promotion.create({
    data: {
      id: `${SEED}promotion_summer`,
      name: "Summer Sale",
      discountType: "PERCENT",
      value: 30,
      scope: "ALL_COURSES",
      startsAt: daysAgo(100),
      endsAt: daysAgo(86),
      redemptionCount: 63,
      revenueCents: 63 * 1299,
    },
  })
  await db.notification.createMany({ data: notifications })
  await db.cartItem.createMany({ data: cartItems })
  await db.wishlistItem.createMany({ data: wishlistItems })
  await db.instructorFollow.createMany({ data: follows })
  await db.lessonNote.createMany({ data: notes })
  await db.uptimeSample.createMany({ data: uptime })

  const summary = {
    users: users.length,
    courses: courses.length,
    lessons: lessons.length,
    enrollments: enrollments.length,
    orders: orders.length,
    reviews: reviews.length,
    certificates: certificates.length,
    videos: mediaAssets.length,
  }
  log(`Done: ${JSON.stringify(summary)}`)
  return summary
}
