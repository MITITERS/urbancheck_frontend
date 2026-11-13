import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { OfficialResponses } from './OfficialResponses'
import type { PanelReportDetail } from '../types'

const VILLA_MARIA = { id: 3, city: 'Villa María', province: 'Córdoba' }

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
    status: 'reportado',
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
    operational_area: null,
    area_assigned_at: null,
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
    can_publish_official_response: true,
    ...overrides,
  }
}

const FIRST = {
  id: 1,
  text: 'Vamos a repararlo en 15 días.',
  created_at: '2026-08-21T09:00:00Z',
  author: { id: 5, name: 'Agente Uno', avatar: null },
  municipality: VILLA_MARIA,
}

describe('OfficialResponses', () => {
  it('publica una respuesta y la manda al endpoint del hilo', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: detail() })
    const user = userEvent.setup()

    renderWithProviders(<OfficialResponses report={detail()} />)
    await user.type(
      screen.getByLabelText(messages.reportDetail.officialResponseLabel),
      'Vamos a repararlo.',
    )
    await user.click(
      screen.getByRole('button', {
        name: messages.reportDetail.officialResponsePublish,
      }),
    )

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/panel/reports/42/official-responses/', {
        text: 'Vamos a repararlo.',
      }),
    )
  })

  it('no publica una respuesta vacía', async () => {
    // Escenario 9: el backend la rechaza igual; esto evita el viaje.
    const post = vi.spyOn(apiClient, 'post')
    const user = userEvent.setup()

    renderWithProviders(<OfficialResponses report={detail()} />)
    await user.click(
      screen.getByRole('button', {
        name: messages.reportDetail.officialResponsePublish,
      }),
    )

    expect(
      await screen.findByText(messages.reportDetail.officialResponseRequired),
    ).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('el hilo muestra cada respuesta con su agente y su fecha', async () => {
    // Escenario 12: la identidad individual se ve solo en el panel.
    renderWithProviders(
      <OfficialResponses report={detail({ official_responses: [FIRST] })} />,
    )

    expect(screen.getByText(FIRST.text)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(FIRST.author.name))).toBeInTheDocument()
    expect(screen.getByText(VILLA_MARIA.city)).toBeInTheDocument()
  })

  it('la respuesta no lleva filete de un solo lado', () => {
    // El borde izquierdo rompía la esquina redondeada por la que pasaba y
    // corría el contenido respecto del margen opuesto. Mismo criterio que las
    // tarjetas del hilo de resolución.
    renderWithProviders(
      <OfficialResponses report={detail({ official_responses: [FIRST] })} />,
    )

    const card = screen.getByText(FIRST.text).closest('li')
    expect(card?.className).not.toMatch(/border-l/)
  })

  it('no ofrece editar ni eliminar una respuesta publicada', () => {
    // Escenario 3: la inmutabilidad se sostiene en la ausencia de la acción.
    renderWithProviders(
      <OfficialResponses report={detail({ official_responses: [FIRST] })} />,
    )

    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(
      screen.getByRole('button', {
        name: messages.reportDetail.officialResponsePublish,
      }),
    ).toBeInTheDocument()
  })

  it('en un estado no habilitado no ofrece el formulario', () => {
    // Escenarios 5 y 6: quién puede publicar lo decide el servidor.
    renderWithProviders(
      <OfficialResponses
        report={detail({
          status: 'resuelto',
          can_publish_official_response: false,
          official_responses: [FIRST],
        })}
      />,
    )

    expect(
      screen.queryByRole('button', {
        name: messages.reportDetail.officialResponsePublish,
      }),
    ).not.toBeInTheDocument()
    // Las ya publicadas siguen visibles.
    expect(screen.getByText(FIRST.text)).toBeInTheDocument()
  })
})
