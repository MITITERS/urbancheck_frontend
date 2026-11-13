import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { domainKeys } from '@/lib/queryKeys'
import type { PeriodSelection, Statistics } from '../types'

export const statisticsKeys = domainKeys('estadisticas')

/**
 * Las estadísticas de la sección (US-023 y US-050), en un solo pedido.
 *
 * El agente no manda municipio: el servidor lo acota a su jurisdicción. El
 * admin las pide desde la ficha de una municipalidad, por su propio endpoint.
 */
export function useStatistics(selection: PeriodSelection, municipalityId?: number) {
  return useQuery({
    queryKey: statisticsKeys.list({ ...selection, municipalityId }),
    queryFn: async () => {
      const url =
        municipalityId === undefined
          ? endpoints.statistics.panel
          : endpoints.municipalities.statistics(municipalityId)
      const { data } = await apiClient.get<Statistics>(url, {
        params:
          selection.period === 'custom' ? selection : { period: selection.period },
      })
      return data
    },
    // Cambiar de período no deja la pantalla en blanco mientras llega el nuevo.
    placeholderData: keepPreviousData,
  })
}
