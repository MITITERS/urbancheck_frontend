import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '@/api/auth'
import { apiClient } from '@/api/client'
import { SESSION_TOKEN_KEY } from '@/config/constants'
import { messages } from '@/config/messages'
import { AppRoutes } from '@/routes'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ROLES, type AuthUser, type Role } from '@/types/auth'

function buildUser(role: Role, overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 1,
    email: 'usuario@urbancheck.test',
    name: 'Usuario de prueba',
    avatar: null,
    role,
    municipality: { id: 1, city: 'Villa María', province: 'Córdoba' },
    mustChangePassword: false,
    isActive: true,
    ...overrides,
  }
}

function signedInAs(user: AuthUser) {
  window.localStorage.setItem(SESSION_TOKEN_KEY, 'token-de-prueba')
  vi.spyOn(authApi, 'fetchCurrentUser').mockResolvedValue(user)
}

beforeEach(() => {
  // The connectivity check on /reportes must not hit the network in tests.
  vi.spyOn(apiClient, 'get').mockResolvedValue({
    data: { count: 0, next: null, previous: null, results: [] },
  })
})

describe('ProtectedRoute', () => {
  it('sends an anonymous visitor to the login screen', async () => {
    renderWithProviders(<AppRoutes />, { route: '/reportes' })

    expect(await screen.findByText(messages.auth.loginTitle)).toBeInTheDocument()
  })

  it('lets a municipal agent through to a protected route', async () => {
    signedInAs(buildUser(ROLES.MUNICIPAL_AGENT))

    renderWithProviders(<AppRoutes />, { route: '/reportes' })

    expect(
      await screen.findByRole('link', { name: messages.nav.reports }),
    ).toBeInTheDocument()
  })

  it('shows the insufficient-permissions screen to a non municipal role', async () => {
    signedInAs(buildUser(ROLES.CITIZEN))

    renderWithProviders(<AppRoutes />, { route: '/reportes' })

    expect(await screen.findByText(messages.forbidden.title)).toBeInTheDocument()
  })

  it('stops a deactivated agent at the door, with an explanation', async () => {
    // La sesión es válida y el rol es de panel: lo que cambió es que el admin
    // dio de baja la cuenta. Sin este corte, entraría a una pantalla donde cada
    // consulta responde 403.
    signedInAs(buildUser(ROLES.MUNICIPAL_AGENT, { isActive: false }))

    renderWithProviders(<AppRoutes />, { route: '/reportes' })

    expect(
      await screen.findByText(messages.forbidden.deactivatedTitle),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: messages.nav.reports })).toBeNull()
  })

  it('keeps an agent with a temporary password on the change-password screen', async () => {
    signedInAs(buildUser(ROLES.MUNICIPAL_AGENT, { mustChangePassword: true }))

    renderWithProviders(<AppRoutes />, { route: '/reportes' })

    expect(await screen.findByText(messages.changePassword.title)).toBeInTheDocument()
  })

  it('cannot be skipped by typing another URL while the password is temporary', async () => {
    signedInAs(
      buildUser(ROLES.PLATFORM_ADMIN, {
        municipality: null,
        mustChangePassword: true,
      }),
    )

    renderWithProviders(<AppRoutes />, { route: '/municipalidades' })

    expect(await screen.findByText(messages.changePassword.title)).toBeInTheDocument()
  })

  it('denies a municipal agent a platform-admin-only route', async () => {
    signedInAs(buildUser(ROLES.MUNICIPAL_AGENT))

    renderWithProviders(<AppRoutes />, { route: '/municipalidades' })

    expect(await screen.findByText(messages.forbidden.sectionTitle)).toBeInTheDocument()
  })

  it('lets the platform admin open the report list of the chosen municipality', async () => {
    // Desde que la municipalidad se elige en el header, el admin ve los
    // reportes como el agente de esa ciudad.
    signedInAs(buildUser(ROLES.PLATFORM_ADMIN, { municipality: null }))

    renderWithProviders(<AppRoutes />, { route: '/reportes' })

    expect(
      await screen.findByRole('link', { name: messages.nav.reports }),
    ).toBeInTheDocument()
    expect(screen.queryByText(messages.forbidden.sectionTitle)).not.toBeInTheDocument()
  })

  it('lets the platform admin open a report detail', async () => {
    // El listado no es suyo, pero el detalle sí: es a donde lleva la tabla de
    // reportes de una municipalidad.
    signedInAs(buildUser(ROLES.PLATFORM_ADMIN, { municipality: null }))

    renderWithProviders(<AppRoutes />, { route: '/reportes/42' })

    expect(
      await screen.findByRole('link', { name: messages.nav.municipalities }),
    ).toBeInTheDocument()
    expect(screen.queryByText(messages.forbidden.sectionTitle)).not.toBeInTheDocument()
  })
})

describe('pantalla de permisos insuficientes', () => {
  it('al personal del panel le ofrece volver a su sección, no cerrar sesión', async () => {
    // Ofrecerle solo cerrar sesión lo dejaba en un callejón sin salida.
    signedInAs(buildUser(ROLES.MUNICIPAL_AGENT))

    renderWithProviders(<AppRoutes />, { route: '/municipalidades' })
    await screen.findByText(messages.forbidden.sectionTitle)

    expect(
      screen.getByRole('link', { name: messages.forbidden.goHome }),
    ).toHaveAttribute('href', '/reportes')
    expect(
      screen.queryByRole('button', { name: messages.forbidden.logout }),
    ).not.toBeInTheDocument()
  })

  it('no le dice al personal del panel que use la app móvil', async () => {
    // Ese mensaje es para el ciudadano y el validador; para un agente o un
    // admin es sencillamente falso.
    signedInAs(buildUser(ROLES.MUNICIPAL_AGENT))

    renderWithProviders(<AppRoutes />, { route: '/municipalidades' })
    await screen.findByText(messages.forbidden.sectionTitle)

    expect(screen.queryByText(messages.forbidden.description)).not.toBeInTheDocument()
  })

  it('al ciudadano sí lo manda a la app móvil, y solo puede salir', async () => {
    signedInAs(buildUser(ROLES.CITIZEN))

    renderWithProviders(<AppRoutes />, { route: '/reportes' })

    expect(await screen.findByText(messages.forbidden.title)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: messages.forbidden.logout }),
    ).toBeInTheDocument()
  })
})
