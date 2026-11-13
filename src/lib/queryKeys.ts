/**
 * Query key convention
 * --------------------
 * Every key is an array that goes from the most general to the most specific:
 *
 *   [domain]                        -> everything about a domain
 *   [domain, 'list']                -> every list of that domain
 *   [domain, 'list', filters]       -> one concrete list
 *   [domain, 'detail']              -> every detail of that domain
 *   [domain, 'detail', id]          -> one concrete detail
 *
 * Because TanStack Query matches by prefix, this shape is what makes
 * `invalidateQueries({ queryKey: reportKeys.lists() })` refresh every filtered
 * list at once after a mutation, without knowing which filters are active.
 *
 * Rules:
 * - Never build a key inline in a component: add a factory here (or in the
 *   feature's own `api/` folder, following the same shape).
 * - The filters object goes last and must be serializable.
 * - Never put the municipality in a key: the API already scopes by jurisdiction.
 */

type Filters = Record<string, unknown>

function domainKeys<const D extends string>(domain: D) {
  return {
    all: [domain] as const,
    lists: () => [domain, 'list'] as const,
    list: (filters: Filters = {}) => [domain, 'list', filters] as const,
    details: () => [domain, 'detail'] as const,
    detail: (id: number | string) => [domain, 'detail', id] as const,
  }
}

export const authKeys = {
  all: ['auth'] as const,
  session: () => ['auth', 'session'] as const,
}

export const reportKeys = domainKeys('reportes')
export const userKeys = domainKeys('usuarios')
export const notificationKeys = domainKeys('notificaciones')
export const municipalityKeys = domainKeys('municipalidades')

export { domainKeys }
