import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { AccountState } from '@/types/auth'
import type { OperationalArea, OperationalAreaPayload } from '../types'

/**
 * Filtro del listado. `state` separa activas de desactivadas; sin él vienen las
 * dos, que es lo que muestra la pantalla de gestión. `municipalityId` solo lo
 * usa el admin: el agente ya viene acotado por su jurisdicción.
 */
export interface AreaFilter {
  state?: AccountState
  municipalityId?: number
}

export const areaKeys = {
  all: ['areas'] as const,
  list: (filter: AreaFilter = {}) =>
    ['areas', 'list', filter.state ?? 'all', filter.municipalityId ?? 'all'] as const,
  detail: (id: number) => ['areas', 'detail', id] as const,
}

async function fetchAreas(filter: AreaFilter): Promise<OperationalArea[]> {
  // El endpoint no pagina: una municipalidad tiene un puñado de dependencias y
  // el desplegable de asignación de US-028 las necesita todas de una.
  const { data } = await apiClient.get<OperationalArea[]>(
    endpoints.operationalAreas.list,
    {
      params: {
        ...(filter.state ? { state: filter.state } : {}),
        ...(filter.municipalityId ? { municipality: filter.municipalityId } : {}),
      },
    },
  )
  return data
}

export function useAreas(filter: AreaFilter = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: areaKeys.list(filter),
    queryFn: () => fetchAreas(filter),
    ...options,
  })
}

/** Las que el selector de asignación puede ofrecer (US-028, escenario 3). */
export function useActiveAreas(options: { enabled?: boolean } = {}) {
  return useAreas({ state: 'active' }, options)
}

export function useArea(id: number) {
  return useQuery({
    queryKey: areaKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<OperationalArea>(
        endpoints.operationalAreas.detail(id),
      )
      return data
    },
  })
}

function toBody(payload: OperationalAreaPayload) {
  return {
    name: payload.name,
    contact_email: payload.contactEmail,
    contact_phone: payload.contactPhone,
    // Solo viaja para el admin: para el agente el backend usa su propia
    // municipalidad e ignora lo que venga en el body.
    ...(payload.municipalityId ? { municipality_id: payload.municipalityId } : {}),
  }
}

export function useCreateArea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: OperationalAreaPayload) => {
      const { data } = await apiClient.post<OperationalArea>(
        endpoints.operationalAreas.list,
        toBody(payload),
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: areaKeys.all })
    },
  })
}

export function useUpdateArea(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: OperationalAreaPayload) => {
      const { data } = await apiClient.patch<OperationalArea>(
        endpoints.operationalAreas.detail(id),
        toBody(payload),
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: areaKeys.all })
    },
  })
}

export function useSetAreaActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const url = active
        ? endpoints.operationalAreas.activate(id)
        : endpoints.operationalAreas.deactivate(id)
      const { data } = await apiClient.post<OperationalArea>(url)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: areaKeys.all })
    },
  })
}
