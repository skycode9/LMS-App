import { describe, expect, it } from "vitest"

import {
  deltaToneClass,
  formatCountDelta,
  formatDelta,
  formatMoney,
} from "@/components/dashboard/stat-format"
import { compactAgo, longAgo, longAgoPrecise } from "@/lib/relative-time"

const NOW = new Date("2026-06-15T12:00:00Z")
const ago = (ms: number) => new Date(NOW.getTime() - ms)
const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe("relative time", () => {
  it("compacts short ages", () => {
    expect(compactAgo(ago(10_000), NOW)).toBe("just now")
    expect(compactAgo(ago(5 * MINUTE), NOW)).toBe("5m ago")
    expect(compactAgo(ago(3 * HOUR), NOW)).toBe("3h ago")
    expect(compactAgo(ago(2 * DAY), NOW)).toBe("2d ago")
    expect(compactAgo(ago(21 * DAY), NOW)).toBe("3w ago")
  })

  it("never reports a future date as negative", () => {
    expect(compactAgo(new Date(NOW.getTime() + HOUR), NOW)).toBe("just now")
  })

  it("writes long ages in words with correct plurals", () => {
    expect(longAgo(ago(2 * HOUR), NOW)).toBe("Today")
    expect(longAgo(ago(DAY + HOUR), NOW)).toBe("Yesterday")
    expect(longAgo(ago(8 * DAY), NOW)).toBe("1 week ago")
    expect(longAgo(ago(65 * DAY), NOW)).toBe("2 months ago")
    expect(longAgo(ago(800 * DAY), NOW)).toBe("2 years ago")
    expect(longAgoPrecise(ago(MINUTE), NOW)).toBe("1 minute ago")
    expect(longAgoPrecise(ago(5 * HOUR), NOW)).toBe("5 hours ago")
  })
})

describe("stat formatting", () => {
  it("formats minor units as money, dropping zero cents", () => {
    expect(formatMoney(1999)).toBe("$19.99")
    expect(formatMoney(120000)).toBe("$1,200")
  })

  it("signs deltas with a real minus sign", () => {
    expect(formatDelta(0.125)).toBe("+12.5%")
    expect(formatDelta(-0.04)).toBe("−4.0%")
    expect(formatDelta(null)).toBeNull()
    expect(formatCountDelta(-2)).toBe("−2")
  })

  it("colours deltas by direction", () => {
    expect(deltaToneClass(0.1)).toBe("text-success")
    expect(deltaToneClass(-0.1)).toBe("text-destructive")
    expect(deltaToneClass(0)).toBe("text-muted-foreground")
  })
})

describe("utcDayKey", () => {
  it("keys a SQL date bucket in UTC regardless of the local time zone", async () => {
    const { utcDayKey } = await import("@/lib/sql-date")
    expect(utcDayKey("2026-08-01")).toBe(Date.UTC(2026, 7, 1))
    expect(new Date(utcDayKey("2026-01-01")).toISOString()).toBe("2026-01-01T00:00:00.000Z")
  })
})
