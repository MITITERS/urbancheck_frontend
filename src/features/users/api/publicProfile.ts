import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { reportKeys, userKeys } from '@/lib/queryKeys'
import type { Paginated } from '@/types/api'
import type { PanelReportRow } from '@/features/reports/types'

/**
 * Perfil público de un vecino (US-027).
 *
 * `date_joined` y `report_count` vienen **nulos** cuando la persona tiene el
 * perfil en privado. Es el servidor el que decide qué se muestra; la pantalla
 * mira `is_public` en lugar de inferirlo de la ausencia de los campos.
 */
export interface PublicProfile {
  id: number
  name: string
  avatar: string | null
  is_public: boolean
  date_joined: string | null
  report_count: number | null
}

export function usePublicProfile(id: number | null) {
  return useQuery({
    queryKey: userKeys.detail(id ?? 0),
    queryFn: async () => {
      const { data } = await apiClient.get<PublicProfile>(
        endpoints.users.detail(id as number),
      )
      return data
    },
    enabled: id !== null,
  })
}

/**
 * Lo que esa persona reportó, **dentro de la jurisdicción de quien mira**.
 *
 * Va por el endpoint del panel y no por el feed ciudadano: así el filtro se
 * aplica sobre el queryset que ya acotó la jurisdicción, y el perfil no puede
 * convertirse en una puerta lateral a los reportes de otro municipio.
 */
export function useReportsByAuthor(id: number | null) {
  return useQuery({
    queryKey: reportKeys.list({ author: id ?? 0 }),
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<PanelReportRow>>(
        endpoints.panelReports.list,
        { params: { author: id } },
      )
      return data
    },
    enabled: id !== null,
  })
}
