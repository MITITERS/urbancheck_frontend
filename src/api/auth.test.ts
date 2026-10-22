import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  changePassword,
  fetchCurrentUser,
  login,
  logout,
  normalizeRole,
} from '@/api/auth'
import { apiClient, isApiError } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { messages } from '@/config/messages'
import { PANEL_ROLES, ROLES } from '@/types/auth'

/**
 * Capa de transporte de la sesión (US-017, US-035).
 *
 * Es el único módulo que conoce las formas del backend —el sobre de allauth, el
 * snake_case de DRF— y lo que se prueba acá es justamente esa traducción: que
 * nada de eso se filtre al resto del panel.
 */

const BACKEND_AGENT = {
  id: 7,
  email: 'agente@villamaria.gob.ar',
  name: 'Ana Agente',
  role: 'agente_municipal',
  municipality: { id: 3, city: 'Villa María', province: 'Córdoba' },
  must_change_password: true,
  is_work_account_active: true,
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('normalizeRole', () => {
  it.each([
    ['admin_plataforma', ROLES.PLATFORM_ADMIN],
    ['agente_municipal', ROLES.MUNICIPAL_AGENT],
    ['validador', ROLES.VALIDATOR],
    ['ciudadano', ROLES.CITIZEN],
    // C-10: el operario no es un ciudadano; antes caía en el default.
    ['operario', ROLES.OPERATOR],
  ])('traduce %s al rol del panel', (apiValue, expected) => {
    expect(normalizeRole(apiValue)).toBe(expected)
  })

  it('no distingue mayúsculas', () => {
    expect(normalizeRole('AGENTE_MUNICIPAL')).toBe(ROLES.MUNICIPAL_AGENT)
  })

  it('degrada un rol desconocido al de menos privilegios', () => {
    // Un rol nuevo en el backend no puede abrirle el panel a nadie por defecto.
    expect(normalizeRole('intendente')).toBe(ROLES.CITIZEN)
  })
})

describe('login', () => {
  it('devuelve el token de sesión del sobre de allauth', async () => {
    const post = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue({ data: { meta: { session_token: 'tok-123' } } } as never)

    await expect(login('agente@villamaria.gob.ar', 'secreta')).resolves.toBe('tok-123')
    expect(post).toHaveBeenCalledWith(endpoints.auth.login, {
      email: 'agente@villamaria.gob.ar',
      password: 'secreta',
    })
  })

  it('falla cuando la respuesta llega sin token', async () => {
    // Un 200 sin `session_token` es una respuesta que no sirve para nada: mejor
    // fallar acá que dejar la sesión a medio abrir.
    vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { meta: {} } } as never)

    await expect(login('a@b.com', 'x')).rejects.toMatchObject({
      status: 500,
      message: messages.errors.unexpected,
    })
  })
})

describe('fetchCurrentUser', () => {
  it('traduce el usuario del backend al del panel', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: BACKEND_AGENT } as never)

    await expect(fetchCurrentUser()).resolves.toEqual({
      id: 7,
      email: 'agente@villamaria.gob.ar',
      name: 'Ana Agente',
      avatar: null,
      role: ROLES.MUNICIPAL_AGENT,
      municipality: { id: 3, city: 'Villa María', province: 'Córdoba' },
      mustChangePassword: true,
      isActive: true,
    })
  })

  it('un ciudadano sin municipalidad llega con municipality en null', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { ...BACKEND_AGENT, role: 'ciudadano', municipality: null },
    } as never)

    const user = await fetchCurrentUser()

    expect(user.role).toBe(ROLES.CITIZEN)
    expect(user.municipality).toBeNull()
  })

  it('sin los campos nuevos, la cuenta se asume habilitada y sin contraseña temporal', async () => {
    // Compatibilidad con un backend anterior a la baja lógica de agentes: la
    // ausencia del campo no puede dejar afuera a una cuenta que sí funciona.
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { id: 1, email: 'a@b.com', name: 'A', role: 'agente_municipal' },
    } as never)

    const user = await fetchCurrentUser()

    expect(user.isActive).toBe(true)
    expect(user.mustChangePassword).toBe(false)
    expect(user.municipality).toBeNull()
  })
})

describe('logout', () => {
  it('borra la sesión en el servidor', async () => {
    const del = vi.spyOn(apiClient, 'delete').mockResolvedValue({ data: {} } as never)

    await logout()

    expect(del).toHaveBeenCalledWith(endpoints.auth.session)
  })

  it('no falla si el servidor rechaza el cierre', async () => {
    // allauth contesta 401 cuando la sesión ya estaba muerta, y el servidor
    // puede estar caído: cerrar sesión tiene que funcionar igual del lado del
    // navegador, o la persona queda encerrada en el panel.
    vi.spyOn(apiClient, 'delete').mockRejectedValue(new Error('Network Error'))

    await expect(logout()).resolves.toBeUndefined()
  })
})

describe('changePassword', () => {
  it('manda las dos contraseñas en snake_case', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} } as never)

    await changePassword('temporal123', 'definitiva456')

    expect(post).toHaveBeenCalledWith(endpoints.auth.changePassword, {
      current_password: 'temporal123',
      new_password: 'definitiva456',
    })
  })

  it('propaga el error del servidor tal cual lo normaliza el cliente', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue({
      status: 400,
      message: 'La contraseña es demasiado corta.',
      fieldErrors: { new_password: ['La contraseña es demasiado corta.'] },
    })

    await expect(changePassword('a', 'b')).rejects.toSatisfy(isApiError)
  })
})

describe('el operario en el panel (C-10)', () => {
  it('no es un rol del panel', () => {
    expect(PANEL_ROLES).not.toContain(ROLES.OPERATOR)
  })

  it('la pantalla de permisos lo manda a la app', () => {
    expect(messages.forbidden.description).toContain(
      'Si sos ciudadano, validador u operario, usá la aplicación móvil',
    )
  })
})
