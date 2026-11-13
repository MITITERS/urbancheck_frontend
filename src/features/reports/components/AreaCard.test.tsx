import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { AreaCard } from './AreaCard'
import type { OperativeArea, PanelReportDetail } from '../types'

const VILLA_MARIA = { id: 3, city: 'Villa María', province: 'Córdoba' }
const OBRAS: OperativeArea = { id: 9, name: 'Obras Públicas', is_active: true }
const ALUMBRADO: OperativeArea = { id: 10, name: 'Alumbrado', is_active: true }

const AREA_ROW = {
  id: ALUMBRADO.id,
  name: ALUMBRADO.name,
  contact_email: 'luz@muni.gob.ar',
  contact_phone: '3534123456',
  is_active: true,
  report_count: 0,
  operator_count: 0,
  municipality: VILLA_MARIA,
  created_at: '2026-08-01T10:00:00Z',
}

function detail(overrides: Partial<PanelReportDetail> = {}): PanelReportDetail {
  return {
    id: 42,
    number: 7,
    municipality: VILLA_MARIA,
    photo: null,
    photo_removed_at: null,
    photo_status: 'procesada',
    under_privacy_review: false,
    description: 'Bache profundo',
    category: 'bache',
    status: 'en_proceso',
    address: 'Av. Corrientes 1234',
    latitude: '-32.4',
    longitude: '-63.2',
    created_at: '2026-08-20T12:00:00Z',
    updated_at: '2026-08-20T12:00:00Z',
    author: { id: 1, name: 'Vecina', avatar: null },
    like_count: 0,
    comments: [],
    status_history: [],
    available_transitions: [],
    validation: null,
    collective_validation: null,
    operational_area: OBRAS,
    area_assigned_at: '2026-08-21T09:00:00Z',
    area_assignments: [],
    archived_at: null,
    resolution_evidences: [],
    resolution_appeals: [],
    closed_at: null,
    objection_deadline: null,
    appeal_count: 0,
    complaints: [],
    pending_complaint_count: 0,
    moderation: null,
    official_responses: [],
    can_publish_official_response: false,
    ...overrides,
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [AREA_ROW] })
})

describe('AreaCard', () => {
  it('muestra el área responsable y su fecha de asignación', () => {
    renderWithProviders(<AreaCard report={detail()} />)

    expect(screen.getByText(OBRAS.name)).toBeInTheDocument()
  })

  it('reasigna sin mover el estado, por el endpoint que no es transición', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: detail() })
    const user = userEvent.setup()

    renderWithProviders(<AreaCard report={detail()} />)
    await user.click(
      screen.getByRole('button', { name: messages.reportDetail.areaReassign }),
    )
    await user.click(await screen.findByLabelText(messages.reportDetail.areaLabel))
    await user.click(await screen.findByRole('option', { name: ALUMBRADO.name }))
    const confirm = screen
      .getAllByRole('button', { name: messages.reportDetail.areaReassign })
      .at(-1)!
    await user.click(confirm)

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/panel/reports/42/assign-area/', {
        area_id: ALUMBRADO.id,
      }),
    )
  })

  it('no ofrece reasignar fuera de En proceso', () => {
    // Escenario 8: en un estado final el área que intervino es historia.
    renderWithProviders(<AreaCard report={detail({ status: 'resuelto' })} />)

    expect(
      screen.queryByRole('button', { name: messages.reportDetail.areaReassign }),
    ).not.toBeInTheDocument()
    expect(screen.getByText(OBRAS.name)).toBeInTheDocument()
  })

  it('un área desactivada sigue a cargo y se dice', async () => {
    // Escenario 9: el reporte conserva el vínculo aunque el área ya no opere.
    renderWithProviders(
      <AreaCard
        report={detail({ operational_area: { ...OBRAS, is_active: false } })}
      />,
    )

    expect(
      await screen.findByText(messages.reportDetail.areaInactive),
    ).toBeInTheDocument()
  })

  it('sin área asignada lo dice en lugar de dejar el hueco', () => {
    renderWithProviders(
      <AreaCard
        report={detail({
          status: 'reportado',
          operational_area: null,
          area_assigned_at: null,
        })}
      />,
    )

    expect(screen.getByText(messages.reportDetail.areaEmpty)).toBeInTheDocument()
  })
})
