import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { domainKeys, reportKeys } from '@/lib/queryKeys'
import type { Paginated } from '@/types/api'
import type {
  ContentReason,
  ModerationAppeal,
  ModerationAppealState,
  ModerationDecisionKind,
  ModerationInboxEntry,
  ResolvedModeration,
} from '../types'

export const moderationKeys = domainKeys('denuncias')
export const moderationAppealKeys = domainKeys('apelaciones-moderacion')

/**
 * Cada cuánto se vuelve a pedir la bandeja y su contador. Las denuncias entran
 * solas desde la app y nada le avisa al agente: un minuto alcanza para que el
 * número del menú no quede viejo sin cargar al servidor de más.
 */
const REFRESH_MS = 60_000

/** Tope del servidor: la bandeja entera en una página mientras quepa. */
const PAGE_SIZE = 100

/** Para el admin, la municipalidad elegida en el header; el agente no manda nada. */
function scoped(municipalityId?: number) {
  return municipalityId === undefined ? {} : { municipality: municipalityId }
}

/**
 * La bandeja por contenido. Con `reason`, solo los reportes con denuncias
 * pendientes de ese motivo, y el contador de cada uno cuenta solo esas.
 */
export function useModerationInbox(
  municipalityId?: number,
  reason?: ContentReason,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const params = { ...scoped(municipalityId), ...(reason ? { reason } : {}) }
  return useQuery({
    queryKey: moderationKeys.list(params),
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<ModerationInboxEntry>>(
        endpoints.moderation.list,
        { params: { page_size: PAGE_SIZE, ...params } },
      )
      return data.results
    },
    refetchInterval: REFRESH_MS,
  })
}

/**
 * Lo ya resuelto por contenido, la decisión más reciente primero. La clave
 * cuelga de `moderationKeys.all`: decidir la invalida junto con la bandeja.
 */
export function useResolvedModeration(
  municipalityId?: number,
  reason?: ContentReason,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const params = { ...scoped(municipalityId), ...(reason ? { reason } : {}) }
  return useQuery({
    queryKey: [...moderationKeys.all, 'resueltas', params] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<ResolvedModeration>>(
        endpoints.moderation.resolved,
        { params: { page_size: PAGE_SIZE, ...params } },
      )
      return data.results
    },
    enabled,
    refetchInterval: REFRESH_MS,
  })
}

/** Cuántos reportes esperan decisión: el contador de la navegación. */
export function useModerationCount({
  enabled,
  municipalityId,
}: {
  enabled: boolean
  municipalityId?: number
}) {
  return useQuery({
    queryKey: [...moderationKeys.all, 'count', scoped(municipalityId)] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<{ pending: number }>(
        endpoints.moderation.count,
        { params: scoped(municipalityId) },
      )
      return data.pending
    },
    enabled,
    refetchInterval: REFRESH_MS,
  })
}

/** Descartar el reporte o desestimar sus denuncias: las dos cierran todas. */
export function useModerationDecision() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      reportId,
      decision,
      reason,
    }: {
      reportId: number
      decision: ModerationDecisionKind
      reason: string
    }) => {
      const url =
        decision === 'discard'
          ? endpoints.moderation.discard(reportId)
          : endpoints.moderation.dismiss(reportId)
      await apiClient.post(url, { reason })
    },
    onSettled: () => {
      // También en error: un 409 significa que otra pestaña decidió antes, y
      // la entrada tiene que desaparecer de la bandeja igual.
      void queryClient.invalidateQueries({ queryKey: moderationKeys.all })
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}

export function useModerationAppeals(
  state: ModerationAppealState,
  municipalityId?: number,
) {
  return useQuery({
    queryKey: moderationAppealKeys.list({ state, ...scoped(municipalityId) }),
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<ModerationAppeal>>(
        endpoints.moderationAppeals.list,
        { params: { state, page_size: PAGE_SIZE, ...scoped(municipalityId) } },
      )
      return data.results
    },
    refetchInterval: REFRESH_MS,
  })
}

export function useResolveModerationAppeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      accept,
      reason,
    }: {
      id: number
      accept: boolean
      reason: string
    }) => {
      const url = accept
        ? endpoints.moderationAppeals.accept(id)
        : endpoints.moderationAppeals.reject(id)
      await apiClient.post(url, { reason })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: moderationAppealKeys.all })
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}

/** La reversión de oficio del administrador (US-049, escenario 8). */
export function useRevertModeration(reportId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reason: string) => {
      await apiClient.post(endpoints.moderationAppeals.revert(reportId), { reason })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: moderationAppealKeys.all })
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}
