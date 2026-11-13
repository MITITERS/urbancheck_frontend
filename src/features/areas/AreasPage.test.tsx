import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ROLES, type Role } from '@/types/auth'
import { AreasPage } from './AreasPage'
import type { OperationalArea } from './types'

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
  operator_count: 2,
  municipality: VILLA_MARIA,
  created_at: '2026-08-01T10:00:00Z',
}

const { mockedRole } = vi.hoisted(() => ({
  mockedRole: { current: null as Role | null },
}))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ role: mockedRole.current }),
}))

/** Responde como el backend: cada pestaña pide su propio `?state=`. */
function stubApi(area: OperationalArea = OBRAS) {
  vi.spyOn(apiClient, 'get').mockImplementation(
    async (url: string, config?: RequestConfig) => {
      if (url.includes('municipalities')) {
        return { data: { results: [VILLA_MARIA] } } as never
      }
      const wanted = area.is_active ? 'active' : 'inactive'
      const state = (config?.params as { state?: string } | undefined)?.state
      return { data: state === wanted ? [area] : [] } as never
    },
  )
}

beforeEach(() => {
  mockedRole.current = ROLES.MUNICIPAL_AGENT
  vi.restoreAllMocks()
})

describe('AreasPage', () => {
  it('lista las áreas de la jurisdicción con sus cifras', async () => {
    stubApi()

    renderWithProviders(<AreasPage />)
    const row = await screen.findByRole('row', { name: /Obras Públicas/ })

    expect(within(row).getByText(OBRAS.contact_email)).toBeInTheDocument()
    expect(within(row).getByText(OBRAS.contact_phone)).toBeInTheDocument()
    expect(within(row).getByText(String(OBRAS.report_count))).toBeInTheDocument()
    expect(within(row).getByText(messages.areas.active)).toBeInTheDocument()
  })

  it('el agente no elige municipalidad: el backend le asigna la suya', async () => {
    stubApi()
    const user = userEvent.setup()

    renderWithProviders(<AreasPage />)
    await user.click(await screen.findByRole('button', { name: messages.areas.create }))

    expect(screen.queryByLabelText(messages.areas.municipality)).not.toBeInTheDocument()
  })

  it('el alta del administrador va a la municipalidad del header, fija', async () => {
    // Decisión del usuario (21/10): se elige una vez, en el header, y el
    // formulario la muestra como dato en vez de ofrecer un selector.
    mockedRole.current = ROLES.PLATFORM_ADMIN
    stubApi()
    const user = userEvent.setup()

    renderWithProviders(<AreasPage />)
    await user.click(await screen.findByRole('button', { name: messages.areas.create }))

    expect(
      await screen.findByText(messages.municipalityScope.fixed),
    ).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('da de alta un área con nombre y datos de contacto', async () => {
    stubApi()
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: OBRAS })
    const user = userEvent.setup()

    renderWithProviders(<AreasPage />)
    await user.click(await screen.findByRole('button', { name: messages.areas.create }))
    await user.type(screen.getByLabelText(messages.areas.name), 'Alumbrado')
    await user.type(
      screen.getByLabelText(messages.areas.contactEmail),
      'luz@muni.gob.ar',
    )
    await user.type(screen.getByLabelText(messages.areas.contactPhone), '3534123456')
    await user.click(screen.getByRole('button', { name: messages.common.save }))

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/operational-areas/', {
        name: 'Alumbrado',
        contact_email: 'luz@muni.gob.ar',
        contact_phone: '3534123456',
      }),
    )
  })

  it('rechaza un email y un teléfono con formato inválido antes de enviarlos', async () => {
    // Escenario 3 de US-039. El backend lo vuelve a validar; esto evita el viaje.
    stubApi()
    const post = vi.spyOn(apiClient, 'post')
    const user = userEvent.setup()

    renderWithProviders(<AreasPage />)
    await user.click(await screen.findByRole('button', { name: messages.areas.create }))
    await user.type(screen.getByLabelText(messages.areas.name), 'Alumbrado')
    await user.type(screen.getByLabelText(messages.areas.contactEmail), 'no-es-un-mail')
    await user.type(screen.getByLabelText(messages.areas.contactPhone), 'llamar al 15')
    await user.click(screen.getByRole('button', { name: messages.common.save }))

    expect(await screen.findByText('El correo no es válido.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('la baja pide confirmación y dice cuántos reportes quedan vinculados', async () => {
    // Escenario 7: la consecuencia no se ve desde esta pantalla, así que se dice.
    stubApi()
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { ...OBRAS, is_active: false },
    })
    const user = userEvent.setup()

    renderWithProviders(<AreasPage />)
    await user.click(
      await screen.findByRole('button', { name: messages.areas.deactivate }),
    )

    expect(
      await screen.findByText(
        new RegExp(messages.areas.deactivateReports(OBRAS.report_count)),
      ),
    ).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', { name: messages.areas.deactivateConfirm }),
    )

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/operational-areas/9/deactivate/'),
    )
  })

  it('reactivar no pide confirmación: no le saca nada a nadie', async () => {
    stubApi({ ...OBRAS, is_active: false })
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: OBRAS })
    const user = userEvent.setup()

    renderWithProviders(<AreasPage />)
    await user.click(
      screen.getByRole('tab', { name: new RegExp(messages.areas.tabArchived) }),
    )
    await user.click(
      await screen.findByRole('button', { name: messages.areas.activate }),
    )

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/operational-areas/9/activate/'),
    )
  })

  it('con la municipalidad dada de baja, reactivar muestra el motivo del servidor', async () => {
    // El área no vuelve a operar mientras su municipalidad esté de baja: la
    // regla la sostiene el backend, y la pantalla dice lo que él contesta en
    // lugar de un texto genérico.
    stubApi({
      ...OBRAS,
      is_active: false,
      municipality: { ...VILLA_MARIA, is_active: false },
    })
    const detail =
      'No se puede reactivar esta área: su municipalidad está dada de baja. Volvé a darla de alta primero.'
    const post = vi.spyOn(apiClient, 'post').mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { detail } },
    })
    const user = userEvent.setup()

    renderWithProviders(<AreasPage />)
    await user.click(
      screen.getByRole('tab', { name: new RegExp(messages.areas.tabArchived) }),
    )
    await user.click(
      await screen.findByRole('button', { name: messages.areas.activate }),
    )

    expect(await screen.findByText(detail)).toBeInTheDocument()
    // Se intentó una sola vez y el área sigue del lado de las archivadas: el
    // rechazo del servidor no se reintenta ni se traga.
    expect(post).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByRole('button', { name: messages.areas.activate }),
    ).toBeInTheDocument()
  })
})
