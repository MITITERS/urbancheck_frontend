import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ReportsTable } from './ReportsTable'
import type { OperativeArea, PanelReportRow } from '../types'

/**
 * La fila del listado del panel, con el foco puesto en lo que el Sprint 4 le
 * agregó: el área operativa que se hizo cargo (US-028, escenario 11) y el
 * indicador de comunicación institucional (US-024, escenario 13).
 *
 * Lo que el agente busca de un vistazo son los reclamos **sin** respuesta, así
 * que ese es el estado que la tabla destaca.
 */

const VILLA_MARIA = { id: 3, city: 'Villa María', province: 'Córdoba' }
const OBRAS: OperativeArea = { id: 9, name: 'Obras Públicas', is_active: true }

function row(overrides: Partial<PanelReportRow> = {}): PanelReportRow {
  return {
    id: 42,
    number: 7,
    category: 'bache',
    status: 'en_proceso',
    created_at: '2026-08-20T12:00:00Z',
    address: 'Av. Corrientes 1234',
    latitude: '-32.4',
    longitude: '-63.2',
    like_count: 4,
    photo_status: 'procesada',
    operative_area: OBRAS,
    has_official_response: false,
    municipality: VILLA_MARIA,
    author: { id: 1, name: 'Vecina', avatar: null },
    validation: null,
    closure: null,
    needs_closure_review: false,
    pending_complaint_count: 0,
    ...overrides,
  }
}

/**
 * La fila de la tabla que corresponde a ese reporte.
 *
 * El área y la respuesta oficial se dibujan dos veces —en su columna y, para
 * pantallas medianas, junto a la categoría y al estado— y el CSS decide cuál se
 * ve. jsdom no aplica CSS, así que esas aserciones usan `getAllByText`.
 */
function rowFor(number: number): HTMLElement {
  return screen.getByRole('link', { name: `#${number}` }).closest('tr')!
}

describe('ReportsTable', () => {
  it('CP-049-P13 (US-049 E12) · señala los reportes con denuncias por contenido pendientes', () => {
    renderWithProviders(
      <ReportsTable
        reports={[
          row({ id: 1, number: 1, pending_complaint_count: 2 }),
          row({ id: 2, number: 2 }),
        ]}
      />,
    )

    expect(
      within(rowFor(1)).getByText(messages.moderation.listFlag(2)),
    ).toBeInTheDocument()
    expect(within(rowFor(2)).queryByText(/denuncia/)).toBeNull()
  })

  it('CP-015-P06 (US-015 E3) · señala el cierre que la comparación automática marcó como dudoso', () => {
    renderWithProviders(
      <ReportsTable
        reports={[
          row({
            id: 42,
            number: 7,
            status: 'resuelto_pendiente_confirmacion',
            needs_closure_review: true,
          }),
          row({
            id: 43,
            number: 8,
            status: 'resuelto_pendiente_confirmacion',
            needs_closure_review: false,
            pending_complaint_count: 0,
          }),
        ]}
      />,
    )

    expect(
      within(rowFor(7)).getByText(messages.reports.closureReview),
    ).toBeInTheDocument()
    expect(within(rowFor(8)).queryByText(messages.reports.closureReview)).toBeNull()
  })

  it('marca los reclamos sin comunicación institucional', () => {
    renderWithProviders(
      <ReportsTable reports={[row({ has_official_response: false })]} />,
    )

    expect(
      within(rowFor(7)).getAllByText(messages.reports.unanswered)[0],
    ).toBeInTheDocument()
    expect(within(rowFor(7)).queryByText(messages.reports.answered)).toBeNull()
  })

  it('un reporte ya respondido queda discreto, no marcado', () => {
    renderWithProviders(
      <ReportsTable reports={[row({ has_official_response: true })]} />,
    )

    expect(
      within(rowFor(7)).getAllByText(messages.reports.answered)[0],
    ).toBeInTheDocument()
    expect(within(rowFor(7)).queryByText(messages.reports.unanswered)).toBeNull()
  })

  it('los dos estados se distinguen fila por fila en el mismo listado', () => {
    renderWithProviders(
      <ReportsTable
        reports={[
          row({ id: 42, number: 7, has_official_response: false }),
          row({ id: 43, number: 8, has_official_response: true }),
        ]}
      />,
    )

    expect(
      within(rowFor(7)).getAllByText(messages.reports.unanswered)[0],
    ).toBeInTheDocument()
    expect(
      within(rowFor(8)).getAllByText(messages.reports.answered)[0],
    ).toBeInTheDocument()
  })

  it('muestra el área responsable en el listado, no solo en el detalle', () => {
    // US-028, escenario 11: qué dependencia se hizo cargo se ve de un vistazo.
    renderWithProviders(<ReportsTable reports={[row()]} />)

    expect(within(rowFor(7)).getAllByText(OBRAS.name)[0]).toBeInTheDocument()
  })

  it('la ubicación muestra solo calle y número', () => {
    renderWithProviders(
      <ReportsTable
        reports={[
          row({
            address:
              '527, Corrientes, Centro, Villa María, Municipio de Villa María, Córdoba, 5900, Argentina',
          }),
        ]}
      />,
    )

    expect(within(rowFor(7)).getByText('Corrientes 527')).toBeInTheDocument()
  })

  it('un reporte todavía sin área no deja la celda en blanco', () => {
    renderWithProviders(
      <ReportsTable reports={[row({ status: 'reportado', operative_area: null })]} />,
    )

    expect(within(rowFor(7)).getAllByText('—').length).toBeGreaterThan(0)
  })

  it('el área de un reporte no se pierde cuando la dependencia se desactiva', () => {
    // US-039, escenario 7: el vínculo histórico sobrevive a la baja del área.
    renderWithProviders(
      <ReportsTable
        reports={[row({ operative_area: { ...OBRAS, is_active: false } })]}
      />,
    )

    expect(within(rowFor(7)).getAllByText(OBRAS.name)[0]).toBeInTheDocument()
  })

  it('la columna de respuesta oficial está declarada en el encabezado', () => {
    renderWithProviders(<ReportsTable reports={[row()]} />)

    expect(
      screen.getByRole('columnheader', {
        name: messages.reports.columns.officialResponse,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', {
        name: messages.reports.columns.operativeArea,
      }),
    ).toBeInTheDocument()
  })
})

describe('un reporte que todavía no se publicó (US-042)', () => {
  it('lo marca como sin publicar, para que no se lea como uno más', () => {
    // El panel es la única vista donde aparece: el vecino no lo ve en ningún
    // lado. Sin la marca, el agente lo trataría como cualquier otro reclamo.
    renderWithProviders(<ReportsTable reports={[row({ photo_status: 'pendiente' })]} />)

    expect(screen.getByText(messages.reports.notPublished)).toBeVisible()
  })

  it('no marca los que ya están publicados', () => {
    renderWithProviders(<ReportsTable reports={[row()]} />)

    expect(screen.queryByText(messages.reports.notPublished)).not.toBeInTheDocument()
  })
})
