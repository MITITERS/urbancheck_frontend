import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { reportKeys } from '@/lib/queryKeys'
import type { Paginated } from '@/types/api'
import type { PanelReportRow } from '@/features/reports/types'

/**
 * Lo que un validador decidió en terreno, **dentro de la jurisdicción de quien
 * mira**.
 *
 * Va por el endpoint del panel y no por otro propio: así el filtro se aplica
 * sobre el queryset que ya acotó la jurisdicción, y el perfil no puede
 * convertirse en una puerta lateral a los reportes de otro municipio. Es el
 * mismo camino que usa el perfil del vecino con `author`.
 *
 * Cada fila trae qué se decidió: el estado del reporte no alcanza, porque uno
 * validado y cancelado después por el municipio figura igual que uno rechazado.
 */
export function useValidatorDecisions(id: number | null) {
  return useQuery({
    queryKey: reportKeys.list({ validatedBy: id ?? 0 }),
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<PanelReportRow>>(
        endpoints.panelReports.list,
        { params: { validated_by: id } },
      )
      return data
    },
    enabled: id !== null,
  })
}
