import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { Paginated } from '@/types/api'
import type { AccountState } from '@/types/auth'
import type { Operator, OperatorPayload, OperatorUpdatePayload } from '../types'

/** Los operarios se miran siempre dentro de su área (US-044). */
export interface OperatorFilter {
  areaId: number
  state: AccountState
}

export const operatorKeys = {
  all: ['operarios'] as const,
  list: (filter: OperatorFilter) =>
    ['operarios', 'list', filter.areaId, filter.state] as const,
}

export function useOperators(filter: OperatorFilter) {
  return useQuery({
    queryKey: operatorKeys.list(filter),
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Operator>>(
        endpoints.operators.list,
        { params: { operational_area: filter.areaId, state: filter.state } },
      )
      return data.results
    },
  })
}

export function useCreateOperator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: OperatorPayload) => {
      const { data } = await apiClient.post<Operator>(endpoints.operators.list, {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        temporary_password: payload.temporaryPassword,
        operational_area_id: payload.areaId,
      })
      return data
    },
    onSuccess: invalidator(queryClient),
  })
}

export function useUpdateOperator(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: OperatorUpdatePayload) => {
      const { data } = await apiClient.patch<Operator>(endpoints.operators.detail(id), {
        ...(payload.name === undefined ? {} : { name: payload.name }),
        ...(payload.phone === undefined ? {} : { phone: payload.phone }),
        ...(payload.areaId === undefined
          ? {}
          : { operational_area_id: payload.areaId }),
      })
      return data
    },
    onSuccess: invalidator(queryClient),
  })
}

export function useSetOperatorActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const url = active
        ? endpoints.operators.activate(id)
        : endpoints.operators.deactivate(id)
      const { data } = await apiClient.post<Operator>(url)
      return data
    },
    onSuccess: invalidator(queryClient),
  })
}

/**
 * Toda mutación de operarios invalida también las áreas: el listado de áreas
 * muestra cuántos operarios tiene cada una, así que un alta o una baja lo
 * dejan desactualizado.
 */
function invalidator(queryClient: ReturnType<typeof useQueryClient>) {
  return () => {
    void queryClient.invalidateQueries({ queryKey: operatorKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['areas'] })
  }
}
