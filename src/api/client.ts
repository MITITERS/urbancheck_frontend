import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import { endpoints } from '@/api/endpoints'
import { LOGIN_ROUTE } from '@/config/constants'
import { messages } from '@/config/messages'
import { clearStoredToken, getStoredToken, storeToken } from '@/lib/session'
import type { ApiError } from '@/types/api'

/** Flags a request that already went through one refresh attempt. */
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retriedAfterRefresh?: boolean
}

/**
 * The single axios instance of the application. No component imports `axios`
 * directly (ESLint enforces it); everything goes through this client.
 *
 * `VITE_API_URL` is empty by default so requests are same-origin and the dev
 * server / nginx proxy them to the backend. Set it to an absolute URL to hit a
 * backend on another origin — that requires CORS on the backend side.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { Accept: 'application/json' },
})

/**
 * Called when the session is definitely gone. `AuthProvider` registers a
 * handler that clears its state; the fallback is a hard redirect so a stale tab
 * never sits on a protected screen.
 */
let onSessionExpired: (() => void) | null = null

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler
}

function expireSession(): void {
  clearStoredToken()
  if (onSessionExpired) {
    onSessionExpired()
    return
  }
  if (window.location.pathname !== LOGIN_ROUTE) {
    window.location.assign(LOGIN_ROUTE)
  }
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.set('X-Session-Token', token)
  }
  return config
})

/**
 * allauth's headless mode has no refresh-token grant: the session token is
 * re-validated (and rotated, when the backend decides to) by reading the
 * session itself. That request is made with a bare axios call so it never
 * re-enters this interceptor.
 */
async function refreshSession(): Promise<boolean> {
  const token = getStoredToken()
  if (!token) return false
  try {
    const response = await axios.get<{ meta?: { session_token?: string } }>(
      endpoints.auth.session,
      {
        baseURL: apiClient.defaults.baseURL,
        headers: { Accept: 'application/json', 'X-Session-Token': token },
      },
    )
    const rotated = response.data?.meta?.session_token
    if (rotated) storeToken(rotated)
    return true
  } catch {
    return false
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(normalizeError(error))
    }

    const config = error.config as RetriableConfig | undefined
    const isSessionRequest = config?.url === endpoints.auth.session

    if (
      error.response?.status === 401 &&
      config &&
      !config._retriedAfterRefresh &&
      !isSessionRequest
    ) {
      config._retriedAfterRefresh = true
      if (await refreshSession()) {
        return apiClient.request(config)
      }
      expireSession()
      return Promise.reject(createApiError(401, messages.auth.sessionExpired))
    }

    if (error.response?.status === 401) {
      expireSession()
    }

    return Promise.reject(normalizeError(error))
  },
)

/**
 * The only constructor of `ApiError`. Errors are plain objects rather than
 * `Error` subclasses because that is the contract components consume.
 */
export function createApiError(
  status: number,
  message: string,
  fieldErrors: Record<string, string[]> = {},
): ApiError {
  return { status, message, fieldErrors }
}

/** allauth headless error envelope: `{ status, errors: [{ message, param }] }`. */
interface AllauthErrorBody {
  errors?: { message?: string; code?: string; param?: string }[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toStringList(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value))
    return value.filter((v): v is string => typeof v === 'string')
  return []
}

/**
 * Collapses every error shape the backend can produce — DRF field errors, DRF
 * `detail`, allauth's `errors` array, network failures — into a single
 * `ApiError`, so no component has to interpret raw payloads.
 */
export function normalizeError(error: unknown): ApiError {
  if (isApiError(error)) return error

  if (!axios.isAxiosError(error)) {
    return createApiError(0, messages.errors.unexpected)
  }

  const axiosError = error as AxiosError<unknown>
  const status = axiosError.response?.status ?? 0

  if (!axiosError.response) {
    return createApiError(0, messages.errors.network)
  }

  const data = axiosError.response.data
  const fieldErrors: Record<string, string[]> = {}
  let message = defaultMessageForStatus(status)

  if (isRecord(data)) {
    const allauthErrors = (data as AllauthErrorBody).errors
    if (Array.isArray(allauthErrors) && allauthErrors.length > 0) {
      for (const item of allauthErrors) {
        if (!item?.message) continue
        const key = item.param ?? 'nonFieldErrors'
        fieldErrors[key] = [...(fieldErrors[key] ?? []), item.message]
      }
      message = allauthErrors[0]?.message ?? message
    } else {
      for (const [key, value] of Object.entries(data)) {
        if (key === 'detail') continue
        const list = toStringList(value)
        if (list.length > 0) fieldErrors[key] = list
      }
      if (typeof data.detail === 'string') {
        message = data.detail
      } else {
        const first = Object.values(fieldErrors)[0]?.[0]
        if (first) message = first
      }
    }
  }

  if (status === HTTP_TOO_MANY_REQUESTS) {
    // Límite de intentos o de tasa. El de la API llega en castellano y con el
    // tiempo de espera (`code: "throttled"`); el de allauth —el bloqueo de
    // login— en inglés y sin campo, así que se reemplaza por el propio.
    const throttled =
      isRecord(data) && data.code === 'throttled' && typeof data.detail === 'string'
    message = throttled ? (data.detail as string) : messages.errors.tooManyRequests
    return createApiError(status, message)
  }

  return createApiError(status, message, fieldErrors)
}

const HTTP_TOO_MANY_REQUESTS = 429

function defaultMessageForStatus(status: number): string {
  if (status === 403) return messages.errors.forbidden
  if (status === 404) return messages.errors.notFound
  if (status === 401) return messages.auth.sessionExpired
  return messages.errors.unexpected
}

export function isApiError(value: unknown): value is ApiError {
  return (
    isRecord(value) &&
    typeof value.status === 'number' &&
    typeof value.message === 'string' &&
    isRecord(value.fieldErrors)
  )
}
