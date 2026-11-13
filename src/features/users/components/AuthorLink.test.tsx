import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { PublicProfile } from '../api/publicProfile'
import { AuthorLink } from './AuthorLink'

const PUBLIC_PROFILE: PublicProfile = {
  id: 7,
  name: 'Lucas Leone',
  avatar: null,
  is_public: true,
  date_joined: '2026-03-04T10:00:00Z',
  report_count: 4,
}

const REPORT = {
  id: 12,
  number: 3,
  category: 'bache',
  status: 'reportado',
  created_at: '2026-08-01T10:00:00Z',
  address: 'Bv. España 100',
  latitude: null,
  longitude: null,
  like_count: 2,
  photo_status: 'procesada',
  operative_area: null,
  municipality: null,
  author: { id: 7, name: 'Lucas Leone' },
}

function stubApi(profile = PUBLIC_PROFILE, results: unknown[] = [REPORT]) {
  vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
    if (url.includes('/api/users/')) return { data: profile } as never
    return { data: { count: results.length, results } } as never
  })
}

beforeEach(() => {
  stubApi()
})

describe('AuthorLink', () => {
  it('no pide nada hasta que se toca el nombre', async () => {
    const get = vi.spyOn(apiClient, 'get')

    renderWithProviders(<AuthorLink id={7} name="Lucas Leone" />)

    // Un reporte con diez comentarios traería diez perfiles que nadie miró.
    expect(get).not.toHaveBeenCalled()
  })

  it('abre el perfil con su antigüedad y sus reportes', async () => {
    const user = userEvent.setup()

    renderWithProviders(<AuthorLink id={7} name="Lucas Leone" />)
    await user.click(screen.getByRole('button', { name: 'Lucas Leone' }))

    expect(await screen.findByText(messages.profile.title)).toBeInTheDocument()
    expect(await screen.findByText(/Bv. España 100/)).toBeInTheDocument()
    expect(screen.getByText(`4 ${messages.profile.reports}`)).toBeInTheDocument()
  })

  it('respeta el perfil privado, incluso mirándolo desde el panel', async () => {
    stubApi({
      ...PUBLIC_PROFILE,
      is_public: false,
      date_joined: null,
      report_count: null,
    })
    const user = userEvent.setup()

    renderWithProviders(<AuthorLink id={7} name="Lucas Leone" />)
    await user.click(screen.getByRole('button', { name: 'Lucas Leone' }))

    expect(await screen.findByText(messages.profile.private)).toBeInTheDocument()
  })

  it('los reportes de la jurisdicción se muestran igual', async () => {
    // Son datos que el municipio ya gestiona y ve en su propio listado: el
    // perfil no le enseña nada que no tuviera a un clic.
    stubApi({
      ...PUBLIC_PROFILE,
      is_public: false,
      date_joined: null,
      report_count: null,
    })
    const user = userEvent.setup()

    renderWithProviders(<AuthorLink id={7} name="Lucas Leone" />)
    await user.click(screen.getByRole('button', { name: 'Lucas Leone' }))

    expect(await screen.findByText(/Bv. España 100/)).toBeInTheDocument()
  })

  it('acorta la dirección larga del geocodificador', async () => {
    stubApi(PUBLIC_PROFILE, [
      {
        ...REPORT,
        address:
          'Banco Patagonia, 1145, Santa Fe, Centro, Villa María, Municipio de Villa María, Córdoba, Argentina',
      },
    ])
    const user = userEvent.setup()

    renderWithProviders(<AuthorLink id={7} name="Lucas Leone" />)
    await user.click(screen.getByRole('button', { name: 'Lucas Leone' }))

    // La cola administrativa no informa y estiraba el modal entero.
    const address = await screen.findByText('Banco Patagonia, 1145, Santa Fe')
    expect(address).toBeInTheDocument()
    // La completa queda en el `title`, para quien la necesite.
    expect(address).toHaveAttribute('title', expect.stringContaining('Argentina'))
  })

  it('pide los reportes acotados a esa persona', async () => {
    const get = vi.spyOn(apiClient, 'get')
    const user = userEvent.setup()

    renderWithProviders(<AuthorLink id={7} name="Lucas Leone" />)
    await user.click(screen.getByRole('button', { name: 'Lucas Leone' }))

    // Por el endpoint del panel: ahí el filtro se aplica sobre el queryset que
    // ya acotó la jurisdicción.
    await waitFor(() =>
      expect(get).toHaveBeenCalledWith('/api/panel/reports/', {
        params: { author: 7 },
      }),
    )
  })
})
