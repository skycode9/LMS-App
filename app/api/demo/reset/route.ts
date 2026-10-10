import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { DEMO_MODE } from "@/lib/demo/config"
import { seedDemo } from "@/lib/demo/seed"

/**
 * The public demo's nightly reset: empties the database and writes the demo
 * dataset again, so whatever visitors changed during the day is undone.
 *
 * Called by Vercel Cron (`vercel.json`), which sends
 * `Authorization: Bearer $CRON_SECRET`. Two locks, because this truncates
 * every table:
 *
 *  - it only runs where `NEXT_PUBLIC_DEMO_MODE=true` — a database that exists
 *    for the demo, never a real one;
 *  - it needs the `CRON_SECRET`, so nobody can trigger it from a browser.
 */

// A reset writes a few thousand rows; give it room on a serverless function.
export const maxDuration = 60
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (!DEMO_MODE) {
    return NextResponse.json({ error: "Not a demo deployment." }, { status: 404 })
  }

  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const started = Date.now()
  const summary = await seedDemo(db, { wipe: true })
  return NextResponse.json({ ok: true, ms: Date.now() - started, ...summary })
}
