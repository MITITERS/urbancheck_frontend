import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ModerationAppealsPage } from './ModerationAppealsPage'
import type { ModerationAppeal } from './types'

type RequestConfig = Parameters<typeof apiClient.get>[1]
const t = messages.moderationAppeals

const APPEAL: ModerationAppeal = {
  id: 8,
  status: 'pendiente',
  reason: 'El bache existe, está frente a mi casa.',
  created_at: '2026-10-04T12:00:00Z',
  resolved_at: null,
  resolved_by: null,
  resolution_reason: '',
  author: { id: 1, name: 'Autora', avatar: null },
  report: {
    id: 42,
    number: 7,
    category: 'bache',
    status: 'cancelado',
    description: 'Bache',
    address: 'Corrientes 529, Villa María',
    photo: 'https://example.test/bache.jpg',
    created_at: '2026-10-01T12:00:00Z',
    municipality: { id: 3, city: 'Villa María', province: 'Córdoba' },
  },
  decision: {
    id: 5,
    reason: 'La foto es de otra ciudad.',
    previous_status: 'reportado',
    decided_by: { id: 3, name: 'Agente Municipal', avatar: null },
    created_at: '2026-10-03T12:00:00Z',
  },
  complaints: [],
}

beforeEach(() => {
  vi.spyOn(apiClient, 'get').mockImplementation(
    async (_url: string, config?: RequestConfig) => {
      const state = (config?.params as { state?: string } | undefined)?.state
      const results = state === 'resolved' ? [] : [APPEAL]
      return { data: { count: results.length, results } } as never
    },
  )
})

describe('ModerationAppealsPage', () => {
  it('CP-049-P10 (US-049 E6) · muestra el motivo del municipio junto al del vecino', async () => {
    renderWithProviders(<ModerationAppealsPage />)

    expect(await screen.findByText(APPEAL.decision.reason)).toBeInTheDocument()
    expect(screen.getByText(APPEAL.reason)).toBeInTheDocument()
    expect(screen.getByText(/Villa María/)).toBeInTheDocument()
  })

  it('N-09 · la apelación de un vecino que borró la cuenta dice "Usuario eliminado"', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { count: 1, results: [{ ...APPEAL, author: null }] },
    } as never)

    renderWithProviders(<ModerationAppealsPage />)

    expect(await screen.findByText(APPEAL.reason)).toBeInTheDocument()
    expect(screen.getByText(messages.common.deletedUser)).toBeInTheDocument()
  })

  it('CP-049-P14 · muestra la foto del reporte apelado', async () => {
    renderWithProviders(<ModerationAppealsPage />)

    const photo = await screen.findByRole('img', { name: t.photoAlt(7) })
    expect(photo).toHaveAttribute('src', 'https://example.test/bache.jpg')
  })

  it('CP-049-P15 · el nombre del vecino que apela abre su perfil, como el de quien denunció', async () => {
    renderWithProviders(<ModerationAppealsPage />)

    expect(await screen.findByRole('button', { name: 'Autora' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agente Municipal' })).toBeInTheDocument()
  })

  it('CP-049-P11 (US-049 E7) · hacer lugar pide motivo y lo manda', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} } as never)
    const user = userEvent.setup()
    renderWithProviders(<ModerationAppealsPage />)

    await user.click(await screen.findByRole('button', { name: t.accept }))
    const dialog = await screen.findByRole('dialog')
    await user.type(
      within(dialog).getByLabelText(t.reasonLabel),
      'El reclamo es legítimo',
    )
    await user.click(within(dialog).getByRole('button', { name: t.accept }))

    expect(post).toHaveBeenCalledWith(endpoints.moderationAppeals.accept(8), {
      reason: 'El reclamo es legítimo',
    })
  })

  it('CP-049-P12 (US-049 E7) · rechazar es destructivo y avisa que no hay segunda apelación', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ModerationAppealsPage />)

    await user.click(await screen.findByRole('button', { name: t.reject }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(t.rejectDescription)).toBeInTheDocument()
  })
})
