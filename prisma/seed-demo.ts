import "dotenv/config"

import { PrismaPg } from "@prisma/adapter-pg"

import { DEMO_ACCOUNTS } from "@/lib/demo/config"
import { seedDemo } from "@/lib/demo/seed"
import { PrismaClient } from "@/lib/generated/prisma/client"

/**
 * `npm run db:seed:demo` — fills the database with the public demo dataset
 * (see `lib/demo/seed.ts`). Safe to re-run: it removes the previous demo rows
 * first and leaves anything a real person created alone.
 *
 * `npm run db:seed:demo -- --wipe` empties every table first instead. Only
 * use that on a database that exists for the demo.
 */

const db = new PrismaClient({
  // The direct endpoint, like the CLI: a long script wants session state,
  // not PgBouncer's transaction mode.
  adapter: new PrismaPg({
    connectionString: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  }),
})

async function main() {
  const wipe = process.argv.includes("--wipe")
  const started = Date.now()
  await seedDemo(db, { wipe, log: (message) => console.log(`  ${message}`) })
  console.log(`\n  Demo data ready in ${((Date.now() - started) / 1000).toFixed(1)}s.\n`)
  console.log("  Sign in with:")
  for (const account of DEMO_ACCOUNTS) {
    console.log(`    ${account.label.padEnd(11)} ${account.email}  /  ${account.password}`)
  }
  console.log("")
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
