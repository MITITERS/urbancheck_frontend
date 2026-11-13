import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { reportKeys } from '@/lib/queryKeys'
import type { Paginated } from '@/types/api'
import type { PanelReportRow } from '@/features/reports/types'

/**
 * Lo que un operario cerró en terreno, **dentro de la jurisdicción de quien
 * mira** (US-046).
 *
 * Va por el endpoint del panel y no por uno propio, igual que el perfil del
 * vecino con `author` y el del validador con `validated_by`: así el filtro se
 * aplica sobre el queryset que ya acotó la jurisdicción, y el perfil no puede
 * convertirse en una puerta lateral a los reportes de otro municipio.
 *
 * Cada fila trae `closure.closed_at`, que es cuándo cerró **esta persona**. No
 * se deduce del estado ni de la fecha del reporte: después de una apelación el
 * cierre vigente puede ser de otro operario del área.
 */
export function useOperatorClosures(id: number | null) {
  return useQuery({
    queryKey: reportKeys.list({ closedBy: id ?? 0 }),
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<PanelReportRow>>(
        endpoints.panelReports.list,
        { params: { closed_by: id } },
      )
      return data
    },
    enabled: id !== null,
  })
}
