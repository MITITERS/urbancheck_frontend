import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { userKeys } from '@/lib/queryKeys'
import type { Paginated } from '@/types/api'
import type { AccountState } from '@/types/auth'
import type { Validator, ValidatorPayload } from '../types'

/**
 * Filtro del listado. `municipalityId` solo lo usa el admin —el agente ya viene
 * acotado por su jurisdicción—; `state` separa habilitados de archivados.
 */
export type ValidatorFilter = { municipalityId?: number; state: AccountState }

const validatorKeys = {
  all: [...userKeys.all, 'validators'] as const,
  list: (filter: ValidatorFilter) =>
    [
      ...userKeys.all,
      'validators',
      'list',
      filter.municipalityId ?? 'all',
      filter.state,
    ] as const,
}

async function fetchValidators(filter: ValidatorFilter): Promise<Validator[]> {
  const { data } = await apiClient.get<Paginated<Validator>>(
    endpoints.validators.list,
    // El backend ignora el filtro de municipalidad para el agente, que solo ve
    // su jurisdicción. El de estado vale para los dos roles.
    {
      params: {
        state: filter.state,
        ...(filter.municipalityId ? { municipality: filter.municipalityId } : {}),
      },
    },
  )
  return data.results
}

export function useValidators(filter: ValidatorFilter) {
  return useQuery({
    queryKey: validatorKeys.list(filter),
    queryFn: () => fetchValidators(filter),
  })
}

export function useCreateValidator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ValidatorPayload) => {
      // `municipality_id` solo viaja para el admin: para el agente el backend
      // usa su propia municipalidad e ignora lo que venga en el body.
      const { data } = await apiClient.post<Validator>(endpoints.validators.list, {
        name: payload.name,
        email: payload.email,
        temporary_password: payload.temporaryPassword,
        ...(payload.municipalityId ? { municipality_id: payload.municipalityId } : {}),
      })
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: validatorKeys.all })
    },
  })
}

export function useSetValidatorActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const url = active
        ? endpoints.validators.activate(id)
        : endpoints.validators.deactivate(id)
      const { data } = await apiClient.post<Validator>(url)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: validatorKeys.all })
    },
  })
}

export { validatorKeys }
