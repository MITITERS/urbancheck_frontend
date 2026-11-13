import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { PanelReportRow } from '@/features/reports/types'
import { ValidatorLink } from './ValidatorLink'

/**
 * El perfil del validador, detrás de su nombre en el detalle de un reporte.
 *
 * Lo que se lista no es lo que esa persona reportó —eso es el perfil del
 * vecino— sino lo que **decidió** en terreno.
 */

const labels = messages.validatorProfile
const VALIDATOR = { id: 5, name: 'Marcos Vera', avatar: null }

function row(overrides: Partial<PanelReportRow> = {}): PanelReportRow {
  return {
    id: 7,
    number: 12,
    category: 'bache',
    status: 'reportado',
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
    validation: {
      validator: null,
      decided_at: '2026-08-21T09:00:00Z',
      outcome: 'validado',
    },
    // Solo viaja al filtrar por operario; en el perfil del validador va nulo.
    closure: null,
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
  renderWithProviders(<ValidatorLink validator={VALIDATOR} />)
  await user.click(screen.getByRole('button', { name: VALIDATOR.name }))
  return user
}

beforeEach(() => vi.restoreAllMocks())

describe('ValidatorLink', () => {
  it('no pide nada hasta que se abre el perfil', () => {
    // Un historial puede nombrar al mismo validador varias veces: traer su
    // actividad por cada mención sería una request por nombre en pantalla.
    const get = listing([])

    renderWithProviders(<ValidatorLink validator={VALIDATOR} />)

    expect(get).not.toHaveBeenCalled()
  })

  it('pide lo que decidió ese validador, no lo que reportó', async () => {
    const get = listing([row()])

    await openProfile()

    expect(get).toHaveBeenCalledWith('/api/panel/reports/', {
      params: { validated_by: VALIDATOR.id },
    })
  })

  it('dice de cada reporte si lo validó o lo rechazó', async () => {
    listing([
      row({ id: 7, number: 12 }),
      row({
        id: 8,
        number: 13,
        status: 'cancelado',
        validation: {
          validator: null,
          decided_at: '2026-08-22T09:00:00Z',
          outcome: 'rechazado',
        },
      }),
    ])

    await openProfile()

    expect(await screen.findByText(labels.outcome.validado)).toBeInTheDocument()
    expect(screen.getByText(labels.outcome.rechazado)).toBeInTheDocument()
  })

  it('separa lo que decidió el validador de cómo terminó el reporte', async () => {
    // Validado por él, cancelado después por el municipio: sin distinguirlos,
    // el perfil le atribuiría un rechazo que no hizo.
    listing([row({ status: 'cancelado' })])

    await openProfile()

    expect(await screen.findByText(labels.outcome.validado)).toBeInTheDocument()
    expect(screen.getByText(messages.reports.status.cancelado)).toBeInTheDocument()
  })

  it('resume cuántos validó y cuántos rechazó', async () => {
    listing([
      row({ id: 7 }),
      row({
        id: 8,
        validation: {
          validator: null,
          decided_at: '2026-08-22T09:00:00Z',
          outcome: 'rechazado',
        },
      }),
    ])

    await openProfile()

    expect(await screen.findByText(labels.counts(1, 1))).toBeInTheDocument()
  })

  it('sin decisiones en la jurisdicción lo dice', async () => {
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
