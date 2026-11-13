import { describe, expect, it } from 'vitest'
import { describeRemaining, isOverdue } from './deadline'

const DEADLINE = '2026-09-22T12:00:00Z'
const at = (iso: string) => Date.parse(iso)

describe('describeRemaining', () => {
  it('dice horas y minutos mientras queda más de una hora', () => {
    expect(describeRemaining(DEADLINE, at('2026-09-22T06:48:00Z'))).toBe(
      'Quedan 5 h 12 min',
    )
  })

  it('dice solo minutos en la última hora', () => {
    expect(describeRemaining(DEADLINE, at('2026-09-22T11:48:00Z'))).toBe(
      'Quedan 12 min',
    )
  })

  it('no dice «0 min» en el último minuto', () => {
    expect(describeRemaining(DEADLINE, at('2026-09-22T11:59:30Z'))).toBe(
      'Vence en menos de 1 min',
    )
  })

  it('una vencida dice hace cuánto', () => {
    expect(describeRemaining(DEADLINE, at('2026-09-22T13:03:00Z'))).toBe(
      'Vencida hace 1 h 3 min',
    )
  })
})

describe('isOverdue', () => {
  it('vence cuando pasa la fecha límite, no antes', () => {
    expect(isOverdue(DEADLINE, at('2026-09-22T11:59:59Z'))).toBe(false)
    expect(isOverdue(DEADLINE, at('2026-09-22T12:00:01Z'))).toBe(true)
  })
})
