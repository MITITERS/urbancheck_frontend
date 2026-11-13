import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { PanelReportRow } from '@/features/reports/types'
import { OperatorLink } from './OperatorLink'

/**
 * El perfil del operario, detrás de su nombre en el panel.
 *
 * Lo alcanzan el agente y el administrador, que son quienes entran acá. Lo que
 * se lista no es lo que esa persona reportó —eso es el perfil del vecino— ni lo
 * que decidió —eso es el del validador— sino lo que **cerró** en terreno.
 */

const labels = messages.operatorProfile
const OPERATOR = { id: 9, name: 'Ramiro Paz', avatar: null }

function row(overrides: Partial<PanelReportRow> = {}): PanelReportRow {
  return {
    id: 7,
    number: 12,
    category: 'bache',
    status: 'resuelto',
    created_at: '2026-08-20T12:00:00Z',
    address: 'Av. Corrientes 1234, Villa María, Córdoba, Argentina',
    latitude: '-32.4',
    longitude: '-63.2',
    like_count: 0,
    photo_status: 'procesada',
    operative_area: null,
    has_official_response: false,
    municipality: null,
    author: { id: 1, name: 'Vecina', avatar: null },
    validation: null,
    closure: { closed_at: '2026-09-05T10:00:00Z' },
    needs_closure_review: false,
    pending_complaint_count: 0,
    ...overrides,
  }
}

function listing(rows: PanelReportRow[]) {
  return vi
    .spyOn(apiClient, 'get')
    .mockResolvedValue({ data: { count: rows.length, results: rows } })
}

async function openProfile() {
  const user = userEvent.setup()
  renderWithProviders(<OperatorLink operator={OPERATOR} />)
  await user.click(screen.getByRole('button', { name: OPERATOR.name }))
  return user
}

beforeEach(() => vi.restoreAllMocks())

describe('OperatorLink', () => {
  it('no pide nada hasta que se abre el perfil', () => {
    // Un hilo de resolución puede nombrar al mismo operario dos veces —cierre,
    // apelación, segundo cierre—: traer su actividad por cada mención sería
    // una request por nombre en pantalla.
    const get = listing([])

    renderWithProviders(<OperatorLink operator={OPERATOR} />)

    expect(get).not.toHaveBeenCalled()
  })

  it('pide lo que cerró ese operario, no lo que reportó ni lo que decidió', async () => {
    const get = listing([row()])

    await openProfile()

    expect(get).toHaveBeenCalledWith('/api/panel/reports/', {
      params: { closed_by: OPERATOR.id },
    })
  })

  it('cada fila dice cuándo la cerró esta persona', async () => {
    listing([row()])

    await openProfile()

    expect(await screen.findByText(labels.closedOn('05/09/2026'))).toBeInTheDocument()
  })

  it('muestra el estado actual y no el del momento del cierre', async () => {
    // Objetado por el vecino (US-048): volvió a gestión, y esconderlo detrás de
    // un "resuelto" le taparía al municipio el trabajo que rebotó.
    listing([row({ status: 'en_proceso' })])

    await openProfile()

    expect(
      await screen.findByText(messages.reports.status.en_proceso),
    ).toBeInTheDocument()
  })

  it('resume en qué terminaron sus cierres', async () => {
    listing([
      row({ id: 7, status: 'resuelto' }),
      row({ id: 8, status: 'resuelto_pendiente_confirmacion' }),
      row({ id: 9, status: 'en_proceso' }),
    ])

    await openProfile()

    expect(await screen.findByText(labels.counts(1, 1, 1))).toBeInTheDocument()
  })

  it('sin cierres en la jurisdicción lo dice', async () => {
    listing([])

    await openProfile()

    expect(await screen.findByText(labels.empty)).toBeInTheDocument()
  })

  it('cada fila lleva al detalle del reporte', async () => {
    listing([row()])

    await openProfile()

    expect(
      await screen.findByRole('link', { name: labels.openReport }),
    ).toHaveAttribute('href', '/reportes/7')
  })
})
