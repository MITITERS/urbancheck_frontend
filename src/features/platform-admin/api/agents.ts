import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { userKeys } from '@/lib/queryKeys'
import type { Paginated } from '@/types/api'
import type { AccountState } from '@/types/auth'
import type { MunicipalAgent, MunicipalAgentPayload } from '../types'

/**
 * Filtro del listado: `state` separa habilitados de archivados y
 * `municipalityId` mira un municipio a la vez.
 */
export type AgentFilter = { municipalityId?: number; state: AccountState }

/** Query key for the municipal-agent listing, under the shared users domain. */
const agentKeys = {
  all: [...userKeys.all, 'agents'] as const,
  list: (filter: AgentFilter) =>
    [
      ...userKeys.all,
      'agents',
      'list',
      filter.municipalityId ?? 'all',
      filter.state,
    ] as const,
}

async function fetchAgents(filter: AgentFilter): Promise<MunicipalAgent[]> {
  const { data } = await apiClient.get<Paginated<MunicipalAgent>>(
    endpoints.municipalAgents.list,
    // Los dos filtros se resuelven en el servidor: una cuenta archivada no
    // tiene que viajar en la respuesta del listado principal, ni ocupar su
    // paginado.
    {
      params: {
        state: filter.state,
        ...(filter.municipalityId ? { municipality: filter.municipalityId } : {}),
      },
    },
  )
  return data.results
}

export function useMunicipalAgents(filter: AgentFilter) {
  return useQuery({
    queryKey: agentKeys.list(filter),
    queryFn: () => fetchAgents(filter),
  })
}

export function useCreateMunicipalAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: MunicipalAgentPayload) => {
      const { data } = await apiClient.post<MunicipalAgent>(
        endpoints.municipalAgents.list,
        {
          name: payload.name,
          email: payload.email,
          temporary_password: payload.temporaryPassword,
          municipality_id: payload.municipalityId,
        },
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agentKeys.all })
    },
  })
}

export function useSetAgentActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const url = active
        ? endpoints.municipalAgents.activate(id)
        : endpoints.municipalAgents.deactivate(id)
      const { data } = await apiClient.post<MunicipalAgent>(url)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agentKeys.all })
    },
  })
}

export { agentKeys }
