import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'

export interface Province {
  id: string
  name: string
}

/** Una localidad con su centroide oficial. */
export interface Locality {
  id: string
  name: string
  latitude: number
  longitude: number
}

/** La división política no cambia: se cachea por lo que dure la sesión. */
const CATALOG_STALE_TIME_MS = Number.POSITIVE_INFINITY

export function useProvinces() {
  return useQuery({
    queryKey: ['geo', 'provinces'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ results: Province[] }>(
        endpoints.geo.provinces,
      )
      return data.results
    },
    staleTime: CATALOG_STALE_TIME_MS,
  })
}

/**
 * Localidades de una provincia.
 *
 * Se traen todas de una —ninguna provincia pasa de unas pocas centenas— y el
 * filtrado por texto ocurre en el cliente. Es lo que hace que la lista responda
 * al instante en vez de disparar una request por tecla.
 */
export function useLocalities(provinceId: string | null) {
  return useQuery({
    queryKey: ['geo', 'localities', provinceId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ results: Locality[] }>(
        endpoints.geo.localities(provinceId as string),
      )
      return data.results
    },
    enabled: provinceId !== null && provinceId !== '',
    staleTime: CATALOG_STALE_TIME_MS,
  })
}
