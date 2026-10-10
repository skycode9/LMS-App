import { describe, expect, it } from "vitest"

import { articleWordCount, parseArticle, sanitizeArticle } from "@/lib/article-body"

describe("sanitizeArticle", () => {
  it("rejects anything that isn't a document", () => {
    expect(sanitizeArticle(null)).toBeNull()
    expect(sanitizeArticle({ type: "paragraph" })).toBeNull()
    expect(sanitizeArticle("<p>hi</p>")).toBeNull()
  })

  it("drops nodes, marks and attributes the editor doesn't offer", () => {
    const doc = sanitizeArticle({
      type: "doc",
      content: [
        { type: "image", attrs: { src: "https://evil.example/x.png" } },
        {
          type: "paragraph",
          attrs: { onclick: "alert(1)" },
          content: [
            { type: "text", text: "bold", marks: [{ type: "bold" }, { type: "link", attrs: { href: "javascript:alert(1)" } }] },
          ],
        },
      ],
    })

    expect(doc).toEqual({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "bold", marks: [{ type: "bold" }] }] },
      ],
    })
  })

  it("clamps heading levels to 2 or 3", () => {
    const doc = sanitizeArticle({
      type: "doc",
      content: [{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Title" }] }],
    })
    expect(doc?.content[0]?.attrs).toEqual({ level: 2 })
  })

  it("drops empty text nodes", () => {
    const doc = sanitizeArticle({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
    })
    expect(doc?.content[0]?.content).toEqual([])
  })
})

describe("parseArticle", () => {
  it("returns null for an empty column", () => {
    expect(parseArticle(null)).toBeNull()
    expect(parseArticle("")).toBeNull()
  })

  it("keeps legacy plain prose as paragraphs", () => {
    const doc = parseArticle("First paragraph.\n\nSecond paragraph.")
    expect(doc?.content).toHaveLength(2)
    expect(doc?.content[1]?.content?.[0]?.text).toBe("Second paragraph.")
  })

  it("round-trips a stored JSON document", () => {
    const stored = JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hello world" }] }],
    })
    const doc = parseArticle(stored)
    expect(doc && articleWordCount(doc)).toBe(2)
  })
})
