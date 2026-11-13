import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { domainKeys } from '@/lib/queryKeys'
import type { ReportCategory, ReportStatus } from '@/features/reports/types'

export const publicReportKeys = domainKeys('reporte-publico')

/**
 * El reporte tal como lo ve cualquiera que abre el enlace (US-030). Sin `id`,
 * que es correlativo, y con las coordenadas redondeadas a unos 100 m (N-06).
 */
export interface PublicReport {
  number: number | null
  category: ReportCategory
  category_label: string
  status: ReportStatus
  status_label: string
  description: string
  photo: string | null
  address: string
  latitude: string | null
  longitude: string | null
  created_at: string
  municipality: { city: string; province: string }
  like_count: number
  timeline: { status: ReportStatus; status_label: string; created_at: string }[]
  official_responses: { text: string; created_at: string }[]
  share_url: string
}

/** Lo que vuelve cuando el reporte ya no se puede ver (US-030, escenario 3). */
export interface UnavailableReport {
  code: 'report_unavailable'
  detail: string
  /** Solo si se descartó por moderación: el motivo es público (US-049). */
  moderation: { reason: string; decided_at: string } | null
}

export type PublicReportResult =
  | { available: true; report: PublicReport }
  | { available: false; notice: UnavailableReport }

/**
 * El reporte compartido. El `404` no es un error de la pantalla sino uno de sus
 * dos resultados posibles, así que se recibe como respuesta y no como excepción.
 */
export function usePublicReport(token: string) {
  return useQuery({
    queryKey: publicReportKeys.detail(token),
    queryFn: async (): Promise<PublicReportResult> => {
      const response = await apiClient.get<PublicReport | UnavailableReport>(
        endpoints.publicReports.detail(token),
        { validateStatus: (status) => status === 200 || status === 404 },
      )
      return response.status === 200
        ? { available: true, report: response.data as PublicReport }
        : { available: false, notice: response.data as UnavailableReport }
    },
    retry: false,
  })
}
