import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ObjectionDeadline, ResolutionThread } from './ResolutionThread'
import type { PanelReportDetail, ResolutionAppeal, ResolutionEvidence } from '../types'

const VILLA_MARIA = { id: 3, city: 'Villa María', province: 'Córdoba' }
const OBRAS = { id: 9, name: 'Obras Públicas', is_active: true }
const OPERATOR = { id: 21, name: 'Ramón Operario', avatar: null }

function evidence(overrides: Partial<ResolutionEvidence> = {}): ResolutionEvidence {
  return {
    id: 1,
    photo: 'https://example.test/work.jpg',
    photo_removed_at: null,
    photo_status: 'procesada',
    description: 'Se rellenó el bache con asfalto en frío.',
    created_at: '2026-09-01T10:00:00Z',
    operator: OPERATOR,
    operational_area: OBRAS,
    latitude: '-32.41',
    longitude: '-63.24',
    comparison: null,
    ...overrides,
  }
}

function appeal(overrides: Partial<ResolutionAppeal> = {}): ResolutionAppeal {
  return {
    id: 1,
    photo: 'https://example.test/appeal.jpg',
    photo_removed_at: null,
    photo_status: 'procesada',
    reason: 'El bache sigue igual que antes.',
    created_at: '2026-09-02T10:00:00Z',
    author: { id: 1, name: 'Vecina', avatar: null },
    evidence: evidence(),
    ...overrides,
  }
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
    status: 'resuelto_pendiente_confirmacion',
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
    official_responses: [],
    can_publish_official_response: false,
    resolution_evidences: [evidence()],
    resolution_appeals: [],
    closed_at: '2026-09-01T10:00:00Z',
    objection_deadline: '2026-09-08T10:00:00Z',
    appeal_count: 0,
    complaints: [],
    pending_complaint_count: 0,
    moderation: null,
    ...overrides,
  }
}

describe('ResolutionThread', () => {
  it('CP-043-P01 (US-043 E11) · una foto de cierre retirada deja el aviso y conserva el parte (US-043)', () => {
    renderWithProviders(
      <ResolutionThread
        report={detail({
          resolution_evidences: [
            evidence({ photo: null, photo_removed_at: '2026-09-03T10:00:00Z' }),
          ],
        })}
      />,
    )

    expect(screen.getByText(messages.reportDetail.photoRemoved)).toBeInTheDocument()
    expect(screen.getByText(/Se rellenó el bache/)).toBeInTheDocument()
  })

  it('CP-043-P02 (US-043 E11) · una foto de objeción retirada deja el aviso y conserva el motivo (US-043)', () => {
    renderWithProviders(
      <ResolutionThread
        report={detail({
          resolution_appeals: [
            appeal({ photo: null, photo_removed_at: '2026-09-03T10:00:00Z' }),
          ],
        })}
      />,
    )

    expect(screen.getByText(messages.reportDetail.photoRemoved)).toBeInTheDocument()
    expect(screen.getByText(/El bache sigue igual/)).toBeInTheDocument()
  })

  it('muestra el parte de trabajo con su área', () => {
    renderWithProviders(<ResolutionThread report={detail()} />)

    expect(screen.getByText(/Se rellenó el bache/)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(OBRAS.name))).toBeInTheDocument()
  })

  it('el panel sí ve al operario que ejecutó el cierre', () => {
    // Escenario 13 de US-046: es lo que permite auditar el trabajo. Ante el
    // ciudadano responde el área, y eso lo resuelve el serializer público.
    renderWithProviders(<ResolutionThread report={detail()} />)

    expect(screen.getByText(new RegExp(OPERATOR.name))).toBeInTheDocument()
  })

  it('su nombre abre el perfil, como el del vecino y el del validador', async () => {
    // El agente y el administrador llegan al operario por el mismo camino por
    // el que llegan a las otras dos personas del reporte: su nombre.
    const user = userEvent.setup()
    renderWithProviders(<ResolutionThread report={detail()} />)

    await user.click(screen.getByRole('button', { name: OPERATOR.name }))

    expect(
      await screen.findByText(messages.operatorProfile.closures),
    ).toBeInTheDocument()
  })

  it('las dos fotos arrancan en la misma columna', () => {
    // El cierre y la objeción son dos versiones del mismo lugar: la gracia es
    // poder compararlas, y con una corrida respecto de la otra no se puede.
    // Antes la objeción iba sangrada y la imagen pegada al borde, dos píxeles
    // corrida por el filete lateral.
    renderWithProviders(
      <ResolutionThread report={detail({ resolution_appeals: [appeal()] })} />,
    )

    // Las fotos son decorativas (`alt=""`), así que no tienen rol accesible:
    // se buscan por etiqueta.
    const [closure, objection] = Array.from(document.querySelectorAll('img'))
    const container = (node: Element) => node.parentElement as HTMLElement

    // Misma envoltura con el mismo padding, y ninguna tarjeta sangrada.
    expect(container(closure).className).toBe(container(objection).className)
    expect(closure.closest('article')?.className).not.toMatch(/\bml-/)
    expect(objection.closest('article')?.className).not.toMatch(/\bml-/)
  })

  it('ninguna tarjeta lleva filete de un solo lado', () => {
    // El borde izquierdo rompía la esquina redondeada y corría el contenido.
    renderWithProviders(
      <ResolutionThread report={detail({ resolution_appeals: [appeal()] })} />,
    )

    for (const card of screen.getAllByRole('article')) {
      expect(card.className).not.toMatch(/border-l/)
    }
  })

  it('sin cierre registrado lo dice en lugar de dejar el hueco', () => {
    renderWithProviders(
      <ResolutionThread report={detail({ resolution_evidences: [] })} />,
    )

    expect(screen.getByText(messages.reportDetail.resolutionEmpty)).toBeInTheDocument()
  })

  it('conserva los dos cierres cuando hubo una apelación', () => {
    // Escenario 9 de US-048: el segundo cierre no pisa al primero, y la gracia
    // es poder compararlos.
    const first = evidence({ id: 1, description: 'Primer intento.' })
    const second = evidence({ id: 2, description: 'Segundo intento.' })

    renderWithProviders(
      <ResolutionThread
        report={detail({
          resolution_evidences: [first, second],
          resolution_appeals: [appeal({ evidence: first })],
        })}
      />,
    )

    expect(screen.getByText('Primer intento.')).toBeInTheDocument()
    expect(screen.getByText('Segundo intento.')).toBeInTheDocument()
    expect(screen.getByText(/El bache sigue igual/)).toBeInTheDocument()
  })

  it('la objeción cuelga del cierre que objetó, no de la lista suelta', () => {
    const first = evidence({ id: 1, description: 'Primer intento.' })
    const second = evidence({ id: 2, description: 'Segundo intento.' })

    renderWithProviders(
      <ResolutionThread
        report={detail({
          resolution_evidences: [first, second],
          resolution_appeals: [appeal({ evidence: second })],
        })}
      />,
    )

    // La objeción aparece una sola vez, bajo el cierre correspondiente.
    expect(screen.getAllByText(messages.reportDetail.appeal)).toHaveLength(1)
  })
})

describe('ResolutionThread, comparación automática (US-015)', () => {
  const comparison = {
    status: 'completada' as const,
    is_doubtful: false,
    explanation: 'Explicación.',
    model_name: 'gemini-3.8-flash',
    requested_at: '2026-09-01T10:00:00Z',
    completed_at: '2026-09-01T10:00:05Z',
  }

  it('CP-015-P08 (US-015 E7) · después de una objeción se ven los veredictos de los dos cierres', () => {
    const first = evidence({
      id: 1,
      comparison: { ...comparison, verdict: 'problema_persistente', is_doubtful: true },
    })
    const second = evidence({
      id: 2,
      comparison: { ...comparison, verdict: 'consistente' },
    })

    renderWithProviders(
      <ResolutionThread
        report={detail({
          photo: 'https://example.test/report.jpg',
          resolution_evidences: [first, second],
          resolution_appeals: [appeal({ evidence: first })],
        })}
      />,
    )

    const verdicts = messages.reportDetail.comparison.verdict
    expect(screen.getByText(verdicts.problema_persistente)).toBeInTheDocument()
    expect(screen.getByText(verdicts.consistente)).toBeInTheDocument()
    // Los dos se comparan contra la foto original del reporte.
    for (const img of screen.getAllByRole('img', {
      name: messages.reportDetail.comparison.before,
    })) {
      expect(img).toHaveAttribute('src', 'https://example.test/report.jpg')
    }
  })

  it('un cierre sin comparación no dibuja la tarjeta', () => {
    renderWithProviders(<ResolutionThread report={detail()} />)

    expect(screen.queryByText(messages.reportDetail.comparison.title)).toBeNull()
  })
})

describe('ObjectionDeadline', () => {
  it('muestra hasta cuándo el vecino puede objetar', () => {
    renderWithProviders(<ObjectionDeadline report={detail()} />)

    expect(screen.getByText(/puede objetar el cierre hasta/)).toBeInTheDocument()
  })

  it('no dibuja nada cuando no corre ningún plazo', () => {
    renderWithProviders(
      <ObjectionDeadline report={detail({ objection_deadline: null })} />,
    )

    expect(screen.queryByText(/puede objetar el cierre hasta/)).toBeNull()
  })
})
