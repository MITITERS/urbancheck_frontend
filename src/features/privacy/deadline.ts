import { useEffect, useState } from 'react'

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS

/**
 * Cuánto falta para `deadline`, o cuánto hace que venció, en palabras.
 *
 * Horas y minutos y nada más: con un plazo de 24 horas, los segundos son ruido
 * y un contador que cambia cada segundo en cada fila distrae más de lo que
 * informa.
 */
export function describeRemaining(deadline: string, now: number): string {
  const remaining = Date.parse(deadline) - now
  const span = Math.abs(remaining)
  const hours = Math.floor(span / HOUR_MS)
  const minutes = Math.floor((span % HOUR_MS) / MINUTE_MS)
  const amount =
    hours > 0 ? `${hours} h ${minutes} min` : minutes > 0 ? `${minutes} min` : null

  if (remaining >= 0) {
    return amount ? `Quedan ${amount}` : 'Vence en menos de 1 min'
  }
  return amount ? `Vencida hace ${amount}` : 'Recién vencida'
}

export function isOverdue(deadline: string, now: number): boolean {
  return Date.parse(deadline) < now
}

/**
 * La hora actual, refrescada cada `intervalMs`.
 *
 * El contador se calcula contra el reloj del navegador y no contra el
 * `remaining_seconds` de la respuesta: así una fila pasa a «vencida» mientras
 * el admin la está mirando, sin esperar al próximo pedido.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
