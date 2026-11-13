import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { messages } from '@/config/messages'
import { StatusHistory } from './StatusHistory'
import { REPORT_STATUSES, type StatusHistoryEntry } from '../types'

/**
 * Historial de cambios de estado (US-013, escenario 7).
 *
 * Es la trazabilidad del reclamo: quién lo movió, cuándo, y por qué cuando hizo
 * falta un motivo.
 */

const labels = messages.reportDetail

const AGENT = { id: 7, name: 'Ana Agente', avatar: null }

const HISTORY: StatusHistoryEntry[] = [
  {
    previous_status: '',
    status: REPORT_STATUSES.PENDING_VALIDATION,
    changed_by: null,
    reason: '',
    origin: '',
    confirmation_count: null,
    created_at: '2026-08-20T12:00:00Z',
  },
  {
    previous_status: REPORT_STATUSES.REPORTED,
    status: REPORT_STATUSES.IN_PROGRESS,
    changed_by: AGENT,
    reason: '',
    origin: 'manual',
    confirmation_count: null,
    created_at: '2026-08-21T09:30:00Z',
  },
  {
    previous_status: REPORT_STATUSES.IN_PROGRESS,
    status: REPORT_STATUSES.CANCELLED,
    changed_by: AGENT,
    reason: 'El bache ya lo reparó la empresa de gas.',
    origin: 'manual',
    confirmation_count: null,
    created_at: '2026-08-22T15:45:00Z',
  },
]

describe('StatusHistory', () => {
  it('sin movimientos lo dice en lugar de dejar el hueco vacío', () => {
    render(<StatusHistory entries={[]} />)

    expect(screen.getByText(labels.historyEmpty)).toBeInTheDocument()
  })

  it('el primer asiento es el alta, no una transición', () => {
    // Sin estado previo no hay flecha que dibujar: es cuando nació el reporte.
    render(<StatusHistory entries={[HISTORY[0]]} />)

    expect(screen.getByText(labels.initialStatus)).toBeInTheDocument()
  })

  it('cada transición muestra de qué estado a cuál', () => {
    render(<StatusHistory entries={HISTORY} />)

    expect(
      screen.getByText(
        `${messages.reports.status.reportado} → ${messages.reports.status.en_proceso}`,
      ),
    ).toBeInTheDocument()
  })

  it('nombra a quien ejecutó el cambio', () => {
    render(<StatusHistory entries={HISTORY} />)

    expect(screen.getAllByText(new RegExp(AGENT.name)).length).toBeGreaterThan(0)
  })

  it('muestra el motivo cuando la transición lo exigió', () => {
    render(<StatusHistory entries={HISTORY} />)

    expect(
      screen.getByText('El bache ya lo reparó la empresa de gas.'),
    ).toBeInTheDocument()
    // Y solo ahí: las transiciones sin motivo no dibujan la etiqueta.
    expect(screen.getAllByText(`${labels.reason}:`)).toHaveLength(1)
  })

  it('lista un asiento por movimiento', () => {
    render(<StatusHistory entries={HISTORY} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })
})

describe('origen de la transición (US-038)', () => {
  it('nombra la validación colectiva, que no tiene responsable individual', () => {
    // Sin el origen, la entrada quedaba con solo la fecha: nada decía que la
    // había producido la comunidad y no un validador.
    render(
      <StatusHistory
        entries={[
          {
            previous_status: REPORT_STATUSES.PENDING_VALIDATION,
            status: REPORT_STATUSES.REPORTED,
            changed_by: null,
            reason: '',
            origin: 'validacion_colectiva',
            confirmation_count: 10,
            created_at: '2026-08-23T10:00:00Z',
          },
        ]}
      />,
    )

    expect(
      screen.getByText(new RegExp(labels.origin.validacion_colectiva)),
    ).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(labels.collectiveConfirmations(10))),
    ).toBeInTheDocument()
  })

  it('no rotula las transiciones manuales: el nombre ya lo dice', () => {
    render(
      <StatusHistory
        entries={[
          {
            previous_status: REPORT_STATUSES.REPORTED,
            status: REPORT_STATUSES.IN_PROGRESS,
            changed_by: AGENT,
            reason: '',
            origin: 'manual',
            confirmation_count: null,
            created_at: '2026-08-23T10:00:00Z',
          },
        ]}
      />,
    )

    expect(screen.getByText(new RegExp(AGENT.name))).toBeInTheDocument()
    expect(screen.queryByText(/manual/i)).not.toBeInTheDocument()
  })
})

describe('StatusHistory: con qué rol actuó (C-15)', () => {
  const ADMIN = { id: 1, name: 'Admin Plataforma', avatar: null }

  it('marca el cambio que hizo el admin de la plataforma', () => {
    // El admin ejecuta las acciones con las reglas del agente: sin la marca, el
    // asiento no deja ver que no fue el municipio.
    render(
      <StatusHistory
        entries={[
          { ...HISTORY[1], changed_by: ADMIN, changed_by_role: 'admin_plataforma' },
        ]}
      />,
    )

    expect(
      screen.getByText(new RegExp(labels.actedAsPlatformAdmin)),
    ).toBeInTheDocument()
  })

  it('no marca los del agente municipal', () => {
    render(
      <StatusHistory
        entries={[{ ...HISTORY[1], changed_by_role: 'agente_municipal' }]}
      />,
    )

    expect(screen.queryByText(new RegExp(labels.actedAsPlatformAdmin))).toBeNull()
  })
})
