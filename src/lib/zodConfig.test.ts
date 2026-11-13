import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import './zodConfig'

describe('configuración de zod', () => {
  it('no compila validadores con eval, que la CSP del panel bloquea', () => {
    expect(z.config().jitless).toBe(true)
  })
})
