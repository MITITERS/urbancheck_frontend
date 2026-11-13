import { afterEach, describe, expect, it, vi } from 'vitest'
import { changePassword } from '@/api/auth'
import { apiClient } from '@/api/client'
import { clearStoredToken, getStoredToken, storeToken } from '@/lib/session'

/**
 * N-04 — cambiar la contraseña cierra las otras sesiones, y allauth rota el
 * token de la actual. El panel tiene que seguir con el nuevo.
 */
afterEach(() => {
  vi.restoreAllMocks()
  clearStoredToken()
})

describe('changePassword', () => {
  it('guarda el token rotado de la sesión actual', async () => {
    storeToken('viejo')
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { meta: { is_authenticated: true, session_token: 'rotado' } },
    } as never)

    await changePassword('Vieja#2026x', 'Nueva#2026x')

    expect(getStoredToken()).toBe('rotado')
  })

  it('sin token en la respuesta conserva el que había', async () => {
    storeToken('viejo')
    vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} } as never)

    await changePassword('Vieja#2026x', 'Nueva#2026x')

    expect(getStoredToken()).toBe('viejo')
  })
})
