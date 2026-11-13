import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient, createApiError } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ModerationInboxPage } from './ModerationInboxPage'
import type { ModerationInboxEntry } from './types'

const t = messages.moderation

function entry(overrides: Partial<ModerationInboxEntry> = {}): ModerationInboxEntry {
  return {
    id: 42,
    number: 7,
    category: 'bache',
    status: 'reportado',
    description: 'Bache frente a la escuela',
    address: 'Av. Siempre Viva 742',
    photo: 'https://example.test/bache.jpg',
    created_at: '2026-10-01T12:00:00Z',
    author: { id: 1, name: 'Autora', avatar: null },
    pending_complaint_count: 2,
    oldest_complaint_at: '2026-10-02T12:00:00Z',
    complaints: [
      {
        id: 1,
        reason: 'reporte_falso',
        reason_label: 'Reporte falso o inexistente',
        comment: 'Ese bache no existe',
        reporter: { id: 9, name: 'Vecina Denunciante', avatar: null },
        status: 'pendiente',
        created_at: '2026-10-02T12:00:00Z',
        resolved_at: null,
      },
      {
        id: 2,
        reason: 'contenido_inapropiado',
        reason_label: 'Contenido inapropiado u ofensivo',
        comment: '',
        reporter: { id: 10, name: 'Otro Vecino', avatar: null },
        status: 'pendiente',
        created_at: '2026-10-03T12:00:00Z',
        resolved_at: null,
      },
    ],
    ...overrides,
  }
}

/** El config de la instancia compartida, sin importar axios (regla del repo). */
type RequestConfig = Parameters<typeof apiClient.get>[1]

/** Una solicitud por dato personal, con lo que la tabla muestra. */
const PRIVACY_REQUEST = {
  id: 5,
  reason: 'dato_personal',
  reason_label: 'Dato personal visible',
  status: 'pendiente',
  // Más vieja que la denuncia por contenido: va primero.
  received_at: '2026-10-01T12:00:00Z',
  deadline: '2026-10-02T12:00:00Z',
  remaining_seconds: -1,
  is_overdue: true,
  resolved_at: null,
  resolved_by: null,
  resolved_within_deadline: null,
  image: {
    kind: 'report',
    evidence_id: null,
    appeal_id: null,
    url: 'https://example.test/cara.jpg',
  },
  report: {
    id: 50,
    number: 9,
    description: 'Vereda rota',
    category: 'vereda',
    status: 'reportado',
    address: 'San Martín 100',
    municipality: { id: 3, city: 'Villa María', province: 'Córdoba' },
  },
  reporter: null,
}

/** La bandeja por contenido; las solicitudes por dato personal, vacías salvo que se pidan. */
function stubInbox(
  entries: ModerationInboxEntry[] = [entry()],
  privacy: unknown[] = [],
) {
  return vi
    .spyOn(apiClient, 'get')
    .mockImplementation(async (url: string, config?: RequestConfig) => {
      const state = (config?.params as { state?: string } | undefined)?.state
      const results =
        url === endpoints.privacyRequests.list
          ? state === 'resolved'
            ? []
            : privacy
          : url === endpoints.moderation.resolved
            ? []
            : entries
      return {
        data: { count: results.length, next: null, previous: null, results },
      } as never
    })
}

beforeEach(() => {
  stubInbox()
})

describe('ModerationInboxPage', () => {
  it('CP-049-P02 (US-049 E1, E2) · una fila por reporte con todas sus denuncias', async () => {
    renderWithProviders(<ModerationInboxPage />)

    const row = await screen.findByRole('row', { name: /Reporte #7/ })
    expect(within(row).getByRole('img', { name: t.reportPhoto })).toHaveAttribute(
      'src',
      'https://example.test/bache.jpg',
    )
    expect(within(row).getByText(/Ese bache no existe/)).toBeInTheDocument()
    expect(screen.getByText('Vecina Denunciante')).toBeInTheDocument()
    expect(screen.getByText('Otro Vecino')).toBeInTheDocument()
    // Una sola decisión por reporte, no un par de botones por denuncia.
    expect(screen.getAllByRole('button', { name: t.discard })).toHaveLength(1)
  })

  it('CP-049-P03 (US-049 E3, E5) · descartar avisa que el motivo es público y lo exige', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} } as never)
    const user = userEvent.setup()
    renderWithProviders(<ModerationInboxPage />)

    await user.click(await screen.findByRole('button', { name: t.discard }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(t.publicWarning)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: t.discardConfirm }))
    expect(within(dialog).getByText(t.reasonRequired)).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()

    await user.type(
      within(dialog).getByLabelText(t.reasonLabel),
      'Es una foto de otra ciudad',
    )
    await user.click(within(dialog).getByRole('button', { name: t.discardConfirm }))

    expect(post).toHaveBeenCalledWith(endpoints.moderation.discard(42), {
      reason: 'Es una foto de otra ciudad',
    })
  })

  it('CP-049-P04 (US-049 E4) · desestimar no avisa de publicación y manda el motivo', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} } as never)
    const user = userEvent.setup()
    renderWithProviders(<ModerationInboxPage />)

    await user.click(await screen.findByRole('button', { name: t.dismiss }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByText(t.publicWarning)).toBeNull()
    await user.type(within(dialog).getByLabelText(t.reasonLabel), 'El bache existe')
    await user.click(within(dialog).getByRole('button', { name: t.dismissConfirm }))

    expect(post).toHaveBeenCalledWith(endpoints.moderation.dismiss(42), {
      reason: 'El bache existe',
    })
  })

  it('CP-049-P05 · si otra pestaña resolvió antes, lo dice', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(createApiError(409, 'Ya resuelta'))
    const user = userEvent.setup()
    renderWithProviders(<ModerationInboxPage />)

    await user.click(await screen.findByRole('button', { name: t.dismiss }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(t.reasonLabel), 'Motivo')
    await user.click(within(dialog).getByRole('button', { name: t.dismissConfirm }))

    expect(await screen.findByText(t.alreadyResolved)).toBeInTheDocument()
  })

  it('CP-049-P06 · sin denuncias muestra el estado vacío', async () => {
    stubInbox([])
    renderWithProviders(<ModerationInboxPage />)

    expect(await screen.findByText(t.empty)).toBeInTheDocument()
  })
})

describe('ModerationInboxPage, filtro por tipo (pedido del 21/10)', () => {
  it('CP-049-P20 · «Todas» mezcla los tipos en una sola tabla, la más vieja primero', async () => {
    stubInbox([entry()], [PRIVACY_REQUEST])
    renderWithProviders(<ModerationInboxPage />)

    await screen.findByRole('row', { name: /Reporte #7/ })
    const rows = screen.getAllByRole('row', { name: /Reporte #/ })
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('Reporte #9'),
      expect.stringContaining('Reporte #7'),
    ])
    expect(screen.getAllByRole('table')).toHaveLength(1)
    expect(within(rows[0]).getByText(t.filter.dato_personal)).toBeInTheDocument()
    expect(within(rows[1]).getByText(t.noDeadline)).toBeInTheDocument()
  })

  it('CP-049-P21 · un motivo de contenido se lo pide al servidor y deja afuera dato personal', async () => {
    const get = stubInbox([entry()], [PRIVACY_REQUEST])
    const user = userEvent.setup()
    renderWithProviders(<ModerationInboxPage />)

    await screen.findByRole('row', { name: /Reporte #9/ })
    await user.click(screen.getByRole('combobox', { name: t.filterLabel }))
    await user.click(
      await screen.findByRole('option', { name: t.filter.reporte_falso }),
    )

    await vi.waitFor(() =>
      expect(get).toHaveBeenCalledWith(endpoints.moderation.list, {
        params: expect.objectContaining({ reason: 'reporte_falso' }),
      }),
    )
    expect(screen.queryByRole('row', { name: /Reporte #9/ })).toBeNull()
  })

  it('CP-049-P22 · dato personal muestra solo esas solicitudes, desde la URL', async () => {
    const get = stubInbox([entry()], [PRIVACY_REQUEST])
    renderWithProviders(<ModerationInboxPage />, {
      route: '/denuncias?tipo=dato_personal',
    })

    expect(await screen.findByRole('row', { name: /Reporte #9/ })).toBeInTheDocument()
    expect(screen.queryByRole('row', { name: /Reporte #7/ })).toBeNull()
    expect(get).not.toHaveBeenCalledWith(endpoints.moderation.list, expect.anything())
  })

  it('CP-049-P23 · las resueltas por contenido muestran la decisión y quién la tomó', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      const results =
        url === endpoints.moderation.resolved
          ? [
              {
                id: 1,
                outcome: 'desestimado',
                outcome_label: 'Denuncias desestimadas',
                reason: 'El bache existe',
                decided_by: { id: 2, name: 'Agente Villa María', avatar: null },
                created_at: '2026-10-05T12:00:00Z',
                reverted_at: null,
                reverted_by: null,
                received_at: '2026-10-02T12:00:00Z',
                report: {
                  ...entry(),
                  municipality: { id: 3, city: 'Villa María', province: 'Córdoba' },
                },
                complaints: entry().complaints,
              },
            ]
          : []
      return { data: { count: results.length, results } } as never
    })
    const user = userEvent.setup()
    renderWithProviders(<ModerationInboxPage />)

    await user.click(await screen.findByRole('tab', { name: t.tabResolved }))

    const row = await screen.findByRole('row', { name: /Reporte #7/ })
    expect(within(row).getByText('Denuncias desestimadas')).toBeInTheDocument()
    expect(within(row).getByText(/Agente Villa María/)).toBeInTheDocument()
    expect(within(row).getByText(/El bache existe/)).toBeInTheDocument()
  })
})
