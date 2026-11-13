import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as RouterModule from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { AreaDetailPage } from './AreaDetailPage'
import type { OperationalArea, Operator } from './types'

/** El config de la instancia compartida, sin importar axios (regla del repo). */
type RequestConfig = Parameters<typeof apiClient.get>[1]

const VILLA_MARIA = { id: 3, city: 'Villa María', province: 'Córdoba' }

const OBRAS: OperationalArea = {
  id: 9,
  name: 'Obras Públicas',
  contact_email: 'obras@muni.gob.ar',
  contact_phone: '3534123456',
  is_active: true,
  report_count: 4,
  operator_count: 1,
  municipality: VILLA_MARIA,
  created_at: '2026-08-01T10:00:00Z',
}

const RAMON: Operator = {
  id: 21,
  name: 'Ramón Operario',
  email: 'ramon@cuadrilla.gob.ar',
  phone: '3534999888',
  avatar: null,
  municipality: VILLA_MARIA,
  operational_area: OBRAS,
  is_active_operator: true,
  closed_count: 6,
  must_change_password: false,
}

// La página lee el id de la ruta; el test la monta suelta, sin esa ruta.
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof RouterModule>()
  return { ...actual, useParams: () => ({ id: '9' }) }
})

function stubApi({
  area = OBRAS,
  operator = RAMON,
}: { area?: OperationalArea; operator?: Operator } = {}) {
  vi.spyOn(apiClient, 'get').mockImplementation(
    async (url: string, config?: RequestConfig) => {
      if (url.startsWith('/api/operational-areas/') && !url.endsWith('/')) {
        return { data: area } as never
      }
      if (url === '/api/operational-areas/9/') return { data: area } as never
      if (url === '/api/operational-areas/') return { data: [area] } as never
      const wanted = operator.is_active_operator ? 'active' : 'inactive'
      const state = (config?.params as { state?: string } | undefined)?.state
      return { data: { results: state === wanted ? [operator] : [] } } as never
    },
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('AreaDetailPage', () => {
  it('los operarios se gestionan dentro de la ficha de su área', async () => {
    // US-044: no es una sección independiente del panel, a propósito.
    stubApi()

    renderWithProviders(<AreaDetailPage />)

    expect(await screen.findByText(OBRAS.name)).toBeInTheDocument()
    const row = await screen.findByRole('row', { name: /Ramón Operario/ })
    expect(within(row).getByText(RAMON.email)).toBeInTheDocument()
    expect(within(row).getByText(RAMON.phone)).toBeInTheDocument()
    expect(within(row).getByText(String(RAMON.closed_count))).toBeInTheDocument()
  })

  it('el listado de operarios se pide acotado a esta área', async () => {
    stubApi()
    const get = vi.spyOn(apiClient, 'get')

    renderWithProviders(<AreaDetailPage />)
    await screen.findByRole('row', { name: /Ramón Operario/ })

    expect(get).toHaveBeenCalledWith('/api/operators/', {
      params: { operational_area: 9, state: 'active' },
    })
  })

  it('da de alta un operario con el circuito de contraseña temporal', async () => {
    stubApi()
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: RAMON })
    const user = userEvent.setup()

    renderWithProviders(<AreaDetailPage />)
    await user.click(
      await screen.findByRole('button', { name: messages.operators.create }),
    )
    await user.type(screen.getByLabelText(messages.operators.name), 'Nueva Operaria')
    await user.type(
      screen.getByLabelText(messages.operators.email),
      'nueva@muni.gob.ar',
    )
    await user.type(screen.getByLabelText(messages.operators.phone), '3534111222')
    await user.type(
      screen.getByLabelText(messages.operators.temporaryPassword),
      'Provisoria2026',
    )
    await user.click(screen.getByRole('button', { name: messages.common.save }))

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/operators/', {
        name: 'Nueva Operaria',
        email: 'nueva@muni.gob.ar',
        phone: '3534111222',
        temporary_password: 'Provisoria2026',
        // El área sale de la ficha, no de una elección a ciegas.
        operational_area_id: 9,
      }),
    )
  })

  it('la baja pide confirmación explícita', async () => {
    stubApi()
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { ...RAMON, is_active_operator: false },
    })
    const user = userEvent.setup()

    renderWithProviders(<AreaDetailPage />)
    await user.click(
      await screen.findByRole('button', { name: messages.operators.deactivate }),
    )

    expect(post).not.toHaveBeenCalled()
    await user.click(
      screen.getByRole('button', { name: messages.operators.deactivateConfirm }),
    )

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/operators/21/deactivate/'),
    )
  })

  it('avisa cuando el área está desactivada: sus operarios no entran', async () => {
    // Escenario 9 de US-044, dicho donde se los está gestionando.
    stubApi({ area: { ...OBRAS, is_active: false } })

    renderWithProviders(<AreaDetailPage />)

    expect(await screen.findByText(messages.areas.inactiveWarning)).toBeInTheDocument()
  })
})
