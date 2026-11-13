import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { domainKeys, reportKeys } from '@/lib/queryKeys'
import type { Paginated } from '@/types/api'
import type { PrivacyRequest, PrivacyRequestState } from '../types'

export const privacyRequestKeys = domainKeys('solicitudes-privacidad')

/**
 * Cada cuánto se vuelve a pedir la bandeja. Las solicitudes entran solas —nada
 * avisa al admin— y el plazo es de horas: un minuto alcanza para que una nueva
 * no quede esperando a que alguien recargue la pantalla.
 */
const REFRESH_MS = 60_000

/** Tope del servidor: la bandeja entera en una página mientras quepa. */
const PAGE_SIZE = 100

async function fetchPrivacyRequests(
  state: PrivacyRequestState,
  municipalityId?: number,
): Promise<PrivacyRequest[]> {
  const { data } = await apiClient.get<Paginated<PrivacyRequest>>(
    endpoints.privacyRequests.list,
    // El orden lo decide el servidor: las pendientes de la más vieja a la más
    // nueva —con un plazo único, eso pone primero las vencidas— y las
    // resueltas de la decisión más reciente a la más vieja.
    {
      params: {
        state,
        page_size: PAGE_SIZE,
        // La municipalidad elegida en el header.
        ...(municipalityId === undefined ? {} : { municipality: municipalityId }),
      },
    },
  )
  return data.results
}

export function usePrivacyRequests(
  state: PrivacyRequestState,
  municipalityId?: number,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: privacyRequestKeys.list({ state, municipality: municipalityId }),
    queryFn: () => fetchPrivacyRequests(state, municipalityId),
    enabled,
    refetchInterval: REFRESH_MS,
  })
}

export type PrivacyDecision = 'remove-image' | 'dismiss'

/** Eliminar la imagen o desestimar: las dos cierran la solicitud. */
export function useResolvePrivacyRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, decision }: { id: number; decision: PrivacyDecision }) => {
      const url =
        decision === 'remove-image'
          ? endpoints.privacyRequests.removeImage(id)
          : endpoints.privacyRequests.dismiss(id)
      const { data } = await apiClient.post<PrivacyRequest>(url)
      return data
    },
    onSettled: () => {
      // También en error: un 409 significa que otro admin decidió antes, y la
      // fila tiene que desaparecer de la bandeja de todos modos.
      void queryClient.invalidateQueries({ queryKey: privacyRequestKeys.all })
      // El detalle del reporte cambia: la marca de revisión y, si se eliminó,
      // la foto.
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}
