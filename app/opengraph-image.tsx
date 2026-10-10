import { ImageResponse } from "next/og"

import { siteConfig } from "@/lib/config/site"

/**
 * The link-preview card (LinkedIn, X, Slack, WhatsApp) for every page that
 * doesn't draw its own. Drawn with plain shapes and system fonts so it needs
 * no network fetch at build time.
 */

export const alt = `${siteConfig.name} — ${siteConfig.description}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const FEATURES = ["Courses & video player", "Quizzes & certificates", "Stripe checkout", "Instructor & admin consoles"]

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0b0b0d 0%, #1e1b4b 55%, #0e7490 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            L
          </div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>{siteConfig.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            Learn anything.
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, color: "#a5b4fc" }}>
            Teach everything.
          </div>
          <div style={{ marginTop: 28, fontSize: 28, color: "rgba(255,255,255,0.75)" }}>
            A full-stack learning platform — Next.js, Prisma, Stripe, Better Auth.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {FEATURES.map((feature) => (
            <div
              key={feature}
              style={{
                display: "flex",
                padding: "10px 20px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.08)",
                fontSize: 22,
              }}
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  )
}
