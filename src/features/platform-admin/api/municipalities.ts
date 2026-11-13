import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { areaKeys } from '@/features/areas/api/areas'
import { municipalityKeys, userKeys } from '@/lib/queryKeys'
import type { Paginated } from '@/types/api'
import type { MunicipalityDetail, MunicipalityPayload } from '../types'

/** UI payload -> API body. The API speaks snake_case. */
function toApiBody(payload: Partial<MunicipalityPayload>) {
  return {
    ...(payload.city !== undefined && { city: payload.city }),
    ...(payload.province !== undefined && { province: payload.province }),
    ...(payload.latitude !== undefined && { latitude: payload.latitude }),
    ...(payload.longitude !== undefined && { longitude: payload.longitude }),
    ...(payload.boundary !== undefined && { boundary: payload.boundary }),
  }
}

async function fetchMunicipalities(): Promise<MunicipalityDetail[]> {
  const { data } = await apiClient.get<Paginated<MunicipalityDetail>>(
    endpoints.municipalities.list,
  )
  return data.results
}

/**
 * `enabled` existe para la pantalla de validadores, que la comparten los dos
 * roles: el agente no elige municipalidad, así que no tiene por qué pedir la
 * lista —y además la API se la respondería con 403.
 */
export function useMunicipalities({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: municipalityKeys.list(),
    queryFn: fetchMunicipalities,
    enabled,
  })
}

export function useCreateMunicipality() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: MunicipalityPayload) => {
      const { data } = await apiClient.post<MunicipalityDetail>(
        endpoints.municipalities.list,
        toApiBody(payload),
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: municipalityKeys.all })
    },
  })
}

export function useUpdateMunicipality(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<MunicipalityPayload>) => {
      const { data } = await apiClient.patch<MunicipalityDetail>(
        endpoints.municipalities.detail(id),
        toApiBody(payload),
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: municipalityKeys.all })
    },
  })
}

export function useDeleteMunicipality() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      // Baja lógica del lado del servidor: el municipio deja de recibir
      // reportes y de listarse, pero su historia queda.
      const { data } = await apiClient.delete<{
        deactivated_users: number
        deactivated_areas: number
      }>(endpoints.municipalities.detail(id))
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: municipalityKeys.all })
      // La baja arrastra a los agentes y validadores del municipio: sin esto,
      // sus tablas seguirían mostrándolos habilitados hasta recargar.
      void queryClient.invalidateQueries({ queryKey: userKeys.all })
      // Y a sus áreas operativas, por lo mismo: el desplegable de asignación
      // de US-028 las seguiría ofreciendo hasta que venciera la caché.
      void queryClient.invalidateQueries({ queryKey: areaKeys.all })
    },
  })
}
