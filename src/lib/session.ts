import { SESSION_TOKEN_KEY } from '@/config/constants'

/**
 * Where the session token lives.
 *
 * Decision: `localStorage`.
 *
 * The backend runs django-allauth in "headless app" mode, which does not set an
 * httpOnly cookie: the token has to be read by JavaScript and attached as the
 * `X-Session-Token` header, so a cookie-only storage is not an option here.
 * Between the two JS-readable stores, `localStorage` wins over `sessionStorage`
 * because municipal agents work with several tabs open and `sessionStorage`
 * would force one login per tab. The trade-off is that an XSS bug would expose
 * the token; we accept it because the panel renders no user-supplied HTML.
 *
 * Everything goes through this module, so switching stores is a one-file change.
 */

let inMemoryToken: string | null = null

export function getStoredToken(): string | null {
  if (inMemoryToken !== null) return inMemoryToken
  try {
    inMemoryToken = window.localStorage.getItem(SESSION_TOKEN_KEY)
  } catch {
    // Private mode or storage disabled: fall back to the in-memory copy only.
    inMemoryToken = null
  }
  return inMemoryToken
}

export function storeToken(token: string): void {
  inMemoryToken = token
  try {
    window.localStorage.setItem(SESSION_TOKEN_KEY, token)
  } catch {
    // Ignored on purpose: the in-memory copy keeps the current tab working.
  }
}

export function clearStoredToken(): void {
  inMemoryToken = null
  try {
    window.localStorage.removeItem(SESSION_TOKEN_KEY)
  } catch {
    // Ignored on purpose.
  }
}
