import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ROLES } from '@/types/auth'
import { AgentsPage } from './AgentsPage'
import type { MunicipalAgent } from './types'

// La pantalla es del admin: la municipalidad la elige en el header, y el
// proveedor de alcance toma la primera de la lista.
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ role: ROLES.PLATFORM_ADMIN, user: null }),
}))

/** El config de la instancia compartida, sin importar axios (regla del repo). */
type RequestConfig = Parameters<typeof apiClient.get>[1]

const VILLA_MARIA = {
  id: 3,
  city: 'Villa María',
  province: 'Córdoba',
  is_active: true,
}
const BELL_VILLE = { id: 4, city: 'Bell Ville', province: 'Córdoba' }

const ACTIVE = {
  id: 7,
  name: 'Agente Uno',
  email: 'agente@muni.gob.ar',
  municipality: VILLA_MARIA,
  is_active_agent: true,
  management_count: 5,
  must_change_password: false,
} as unknown as MunicipalAgent

/**
 * Responde como el backend: cada pestaña pide su propio estado, y el agente
 * aparece solo en la lista que le corresponde.
 */
function stubApi(agent: MunicipalAgent = ACTIVE) {
  vi.spyOn(apiClient, 'get').mockImplementation(
    async (url: string, config?: RequestConfig) => {
      if (url.includes('municipalities')) {
        return { data: { results: [VILLA_MARIA, BELL_VILLE] } } as never
      }
      const wanted = agent.is_active_agent ? 'active' : 'inactive'
      const state = (config?.params as { state?: string } | undefined)?.state
      const results = state === wanted ? [agent] : []
      return { data: { results } } as never
    },
  )
}

beforeEach(() => {
  stubApi()
})

describe('AgentsPage', () => {
  it('lista los agentes con su estado y su cifra de gestión', async () => {
    renderWithProviders(<AgentsPage />)

    const row = await screen.findByRole('row', { name: /Agente Uno/ })
    expect(within(row).getByText(messages.agents.active)).toBeInTheDocument()
    expect(within(row).getByText('5')).toBeInTheDocument()
  })

  it('pide confirmación antes de desactivar, y aclara qué se conserva', async () => {
    const post = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue({ data: { ...ACTIVE, is_active_agent: false } } as never)
    const user = userEvent.setup()

    renderWithProviders(<AgentsPage />)
    await user.click(
      await screen.findByRole('button', { name: messages.agents.deactivate }),
    )

    // El diálogo aparece y todavía no se llamó a la API: la baja no ocurre
    // por abrir la confirmación.
    expect(
      await screen.findByText(messages.agents.deactivateDescription),
    ).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', { name: messages.agents.deactivateConfirm }),
    )

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/municipal-agents/7/deactivate/'),
    )
  })

  it('el agente desactivado no está en la pestaña principal', async () => {
    stubApi({ ...ACTIVE, is_active_agent: false })
    const user = userEvent.setup()

    renderWithProviders(<AgentsPage />)

    // La pestaña abierta es la de habilitados, y ahí no está.
    expect(
      await screen.findByText(messages.agents.emptyForMunicipality),
    ).toBeInTheDocument()
    expect(screen.queryByRole('row', { name: /Agente Uno/ })).not.toBeInTheDocument()

    await user.click(await screen.findByRole('tab', { name: /Archivados/ }))

    const row = await screen.findByRole('row', { name: /Agente Uno/ })
    expect(within(row).getByText(messages.agents.inactive)).toBeInTheDocument()
  })

  it('no deja reactivar a quien perdió su municipalidad', async () => {
    stubApi({
      ...ACTIVE,
      is_active_agent: false,
      municipality: { ...VILLA_MARIA, is_active: false },
    } as unknown as MunicipalAgent)
    const post = vi.spyOn(apiClient, 'post')
    const user = userEvent.setup()

    renderWithProviders(<AgentsPage />)
    await user.click(await screen.findByRole('tab', { name: /Archivados/ }))
    await screen.findByRole('row', { name: /Agente Uno/ })

    // El botón está, pero apagado y con el motivo: esconderlo dejaría al admin
    // sin saber por qué no puede reactivarlo.
    const button = screen.getByRole('button', { name: messages.agents.activate })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('title', messages.agents.cannotReactivate)

    await user.click(button)
    expect(post).not.toHaveBeenCalled()
  })

  it('desde archivados lo reactiva sin pedir confirmación', async () => {
    stubApi({ ...ACTIVE, is_active_agent: false })
    const post = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue({ data: ACTIVE } as never)
    const user = userEvent.setup()

    renderWithProviders(<AgentsPage />)
    await user.click(await screen.findByRole('tab', { name: /Archivados/ }))
    await screen.findByRole('row', { name: /Agente Uno/ })

    // Reactivar no le saca nada a nadie: va directo.
    await user.click(screen.getByRole('button', { name: messages.agents.activate }))

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/municipal-agents/7/activate/'),
    )
  })

  it('las dos pestañas piden los agentes de la municipalidad del header', async () => {
    // Ya no hay filtro en la página (21/10): la municipalidad se elige una vez,
    // en el header, y vale para todo el panel.
    const get = vi.spyOn(apiClient, 'get')

    renderWithProviders(<AgentsPage />)
    await screen.findByRole('row', { name: /Agente Uno/ })

    expect(screen.queryByLabelText(messages.agents.filterByMunicipality)).toBeNull()
    for (const state of ['active', 'inactive']) {
      expect(get).toHaveBeenCalledWith('/api/municipal-agents/', {
        params: { state, municipality: VILLA_MARIA.id },
      })
    }
  })

  it('el alta usa la municipalidad del header, fija', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AgentsPage />)

    await user.click(
      await screen.findByRole('button', { name: messages.agents.create }),
    )

    expect(await screen.findByText('Villa María, Córdoba')).toBeInTheDocument()
  })
})
