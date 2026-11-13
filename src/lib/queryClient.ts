import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/api/client'
import { DEFAULT_STALE_TIME_MS } from '@/config/constants'

/** A 4xx will not fix itself on a retry: only 5xx and network errors are retried. */
const MAX_RETRIES = 2

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false
  if (isApiError(error) && error.status >= 400 && error.status < 500) return false
  return true
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        retry: shouldRetry,
        // The panel is polled (see POLLING_INTERVAL_MS); coming back to the tab
        // should show fresh data immediately instead of waiting for the tick.
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        // A failed write is never retried automatically: the user decides.
        retry: false,
      },
    },
  })
}

export const queryClient = createQueryClient()
