import { describe, expect, it } from "vitest"

import { sanitizeArticle } from "@/lib/article-body"
import { DEMO_ACCOUNTS, isDemoEmail, isDemoUserId } from "@/lib/demo/config"
import { CATEGORIES, COURSES, INSTRUCTORS } from "@/lib/demo/content"
import { touchesDemoAccount } from "@/lib/demo/guard"
import { COURSE_COVERS } from "@/lib/demo/media"
import { articleDoc } from "@/lib/demo/seed"

describe("demo accounts", () => {
  it("has one account per role, all with seed ids", () => {
    expect(DEMO_ACCOUNTS.map((account) => account.role).sort()).toEqual([
      "admin",
      "instructor",
      "student",
    ])
    for (const account of DEMO_ACCOUNTS) {
      expect(account.id.startsWith("seed_")).toBe(true)
      expect(account.password.length).toBeGreaterThanOrEqual(8)
    }
  })

  it("recognises demo accounts by email (case-insensitive) and id", () => {
    expect(isDemoEmail("Student@Lumen.demo ")).toBe(true)
    expect(isDemoEmail("someone@example.com")).toBe(false)
    expect(isDemoEmail(undefined)).toBe(false)
    expect(isDemoUserId("seed_user_admin")).toBe(true)
    expect(isDemoUserId("seed_user_learner_4")).toBe(false)
    expect(touchesDemoAccount(["abc", "seed_user_student"])).toBe(true)
    expect(touchesDemoAccount(["abc"])).toBe(false)
  })
})

describe("demo catalog", () => {
  const categorySlugs = new Set(CATEGORIES.map((category) => category.slug))
  const instructorKeys = new Set(INSTRUCTORS.map((instructor) => instructor.key))

  it("uses unique slugs that each have a cover slot", () => {
    const slugs = COURSES.map((course) => course.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(COURSE_COVERS).toHaveProperty(slug)
  })

  it("points every course at a real category and instructor", () => {
    for (const course of COURSES) {
      expect(categorySlugs.has(course.category), course.slug).toBe(true)
      expect(instructorKeys.has(course.instructor), course.slug).toBe(true)
      expect(course.priceCents).toBeLessThanOrEqual(course.listPriceCents)
    }
  })

  it("has a valid answer for every quiz question", () => {
    for (const course of COURSES) {
      for (const section of course.sections) {
        for (const lesson of section.lessons) {
          if (lesson[0] !== "q") continue
          for (const question of lesson[2]) {
            expect(question.options.length, question.prompt).toBeGreaterThanOrEqual(2)
            expect(question.answer, question.prompt).toBeGreaterThanOrEqual(0)
            expect(question.answer, question.prompt).toBeLessThan(question.options.length)
          }
        }
      }
    }
  })

  it("gives every published course at least one free preview lesson", () => {
    for (const course of COURSES.filter((entry) => entry.status === "PUBLISHED")) {
      const previews = course.sections
        .flatMap((section) => section.lessons)
        .filter((lesson) => lesson[0] === "v" && lesson[3]?.preview)
      expect(previews.length, course.slug).toBeGreaterThan(0)
    }
  })
})

describe("articleDoc", () => {
  it("produces a document the article sanitiser accepts unchanged", () => {
    const stored = articleDoc([
      "Intro with **bold** and *italic* text.",
      "## A heading",
      "- one\n- two",
      "1. first\n2. second",
    ])
    const doc = JSON.parse(stored)
    expect(sanitizeArticle(doc)).toEqual(doc)
    expect(doc.content.map((node: { type: string }) => node.type)).toEqual([
      "paragraph",
      "heading",
      "bulletList",
      "orderedList",
    ])
  })
})
