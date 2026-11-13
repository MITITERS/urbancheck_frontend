import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PAGE_SIZE } from '@/config/constants'
import { toQueryParams } from '../api/reports'
import { DEFAULT_STATUS_FILTER, REPORT_STATUSES } from '../types'
import { useReportFilters } from './useReportFilters'

function wrapperFor(initialPath: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
  }
}

function renderFilters(initialPath = '/reportes') {
  return renderHook(() => ({ ...useReportFilters(), location: useLocation() }), {
    wrapper: wrapperFor(initialPath),
  })
}

describe('useReportFilters', () => {
  it('defaults to the three statuses that still need attention', () => {
    const { result } = renderFilters()

    expect(result.current.filters.statuses).toEqual([...DEFAULT_STATUS_FILTER])
    expect(result.current.isFiltered).toBe(false)
  })

  it('reads the filters from the query string', () => {
    const { result } = renderFilters(
      '/reportes?status=resuelto&category=bache,basura&zone=centro&ordering=-like_count&page=3',
    )

    expect(result.current.filters).toMatchObject({
      statuses: [REPORT_STATUSES.RESOLVED],
      categories: ['bache', 'basura'],
      zone: 'centro',
      ordering: '-like_count',
      page: 3,
    })
  })

  it('keeps the closures-to-review filter in the URL (US-015)', () => {
    const { result } = renderFilters()

    act(() => result.current.update({ closureReview: true }))

    expect(result.current.location.search).toContain('closure_review=true')
    expect(result.current.filters.closureReview).toBe(true)
    expect(result.current.isFiltered).toBe(true)
    expect(toQueryParams(result.current.filters).closure_review).toBe('true')

    act(() => result.current.update({ closureReview: false }))

    expect(result.current.location.search).not.toContain('closure_review')
    expect(toQueryParams(result.current.filters)).not.toHaveProperty('closure_review')
  })

  it('writes a filter change back into the URL', () => {
    const { result } = renderFilters()

    act(() => result.current.update({ zone: 'rivadavia' }))

    expect(result.current.location.search).toContain('zone=rivadavia')
    expect(result.current.filters.zone).toBe('rivadavia')
  })

  it('goes back to the first page whenever a filter changes', () => {
    const { result } = renderFilters('/reportes?page=4')

    act(() => result.current.update({ categories: ['bache'] }))

    expect(result.current.filters.page).toBe(1)
    expect(result.current.location.search).not.toContain('page=')
  })

  it('keeps the page when only the page changes', () => {
    const { result } = renderFilters()

    act(() => result.current.update({ page: 2 }))

    expect(result.current.filters.page).toBe(2)
  })

  it('ignores unknown values in the query string', () => {
    const { result } = renderFilters('/reportes?status=inventado&ordering=raro')

    expect(result.current.filters.statuses).toEqual([])
    expect(result.current.filters.ordering).toBe('-created_at')
  })

  it('tells an explicitly emptied status filter from an untouched one', () => {
    const untouched = renderFilters('/reportes')
    const emptied = renderFilters('/reportes?status=')

    expect(untouched.result.current.filters.statuses).toEqual([
      ...DEFAULT_STATUS_FILTER,
    ])
    expect(emptied.result.current.filters.statuses).toEqual([])
  })

  it('clears every filter back to the defaults', () => {
    const { result } = renderFilters('/reportes?zone=centro&category=bache&page=2')

    act(() => result.current.clear())

    expect(result.current.location.search).toBe('')
    expect(result.current.filters.statuses).toEqual([...DEFAULT_STATUS_FILTER])
    expect(result.current.isFiltered).toBe(false)
  })

  it('defaults to the page size the API uses', () => {
    const { result } = renderFilters()

    expect(result.current.filters.pageSize).toBe(DEFAULT_PAGE_SIZE)
  })

  it('reads the page size from the query string', () => {
    const { result } = renderFilters('/reportes?page_size=50')

    expect(result.current.filters.pageSize).toBe(50)
  })

  it('only accepts a size the panel actually offers', () => {
    // Llega de la URL, así que puede ser cualquier cosa: un valor fuera de la
    // lista pediría al backend algo que va a recortar de todos modos.
    const { result } = renderFilters('/reportes?page_size=7')

    expect(result.current.filters.pageSize).toBe(DEFAULT_PAGE_SIZE)
  })

  it('keeps the default out of the URL', () => {
    const { result } = renderFilters('/reportes?page_size=50')

    act(() => result.current.update({ pageSize: DEFAULT_PAGE_SIZE }))

    expect(result.current.location.search).not.toContain('page_size')
  })

  it('changing the page size goes back to the first page', () => {
    // Estar en la página 7 de un recorte que ya no existe es un callejón.
    const { result } = renderFilters('/reportes?page=7')

    act(() => result.current.update({ pageSize: 50 }))

    expect(result.current.filters.page).toBe(1)
    expect(result.current.location.search).toContain('page_size=50')
  })
})
