import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '@/api/auth'
import { apiClient } from '@/api/client'
import { messages } from '@/config/messages'
import { AppRoutes } from '@/routes'
import { canAccessPath } from '@/routes/routeAccess'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ROLES, type AuthUser, type Role } from '@/types/auth'

function buildUser(role: Role): AuthUser {
  return {
    id: 1,
    email: 'usuario@urbancheck.test',
    name: 'Usuario',
    avatar: null,
    role,
    municipality:
      role === ROLES.MUNICIPAL_AGENT
        ? { id: 1, city: 'Villa María', province: 'Córdoba' }
        : null,
    mustChangePassword: false,
    isActive: true,
  }
}

beforeEach(() => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({
    data: { count: 0, next: null, previous: null, results: [] },
  })
})

/** Simula el login completo desde la pantalla, con el destino guardado. */
async function loginAs(role: Role, route: string) {
  vi.spyOn(authApi, 'login').mockResolvedValue('token')
  vi.spyOn(authApi, 'fetchCurrentUser').mockResolvedValue(buildUser(role))

  renderWithProviders(<AppRoutes />, { route })

  const user = userEvent.setup()
  await user.type(
    await screen.findByLabelText(messages.auth.email),
    'usuario@urbancheck.test',
  )
  await user.type(screen.getByLabelText(messages.auth.password), 'secreta123')
  await user.click(screen.getByRole('button', { name: messages.auth.submit }))
}

describe('destino después del login', () => {
  it('un agente que venía de una ruta de administrador aterriza en la suya', async () => {
    // El navegador quedó en /municipalidades de una sesión de administrador.
    await loginAs(ROLES.MUNICIPAL_AGENT, '/municipalidades')

    expect(
      await screen.findByRole('link', { name: messages.nav.reports }),
    ).toBeInTheDocument()
    expect(screen.queryByText(messages.forbidden.title)).not.toBeInTheDocument()
  })

  it('un administrador que venía de una ruta de agente aterriza en la suya', async () => {
    await loginAs(ROLES.PLATFORM_ADMIN, '/validadores')

    expect(
      await screen.findByRole('link', { name: messages.nav.municipalities }),
    ).toBeInTheDocument()
    expect(screen.queryByText(messages.forbidden.title)).not.toBeInTheDocument()
  })

  it('respeta el destino guardado cuando el rol sí puede entrar', async () => {
    await loginAs(ROLES.PLATFORM_ADMIN, '/agentes')

    // El destino guardado sí era alcanzable: se respeta.
    const current = await screen.findByRole('link', { name: messages.nav.agents })
    expect(current).toHaveAttribute('aria-current', 'page')
  })
})

describe('tabla de acceso', () => {
  it('el sidebar no ofrece destinos que el rol no puede abrir', async () => {
    await loginAs(ROLES.MUNICIPAL_AGENT, '/reportes')

    expect(
      await screen.findByRole('link', { name: messages.nav.reports }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: messages.nav.validators }),
    ).toBeInTheDocument()
    // Secciones del administrador: ni siquiera se dibujan.
    expect(
      screen.queryByRole('link', { name: messages.nav.municipalities }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: messages.nav.agents }),
    ).not.toBeInTheDocument()
  })

  it('la raíz manda a cada rol a su primera pantalla', async () => {
    await loginAs(ROLES.PLATFORM_ADMIN, '/')

    const current = await screen.findByRole('link', {
      name: messages.nav.municipalities,
    })
    expect(current).toHaveAttribute('aria-current', 'page')
  })

  it('el menú del administrador va de lo general a lo específico', async () => {
    await loginAs(ROLES.PLATFORM_ADMIN, '/')
    await screen.findByRole('link', { name: messages.nav.municipalities })

    const labels = screen.getAllByRole('link').map((link) => link.textContent?.trim())

    expect(labels).toEqual([
      messages.nav.municipalities,
      messages.nav.agents,
      // Desde que la municipalidad se elige en el header, el admin ve lo mismo
      // que el agente de esa ciudad.
      messages.nav.reports,
      messages.nav.statistics,
      messages.nav.validators,
      messages.nav.areas,
      // Protección de datos se unió a Denuncias (21/10).
      messages.nav.moderation,
      messages.nav.moderationAppeals,
    ])
  })

  it('el administrador ve los reportes de la municipalidad elegida', async () => {
    // Decisión del usuario (21/10): con el selector del header, el admin tiene
    // los mismos módulos que el agente, acotados a la ciudad elegida.
    await loginAs(ROLES.PLATFORM_ADMIN, '/')
    await screen.findByRole('link', { name: messages.nav.municipalities })

    expect(screen.getByRole('link', { name: messages.nav.reports })).toBeInTheDocument()
  })

  it('el agente ve su pantalla de trabajo primero', async () => {
    await loginAs(ROLES.MUNICIPAL_AGENT, '/')
    await screen.findByRole('link', { name: messages.nav.reports })

    const labels = screen.getAllByRole('link').map((link) => link.textContent?.trim())

    expect(labels).toEqual([
      messages.nav.reports,
      messages.nav.statistics,
      messages.nav.validators,
      messages.nav.areas,
      // Las bandejas, al final: no son alta de nada.
      messages.nav.moderation,
      messages.nav.moderationAppeals,
    ])
  })
})

describe('moderación de contenido (US-049)', () => {
  it('CP-049-P01 (US-049 E11) · denuncias y apelaciones son de los dos roles del panel', () => {
    expect(canAccessPath(ROLES.MUNICIPAL_AGENT, '/denuncias')).toBe(true)
    // El admin la ve; resolver sigue siendo del agente (lo controla el backend).
    expect(canAccessPath(ROLES.PLATFORM_ADMIN, '/denuncias')).toBe(true)
    expect(canAccessPath(ROLES.VALIDATOR, '/denuncias')).toBe(false)
    expect(canAccessPath(ROLES.PLATFORM_ADMIN, '/apelaciones')).toBe(true)
    expect(canAccessPath(ROLES.MUNICIPAL_AGENT, '/apelaciones')).toBe(true)
    expect(canAccessPath(ROLES.VALIDATOR, '/apelaciones')).toBe(false)
  })
})

describe('protección de datos (US-043)', () => {
  it('el enlace viejo sigue abierto a los dos roles: redirige a Denuncias', () => {
    // Desde el 21/10 las solicitudes viven en Denuncias, filtradas por tipo.
    expect(canAccessPath(ROLES.MUNICIPAL_AGENT, '/privacidad')).toBe(true)
    expect(canAccessPath(ROLES.PLATFORM_ADMIN, '/privacidad')).toBe(true)
    expect(canAccessPath(ROLES.VALIDATOR, '/privacidad')).toBe(false)
  })
})
