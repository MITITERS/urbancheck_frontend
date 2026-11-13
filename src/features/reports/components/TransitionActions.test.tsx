import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { apiClient, createApiError } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { TransitionActions } from './TransitionActions'
import { REPORT_STATUSES, type AvailableTransition } from '../types'

/**
 * Lo que el panel puede hacer sobre un reporte en gestión o pendiente de
 * confirmación. Desde US-046 no son todas del mismo estado de origen: el
 * componente renderiza lo que el backend le pasa, sin preguntarse de dónde sale.
 */
const PANEL_TRANSITIONS: AvailableTransition[] = [
  {
    operation: 'confirmar_resolucion_municipal',
    target: REPORT_STATUSES.RESOLVED,
    requires_reason: false,
    requires_area: false,
  },
  {
    operation: 'cancelar',
    target: REPORT_STATUSES.CANCELLED,
    requires_reason: true,
    requires_area: false,
  },
  {
    operation: 'archivar',
    target: REPORT_STATUSES.ARCHIVED,
    requires_reason: false,
    requires_area: false,
  },
]

/** La única transición que exige área: asignarla es empezar la gestión. */
const PROCESS: AvailableTransition = {
  operation: 'procesar',
  target: REPORT_STATUSES.IN_PROGRESS,
  requires_reason: false,
  requires_area: true,
}

const OBRAS = {
  id: 9,
  name: 'Obras Públicas',
  contact_email: 'obras@muni.gob.ar',
  contact_phone: '3534123456',
  is_active: true,
  report_count: 0,
  operator_count: 0,
  municipality: null,
  created_at: '2026-08-01T10:00:00Z',
}

/** Responde el listado de áreas activas que consume el selector (US-028). */
function stubAreas(areas: (typeof OBRAS)[]) {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: areas })
}

describe('TransitionActions', () => {
  it('renders only the transitions the backend offers', () => {
    renderWithProviders(
      <TransitionActions reportId={1} transitions={PANEL_TRANSITIONS} />,
    )

    expect(
      screen.getByRole('button', {
        name: messages.transitions.confirmar_resolucion_municipal.label,
      }),
    ).toBeInTheDocument()
    // "Comenzar gestión" no aplica a un reporte En proceso: no se dibuja.
    expect(
      screen.queryByRole('button', { name: messages.transitions.procesar.label }),
    ).not.toBeInTheDocument()
  })

  it('asks for confirmation before running a transition', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} })
    const user = userEvent.setup()

    renderWithProviders(
      <TransitionActions reportId={7} transitions={PANEL_TRANSITIONS} />,
    )
    await user.click(
      screen.getByRole('button', {
        name: messages.transitions.confirmar_resolucion_municipal.label,
      }),
    )

    expect(post).not.toHaveBeenCalled()
    await user.click(
      await screen.findByRole('button', {
        name: messages.transitions.confirmar_resolucion_municipal.label,
        // El botón del diálogo, no el de la lista.
        hidden: false,
      }),
    )

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/panel/reports/7/confirm-resolution/', {}),
    )
  })

  it('refuses to cancel without a reason and sends it once written', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} })
    const user = userEvent.setup()

    renderWithProviders(
      <TransitionActions reportId={7} transitions={PANEL_TRANSITIONS} />,
    )
    await user.click(
      screen.getByRole('button', { name: messages.transitions.cancelar.label }),
    )
    const confirmButton = (
      await screen.findAllByRole('button', {
        name: messages.transitions.cancelar.label,
      })
    ).at(-1)!
    await user.click(confirmButton)

    expect(
      await screen.findByText('Indicá el motivo para poder continuar.'),
    ).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()

    await user.type(
      screen.getByLabelText(messages.reportDetail.reasonLabel),
      'Obra ya ejecutada',
    )
    await user.click(confirmButton)

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/panel/reports/7/cancel/', {
        reason: 'Obra ya ejecutada',
      }),
    )
  })

  it('procesar exige el área y la manda con la transición', async () => {
    // US-028: no hay forma de pasar a En proceso sin asignar un área, así que
    // el diálogo la pide en el mismo paso en vez de abrir una segunda pantalla.
    stubAreas([OBRAS])
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} })
    const user = userEvent.setup()

    renderWithProviders(<TransitionActions reportId={7} transitions={[PROCESS]} />)
    await user.click(
      screen.getByRole('button', { name: messages.transitions.procesar.label }),
    )
    const confirmButton = (
      await screen.findAllByRole('button', {
        name: messages.transitions.procesar.label,
      })
    ).at(-1)!
    await user.click(confirmButton)

    expect(
      await screen.findByText(messages.reportDetail.areaRequired),
    ).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()

    await user.click(await screen.findByLabelText(messages.reportDetail.areaLabel))
    await user.click(await screen.findByRole('option', { name: OBRAS.name }))
    await user.click(confirmButton)

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/panel/reports/7/process/', {
        area_id: OBRAS.id,
      }),
    )
  })

  it('sin áreas registradas la acción se ofrece deshabilitada', async () => {
    // Escenario 4 de US-028: el agente tiene que enterarse de que primero hay
    // que registrar un área, no chocarse con un desplegable vacío.
    stubAreas([])

    renderWithProviders(<TransitionActions reportId={7} transitions={[PROCESS]} />)

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: messages.transitions.procesar.label }),
      ).toBeDisabled(),
    )
  })

  it('reports a conflict when the report moved underneath the agent', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      createApiError(409, 'Estado desactualizado'),
    )
    const user = userEvent.setup()

    renderWithProviders(
      <TransitionActions reportId={7} transitions={PANEL_TRANSITIONS} />,
    )
    await user.click(
      screen.getByRole('button', { name: messages.transitions.archivar.label }),
    )
    const confirmButton = (
      await screen.findAllByRole('button', {
        name: messages.transitions.archivar.label,
      })
    ).at(-1)!
    await user.click(confirmButton)

    expect(await screen.findByText(messages.reportDetail.conflict)).toBeInTheDocument()
  })
})
