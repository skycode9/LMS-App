/**
 * Month/day buckets from raw SQL, keyed as UTC epoch milliseconds.
 *
 * The charts group rows with `date_trunc(... AT TIME ZONE 'UTC')`, which
 * yields a timestamp *without* a zone. How a driver turns that into a `Date`
 * depends on the adapter and the server's time zone — read back with local
 * getters it lands a day early anywhere west of UTC, and every bar shifts one
 * month to the left. So the queries return the bucket as text instead
 * (`to_char(..., 'YYYY-MM-DD')`) and this parses it as UTC, which gives the
 * same key on a laptop in California and a server in UTC.
 */
export function utcDayKey(day: string): number {
  const [year, month, date] = day.split("-").map(Number)
  return Date.UTC(year!, month! - 1, date!)
}
