"use client"

import "./globals.css"

/**
 * The last-resort boundary: an error in the root layout itself. It replaces
 * the whole document, so it brings its own `<html>` and stylesheet and uses
 * nothing that depends on the providers the root layout would have set up.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center bg-background px-6 text-center font-sans text-foreground antialiased">
        <div className="max-w-md">
          <h1 className="text-[26px] leading-tight font-bold">Something went wrong</h1>
          <p className="mt-2.5 text-[15px] text-muted-foreground">
            An unexpected error stopped the page from loading. Trying again often fixes it.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-7 h-10 cursor-pointer rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          {error.digest ? (
            <p className="mt-4 text-[13px] text-subtle-foreground">
              Error reference: <span className="font-mono">{error.digest}</span>
            </p>
          ) : null}
        </div>
      </body>
    </html>
  )
}
