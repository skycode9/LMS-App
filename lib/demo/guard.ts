import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api"

import { DEMO_MODE, isDemoEmail, isDemoUserId } from "@/lib/demo/config"

/**
 * What keeps the shared demo accounts usable for the next visitor.
 *
 * The demo accounts' credentials are public, so anything that would lock the
 * next person out — a new password, a new email, a deleted or suspended
 * account, a demoted admin — is refused **for those three accounts only**.
 * Everything else stays open: a visitor can still edit courses, post, buy with
 * a test card and moderate, and the nightly reset puts the data back.
 *
 * The accounts are protected whether or not `DEMO_MODE` is on, because their
 * passwords are printed in the README either way. `DEMO_MODE` additionally
 * locks platform-wide settings, which every visitor would see.
 */

export const DEMO_LOCKED_MESSAGE =
  "This is a shared demo account, so this action is turned off. Create your own account to try it."

/** Better Auth endpoints that act on the signed-in account itself. */
const SELF_PATHS = new Set([
  "/change-password",
  "/change-email",
  "/delete-user",
  "/set-password",
])

/** Admin plugin endpoints that act on another account, named by `userId`. */
const ADMIN_TARGET_PATHS = new Set([
  "/admin/ban-user",
  "/admin/set-role",
  "/admin/remove-user",
  "/admin/set-user-password",
  "/admin/update-user",
  "/admin/revoke-user-sessions",
  "/admin/revoke-user-session",
])

function refuse(): never {
  throw new APIError("FORBIDDEN", { message: DEMO_LOCKED_MESSAGE })
}

/** Registered as Better Auth's `hooks.before` in `lib/auth.ts`. */
export const demoAccountGuard = createAuthMiddleware(async (ctx) => {
  const body = (ctx.body ?? {}) as Record<string, unknown>

  if (ADMIN_TARGET_PATHS.has(ctx.path)) {
    if (isDemoUserId(body.userId as string | undefined)) refuse()
    return
  }

  if (ctx.path === "/request-password-reset") {
    if (isDemoEmail(body.email as string | undefined)) refuse()
    return
  }

  if (SELF_PATHS.has(ctx.path)) {
    const session = await getSessionFromCtx(ctx)
    if (
      session &&
      (isDemoUserId(session.user.id) || isDemoEmail(session.user.email))
    ) {
      refuse()
    }
  }
})

/** For Server Actions that change another account's standing. */
export function touchesDemoAccount(userIds: readonly string[]): boolean {
  return userIds.some((id) => isDemoUserId(id))
}

/** Platform-wide settings (site title, branding) are frozen on the public demo. */
export function platformSettingsLocked(): boolean {
  return DEMO_MODE
}
