import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { DEFAULT_PAGE_SIZE, POLLING_INTERVAL_MS } from '@/config/constants'
import { reportKeys } from '@/lib/queryKeys'
import type { Paginated } from '@/types/api'
import type { PanelReportRow, ReportFilters } from '../types'

/** Turns the UI filters into the query params the API expects. */
export function toQueryParams(filters: ReportFilters): Record<string, string> {
  const params: Record<string, string> = {
    page: String(filters.page),
    page_size: String(filters.pageSize),
    ordering: filters.ordering,
  }
  if (filters.statuses.length > 0) params.status = filters.statuses.join(',')
  if (filters.categories.length > 0) params.category = filters.categories.join(',')
  if (filters.zone) params.zone = filters.zone
  if (filters.createdFrom) params.created_from = filters.createdFrom
  if (filters.createdTo) params.created_to = filters.createdTo
  if (filters.closureReview) params.closure_review = 'true'
  return params
}

/**
 * El listado del panel, con sus filtros.
 *
 * `municipalityId` lo manda **solo el administrador de la plataforma**, que ve
 * todas las jurisdicciones y mira los reportes municipio por municipio. No es
 * un agujero: el backend aplica ese filtro sobre el queryset que la capa de
 * jurisdicción ya acotó, así que a un agente solo podría achicarle la lista,
 * nunca mostrarle otra.
 */
export function useReports(filters: ReportFilters, municipalityId?: number) {
  const params = {
    ...toQueryParams(filters),
    ...(municipalityId === undefined ? {} : { municipality: String(municipalityId) }),
  }

  return useQuery({
    // The filters are part of the key, so each combination caches separately
    // and `invalidateQueries(['reportes'])` still refreshes all of them.
    queryKey: reportKeys.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<PanelReportRow>>(
        endpoints.panelReports.list,
        { params },
      )
      return data
    },
    // US-012, escenario 6: los reportes nuevos aparecen sin recargar.
    refetchInterval: POLLING_INTERVAL_MS,
    // Keeps the previous page on screen while the next one loads: no flicker,
    // no scroll jump, no filters resetting under the agent's hands.
    placeholderData: keepPreviousData,
  })
}

export const PAGE_SIZE = DEFAULT_PAGE_SIZE
