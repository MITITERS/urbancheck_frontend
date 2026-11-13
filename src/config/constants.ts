/**
 * Single place for the values we expect to tune without touching feature code.
 */

/**
 * Real-time strategy for the panel is polling, not WebSockets (see README).
 * Lists that must show new reports without a manual reload pass this value to
 * TanStack Query's `refetchInterval`.
 */
export const POLLING_INTERVAL_MS = 30_000

/** Matches the backend's DRF `PAGE_SIZE`. */
export const DEFAULT_PAGE_SIZE = 20

/** How long a query result is considered fresh before a background refetch. */
export const DEFAULT_STALE_TIME_MS = 30_000

/** Storage key for the session token. See `src/lib/sessionStorage.ts`. */
export const SESSION_TOKEN_KEY = 'urbancheck.session_token'

/** Route the user is sent to when there is no valid session. */
export const LOGIN_ROUTE = '/login'

/** Forced password change on first sign-in. */
export const CHANGE_PASSWORD_ROUTE = '/cambiar-password'
