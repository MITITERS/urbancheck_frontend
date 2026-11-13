import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { messages } from '@/config/messages'
import { parseDateOnly, toDateOnly } from '@/lib/format'
import {
  DEFAULT_PERIOD,
  PERIOD_KEYS,
  type PeriodKey,
  type PeriodSelection,
} from '../types'

const t = messages.statistics

/**
 * Por qué un rango personalizado no se puede aplicar, o `null` si se puede.
 *
 * Es la misma regla que valida el servidor (US-023, escenario 6); se evalúa
 * también acá para conservar el período anterior sin un viaje de ida y vuelta.
 */
export function rangeError(
  start: string,
  end: string,
  today = new Date(),
): string | null {
  const from = parseDateOnly(start)
  const to = parseDateOnly(end)
  if (!from || !to) return t.rangeIncomplete
  if (from > to) return t.rangeInverted
  if (toDateOnly(to) > toDateOnly(today)) return t.rangeFuture
  return null
}

function parsePeriod(raw: string | null): PeriodKey {
  return (PERIOD_KEYS as readonly string[]).includes(raw ?? '')
    ? (raw as PeriodKey)
    : DEFAULT_PERIOD
}

/**
 * El período de la sección vive en la query string, con el mismo criterio que
 * los filtros del listado (US-012): recargar o copiar la URL conserva la vista
 * (escenario 11).
 *
 * Un rango personalizado inválido en la URL —escrito a mano— se ignora y se cae
 * al período por defecto: nunca se muestra un número sin una ventana válida.
 */
export function useStatisticsPeriod() {
  const [searchParams, setSearchParams] = useSearchParams()

  const selection = useMemo<PeriodSelection>(() => {
    const period = parsePeriod(searchParams.get('period'))
    if (period !== 'custom') return { period }
    const start = searchParams.get('start') ?? ''
    const end = searchParams.get('end') ?? ''
    return rangeError(start, end) === null
      ? { period, start, end }
      : { period: DEFAULT_PERIOD }
  }, [searchParams])

  /**
   * Aplica un período. Devuelve el motivo si es un rango inválido, y en ese
   * caso **no** toca la URL: queda aplicado el período anterior.
   */
  const apply = useCallback(
    (next: PeriodSelection): string | null => {
      if (next.period === 'custom') {
        const error = rangeError(next.start ?? '', next.end ?? '')
        if (error) return error
      }
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current)
          params.set('period', next.period)
          if (next.period === 'custom') {
            params.set('start', next.start ?? '')
            params.set('end', next.end ?? '')
          } else {
            params.delete('start')
            params.delete('end')
          }
          return params
        },
        { replace: true },
      )
      return null
    },
    [setSearchParams],
  )

  return { selection, apply }
}
