/** Shape every API error is normalized to by `src/api/client.ts`. */
export interface ApiError {
  /** HTTP status, or 0 when the request never reached the server. */
  status: number
  /** Message already translated to Spanish, safe to show to the user. */
  message: string
  /** DRF per-field errors, keyed by field name. Empty when there are none. */
  fieldErrors: Record<string, string[]>
}

/** DRF `PageNumberPagination` envelope. */
export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}
