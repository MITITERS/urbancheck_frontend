import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  apiClient,
  createApiError,
  isApiError,
  normalizeError,
  setSessionExpiredHandler,
} from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { LOGIN_ROUTE } from '@/config/constants'
import { messages } from '@/config/messages'
import { getStoredToken, storeToken } from '@/lib/session'

/**
 * Cliente HTTP del panel: el token de sesión, el 401 y la traducción de errores.
 *
 * No se importa `axios` en este archivo —la convención del proyecto es que solo
 * `client.ts` lo hace— así que los errores del servidor se arman como los
 * objetos que axios entrega (`isAxiosError: true`) y las respuestas se inyectan
 * reemplazando el adapter de la instancia.
 */

/** Minimal stand-in for an axios error; `isAxiosError` is all axios checks. */
function axiosErrorWith(status: number | null, data?: unknown): unknown {
  return {
    isAxiosError: true,
    message: 'request failed',
    config: {},
    response: status === null ? undefined : { status, data },
  }
}

/** Igual, pero con la URL que el interceptor necesita mirar. */
function axiosErrorAt(url: string, status: number, data: unknown = null) {
  return {
    isAxiosError: true,
    message: 'Request failed',
    config: { url, headers: {} },
    response: { status, data, headers: {}, config: {} },
  }
}

/** Un adapter que siempre contesta 200, para inspeccionar la request saliente. */
function respondingAdapter() {
  return vi.fn(async (config) => ({
    data: { ok: true },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }))
}

const originalAdapter = apiClient.defaults.adapter

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter
  setSessionExpiredHandler(null)
})

describe('interceptor de request', () => {
  it('adjunta el token de sesión en X-Session-Token', () => {
    storeToken('tok-abc')
    const adapter = respondingAdapter()
    apiClient.defaults.adapter = adapter as never

    return apiClient.get('/api/reports/').then(() => {
      expect(adapter.mock.calls[0][0].headers.get('X-Session-Token')).toBe('tok-abc')
    })
  })

  it('sin sesión no manda el header', async () => {
    const adapter = respondingAdapter()
    apiClient.defaults.adapter = adapter as never

    await apiClient.get('/api/reports/')

    expect(adapter.mock.calls[0][0].headers.get('X-Session-Token')).toBeFalsy()
  })
})

describe('interceptor de response, sesión vencida', () => {
  it('un 401 sin token que refrescar termina la sesión', async () => {
    const onExpired = vi.fn()
    setSessionExpiredHandler(onExpired)
    apiClient.defaults.adapter = (async () => {
      throw axiosErrorAt('/api/reports/', 401)
    }) as never

    await expect(apiClient.get('/api/reports/')).rejects.toMatchObject({
      status: 401,
      message: messages.auth.sessionExpired,
    })
    expect(onExpired).toHaveBeenCalledOnce()
  })

  it('el 401 del propio endpoint de sesión no intenta refrescarse', async () => {
    // Refrescar la sesión leyendo la sesión que acaba de dar 401 sería un bucle.
    storeToken('tok-vieja')
    const onExpired = vi.fn()
    setSessionExpiredHandler(onExpired)
    const adapter = vi.fn(async () => {
      throw axiosErrorAt(endpoints.auth.session, 401)
    })
    apiClient.defaults.adapter = adapter as never

    await expect(apiClient.get(endpoints.auth.session)).rejects.toBeTruthy()

    expect(adapter).toHaveBeenCalledOnce()
    expect(onExpired).toHaveBeenCalledOnce()
  })

  it('al expirar borra el token guardado', async () => {
    storeToken('tok-vieja')
    setSessionExpiredHandler(vi.fn())
    apiClient.defaults.adapter = (async () => {
      throw axiosErrorAt('/api/reports/', 401)
    }) as never

    await expect(apiClient.get('/api/reports/')).rejects.toBeTruthy()

    expect(getStoredToken()).toBeNull()
  })

  it('sin handler registrado redirige al login', async () => {
    // La red de seguridad para una pestaña vieja: nadie se queda mirando una
    // pantalla protegida con la sesión ya muerta.
    const assign = vi.fn()
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      pathname: '/reportes',
      assign,
    } as never)
    apiClient.defaults.adapter = (async () => {
      throw axiosErrorAt('/api/reports/', 401)
    }) as never

    await expect(apiClient.get('/api/reports/')).rejects.toBeTruthy()

    expect(assign).toHaveBeenCalledWith(LOGIN_ROUTE)
  })

  it('un 403 no toca la sesión', async () => {
    const onExpired = vi.fn()
    setSessionExpiredHandler(onExpired)
    apiClient.defaults.adapter = (async () => {
      throw axiosErrorAt('/api/panel/reports/', 403)
    }) as never

    await expect(apiClient.get('/api/panel/reports/')).rejects.toMatchObject({
      status: 403,
      message: messages.errors.forbidden,
    })
    expect(onExpired).not.toHaveBeenCalled()
  })
})

describe('normalizeError', () => {
  it('keeps DRF field errors keyed by field', () => {
    const error = normalizeError(
      axiosErrorWith(400, { email: ['Este campo es obligatorio.'] }),
    )

    expect(error.status).toBe(400)
    expect(error.fieldErrors).toEqual({ email: ['Este campo es obligatorio.'] })
    expect(error.message).toBe('Este campo es obligatorio.')
  })

  it('uses the DRF detail as the message', () => {
    const error = normalizeError(axiosErrorWith(403, { detail: 'Sin permiso.' }))

    expect(error.message).toBe('Sin permiso.')
    expect(error.fieldErrors).toEqual({})
  })

  it('flattens the allauth error envelope', () => {
    const error = normalizeError(
      axiosErrorWith(400, {
        status: 400,
        errors: [{ message: 'Contraseña incorrecta.', param: 'password' }],
      }),
    )

    expect(error.fieldErrors).toEqual({ password: ['Contraseña incorrecta.'] })
    expect(error.message).toBe('Contraseña incorrecta.')
  })

  it('CP-SEC05-P01 · un 429 de allauth se explica en castellano y sin campos', () => {
    const error = normalizeError(
      axiosErrorWith(429, {
        status: 429,
        errors: [
          {
            code: 'too_many_login_attempts',
            message: 'Too many failed login attempts. Try again later.',
          },
        ],
      }),
    )

    expect(error.status).toBe(429)
    expect(error.message).toBe(messages.errors.tooManyRequests)
    expect(error.fieldErrors).toEqual({})
  })

  it('CP-SEC05-P02 · un 429 de la API conserva su detail, que ya trae el tiempo de espera', () => {
    const detail =
      'Hiciste demasiadas solicitudes seguidas. Probá de nuevo en 5 minutos.'
    const error = normalizeError(
      axiosErrorWith(429, { code: 'throttled', detail, retry_after: 300 }),
    )

    expect(error.message).toBe(detail)
  })

  it('CP-SEC05-P03 · un 429 sin cuerpo JSON también se explica', () => {
    const error = normalizeError(axiosErrorWith(429, '<html>Too Many Requests</html>'))

    expect(error.message).toBe(messages.errors.tooManyRequests)
  })

  it('reports a network failure with status 0', () => {
    const error = normalizeError(axiosErrorWith(null))

    expect(error).toEqual({
      status: 0,
      message: messages.errors.network,
      fieldErrors: {},
    })
  })

  it('passes an already normalized error through untouched', () => {
    const original = { status: 404, message: 'No existe.', fieldErrors: {} }

    expect(normalizeError(original)).toBe(original)
  })

  it('un error que no viene de axios es un error inesperado', () => {
    expect(normalizeError(new TypeError('boom'))).toEqual({
      status: 0,
      message: messages.errors.unexpected,
      fieldErrors: {},
    })
  })

  it('un error de allauth sin param queda como error general', () => {
    const error = normalizeError(
      axiosErrorWith(400, { errors: [{ message: 'No se pudo.' }] }),
    )

    expect(error.fieldErrors).toEqual({ nonFieldErrors: ['No se pudo.'] })
  })

  it('acumula varios mensajes del mismo campo', () => {
    const error = normalizeError(
      axiosErrorWith(400, {
        errors: [
          { message: 'Muy corta.', param: 'password' },
          { message: 'Muy común.', param: 'password' },
        ],
      }),
    )

    expect(error.fieldErrors.password).toEqual(['Muy corta.', 'Muy común.'])
  })

  it('el detail de DRF gana sobre los errores de campo', () => {
    const error = normalizeError(
      axiosErrorWith(409, {
        detail: 'El reporte ya cambió de estado.',
        status: ['algo'],
      }),
    )

    expect(error.message).toBe('El reporte ya cambió de estado.')
    // `detail` no es un campo del formulario: no se ofrece como tal.
    expect(error.fieldErrors).not.toHaveProperty('detail')
  })

  it('acepta un error de campo mandado como string suelto', () => {
    const error = normalizeError(axiosErrorWith(400, { city: 'Requerido.' }))

    expect(error.fieldErrors.city).toEqual(['Requerido.'])
  })

  it.each([
    [403, messages.errors.forbidden],
    [404, messages.errors.notFound],
    [401, messages.auth.sessionExpired],
    [500, messages.errors.unexpected],
  ])('sin cuerpo útil, el %i tiene su mensaje por defecto', (status, expected) => {
    expect(normalizeError(axiosErrorWith(status, null)).message).toBe(expected)
  })
})

describe('isApiError', () => {
  it('reconoce lo que produce createApiError', () => {
    expect(isApiError(createApiError(400, 'x'))).toBe(true)
  })

  it.each([
    ['null', null],
    ['un Error común', new Error('x')],
    ['un objeto sin fieldErrors', { status: 400, message: 'x' }],
    ['un status que no es número', { status: '400', message: 'x', fieldErrors: {} }],
  ])('rechaza %s', (_label, value) => {
    expect(isApiError(value)).toBe(false)
  })
})
