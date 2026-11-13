import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { Topbar } from '@/components/layout/Topbar'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ROLES, type AuthUser, type Role } from '@/types/auth'
import { useMunicipalityScope } from './context'

/**
 * El selector de municipalidad del header (pedido del 21/10): el admin elige
 * una vez qué municipalidad ve, y lo ven todas las pantallas.
 */

const VILLA_MARIA = { id: 3, city: 'Villa María', province: 'Córdoba' }
const VILLA_NUEVA = { id: 4, city: 'Villa Nueva', province: 'Córdoba' }

const { mockedAuth } = vi.hoisted(() => ({
  mockedAuth: { current: { role: null as Role | null, user: null as AuthUser | null } },
}))
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockedAuth.current }))

function user(role: Role, municipality: typeof VILLA_MARIA | null = null): AuthUser {
  return {
    id: 1,
    name: 'Persona',
    email: 'persona@example.test',
    avatar: null,
    role,
    municipality,
    mustChangePassword: false,
    isActive: true,
  }
}

function signedInAs(role: Role, municipality: typeof VILLA_MARIA | null = null) {
  mockedAuth.current = { role, user: user(role, municipality) }
}

function municipalitiesAre(list: (typeof VILLA_MARIA)[]) {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { results: list } } as never)
}

/** Lo que una pantalla cualquiera lee del alcance. */
function ScopeProbe() {
  const { current } = useMunicipalityScope()
  return <p data-testid="scope">{current?.city ?? 'ninguna'}</p>
}

function renderHeader(route = '/reportes') {
  return renderWithProviders(
    <>
      <Topbar user={mockedAuth.current.user!} onLogout={() => {}} />
      <ScopeProbe />
    </>,
    { route },
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('selector de municipalidad del header', () => {
  it('CP-SCOPE-P01 · el admin elige la municipalidad y la ven todas las pantallas', async () => {
    signedInAs(ROLES.PLATFORM_ADMIN)
    municipalitiesAre([VILLA_MARIA, VILLA_NUEVA])
    const ux = userEvent.setup()
    renderHeader()

    const select = await screen.findByRole('combobox', {
      name: messages.municipalityScope.label,
    })
    expect(select).toHaveTextContent('Villa María, Córdoba')
    expect(screen.getByTestId('scope')).toHaveTextContent('Villa María')

    await ux.click(select)
    await ux.click(await screen.findByRole('option', { name: 'Villa Nueva, Córdoba' }))

    await waitFor(() =>
      expect(screen.getByTestId('scope')).toHaveTextContent('Villa Nueva'),
    )
  })

  it('CP-SCOPE-P02 · recuerda la última elegida al recargar', async () => {
    window.localStorage.setItem('urbancheck.panel.municipality', String(VILLA_NUEVA.id))
    signedInAs(ROLES.PLATFORM_ADMIN)
    municipalitiesAre([VILLA_MARIA, VILLA_NUEVA])
    renderHeader()

    await waitFor(() =>
      expect(screen.getByTestId('scope')).toHaveTextContent('Villa Nueva'),
    )
  })

  it('CP-SCOPE-P03 · si la recordada ya no existe, toma la primera', async () => {
    window.localStorage.setItem('urbancheck.panel.municipality', '999')
    signedInAs(ROLES.PLATFORM_ADMIN)
    municipalitiesAre([VILLA_MARIA, VILLA_NUEVA])
    renderHeader()

    await waitFor(() =>
      expect(screen.getByTestId('scope')).toHaveTextContent('Villa María'),
    )
  })

  it('CP-SCOPE-P04 · con una sola municipalidad el selector es de solo lectura', async () => {
    signedInAs(ROLES.PLATFORM_ADMIN)
    municipalitiesAre([VILLA_MARIA])
    renderHeader()

    const select = await screen.findByRole('combobox', {
      name: messages.municipalityScope.label,
    })
    expect(select).toBeDisabled()
    expect(select).toHaveTextContent('Villa María, Córdoba')
  })

  it('CP-SCOPE-P05 · sin municipalidades lo dice y las pantallas piden crear una', async () => {
    signedInAs(ROLES.PLATFORM_ADMIN)
    municipalitiesAre([])
    renderHeader()

    expect(await screen.findByText(messages.municipalityScope.none)).toBeInTheDocument()
    expect(screen.getByTestId('scope')).toHaveTextContent('ninguna')
  })

  it('CP-SCOPE-P06 · el agente no tiene selector: ve su municipio', () => {
    signedInAs(ROLES.MUNICIPAL_AGENT, VILLA_MARIA)
    const get = vi.spyOn(apiClient, 'get')
    renderHeader()

    expect(
      screen.queryByRole('combobox', { name: messages.municipalityScope.label }),
    ).toBeNull()
    expect(screen.getAllByText('Villa María').length).toBeGreaterThan(0)
    // El agente no pide la lista de municipalidades: la API se la negaría.
    expect(get).not.toHaveBeenCalled()
  })

  it('CP-SCOPE-P07 · en Municipalidades no aparece: ahí se administran todas', async () => {
    signedInAs(ROLES.PLATFORM_ADMIN)
    municipalitiesAre([VILLA_MARIA, VILLA_NUEVA])
    renderHeader('/municipalidades')

    expect(await screen.findByText(messages.app.subtitle)).toBeInTheDocument()
    expect(
      screen.queryByRole('combobox', { name: messages.municipalityScope.label }),
    ).toBeNull()
  })
})
