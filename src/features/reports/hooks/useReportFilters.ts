import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DEFAULT_PAGE_SIZE } from '@/config/constants'
import {
  DEFAULT_STATUS_FILTER,
  PAGE_SIZE_OPTIONS,
  REPORT_CATEGORIES,
  REPORT_STATUS_ORDER,
  type ReportCategory,
  type ReportFilters,
  type ReportOrdering,
  type ReportStatus,
} from '../types'

const ORDERINGS: readonly ReportOrdering[] = [
  '-created_at',
  'created_at',
  '-like_count',
  'like_count',
]

const DEFAULT_ORDERING: ReportOrdering = '-created_at'
const FIRST_PAGE = 1

/** Solo se acepta uno de los tamaños que el panel ofrece. */
function parsePageSize(raw: string | null): number {
  const size = Number(raw)
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(size)
    ? size
    : DEFAULT_PAGE_SIZE
}

function parseList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (raw === null) return []
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is T => (allowed as readonly string[]).includes(value))
}

/**
 * Filters and pagination live in the URL query string, not in component state.
 *
 * That is what makes a filtered view shareable and what makes it survive a
 * refresh — and it keeps the query key derived from a single source of truth,
 * so the cache cannot go out of sync with what the agent is looking at.
 *
 * The status filter has a default (the three statuses that still need
 * attention). `status=` with an empty value means "the agent cleared it", which
 * is different from "the agent has not touched it".
 */
export function useReportFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<ReportFilters>(() => {
    const rawStatus = searchParams.get('status')
    return {
      statuses:
        rawStatus === null
          ? [...DEFAULT_STATUS_FILTER]
          : parseList<ReportStatus>(rawStatus, REPORT_STATUS_ORDER),
      categories: parseList<ReportCategory>(
        searchParams.get('category'),
        REPORT_CATEGORIES,
      ),
      zone: searchParams.get('zone') ?? '',
      createdFrom: searchParams.get('created_from') ?? '',
      createdTo: searchParams.get('created_to') ?? '',
      closureReview: searchParams.get('closure_review') === 'true',
      ordering: (ORDERINGS.find((o) => o === searchParams.get('ordering')) ??
        DEFAULT_ORDERING) as ReportOrdering,
      page: Math.max(FIRST_PAGE, Number(searchParams.get('page')) || FIRST_PAGE),
      pageSize: parsePageSize(searchParams.get('page_size')),
    }
  }, [searchParams])

  const update = useCallback(
    (patch: Partial<ReportFilters>) => {
      const next = { ...filters, ...patch }
      const params = new URLSearchParams()

      // Any change other than paging sends the agent back to the first page:
      // staying on page 7 of a result set that no longer has it is a dead end.
      const page = 'page' in patch ? next.page : FIRST_PAGE

      if (
        'statuses' in patch ||
        next.statuses.join(',') !== DEFAULT_STATUS_FILTER.join(',')
      ) {
        params.set('status', next.statuses.join(','))
      }
      if (next.categories.length > 0) params.set('category', next.categories.join(','))
      if (next.zone) params.set('zone', next.zone)
      if (next.createdFrom) params.set('created_from', next.createdFrom)
      if (next.createdTo) params.set('created_to', next.createdTo)
      if (next.closureReview) params.set('closure_review', 'true')
      if (next.ordering !== DEFAULT_ORDERING) params.set('ordering', next.ordering)
      if (next.pageSize !== DEFAULT_PAGE_SIZE) {
        params.set('page_size', String(next.pageSize))
      }
      if (page > FIRST_PAGE) params.set('page', String(page))

      setSearchParams(params, { replace: true })
    },
    [filters, setSearchParams],
  )

  const clear = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  const isFiltered =
    filters.categories.length > 0 ||
    filters.zone !== '' ||
    filters.createdFrom !== '' ||
    filters.createdTo !== '' ||
    filters.closureReview ||
    filters.statuses.join(',') !== DEFAULT_STATUS_FILTER.join(',')

  return { filters, update, clear, isFiltered, orderings: ORDERINGS }
}
