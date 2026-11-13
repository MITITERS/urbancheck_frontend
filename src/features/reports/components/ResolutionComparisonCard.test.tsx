import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ResolutionComparisonCard } from './ResolutionComparisonCard'
import type { ComparisonStatus, ResolutionComparison } from '../types'

/**
 * La comparación automática del cierre (US-015).
 *
 * Lo que no puede faltar nunca es la aclaración de que es una sugerencia: el
 * veredicto no decide nada sobre el reporte.
 */

const copy = messages.reportDetail.comparison
const ORIGINAL = 'https://example.test/report.jpg'
const CLOSURE = 'https://example.test/work.jpg'

function comparison(
  overrides: Partial<ResolutionComparison> = {},
): ResolutionComparison {
  return {
    status: 'completada',
    verdict: 'consistente',
    is_doubtful: false,
    explanation: 'El bache ya no se ve y el asfalto es nuevo.',
    model_name: 'gemini-3.8-flash',
    requested_at: '2026-09-01T10:00:00Z',
    completed_at: '2026-09-01T10:00:05Z',
    ...overrides,
  }
}

function renderCard(overrides: Partial<ResolutionComparison> = {}) {
  renderWithProviders(
    <ResolutionComparisonCard
      comparison={comparison(overrides)}
      originalPhoto={ORIGINAL}
      resolutionPhoto={CLOSURE}
    />,
  )
}

describe('ResolutionComparisonCard', () => {
  it('CP-015-P01 (US-015 E2 y E9) · muestra el veredicto consistente con la explicación del modelo', () => {
    renderCard()

    expect(screen.getByText(copy.verdict.consistente)).toBeInTheDocument()
    expect(
      screen.getByText('El bache ya no se ve y el asfalto es nuevo.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/gemini-3\.8-flash/)).toBeInTheDocument()
  })

  it('CP-015-P02 (US-015 E2) · pone las dos fotos lado a lado', () => {
    renderCard()

    expect(screen.getByRole('img', { name: copy.before })).toHaveAttribute(
      'src',
      ORIGINAL,
    )
    expect(screen.getByRole('img', { name: copy.after })).toHaveAttribute(
      'src',
      CLOSURE,
    )
  })

  it('CP-015-P03 (US-015 E4) · se presenta como sugerencia y no como determinación', () => {
    renderCard({ verdict: 'problema_persistente', is_doubtful: true })

    expect(screen.getByText(copy.disclaimer)).toBeInTheDocument()
  })

  it.each([
    ['problema_persistente' as const],
    ['lugar_distinto' as const],
    ['trabajo_incoherente' as const],
  ])(
    'CP-015-P04 (US-015 E3) · dice qué mirar en un veredicto dudoso: %s',
    (verdict) => {
      renderCard({ verdict, is_doubtful: true })

      expect(screen.getByText(copy.verdict[verdict])).toBeInTheDocument()
    },
  )

  it.each<[ComparisonStatus]>([['pendiente'], ['no_disponible'], ['sin_material']])(
    'CP-015-P05 (US-015 E5 y E6) · sin veredicto (%s) lo dice y no muestra ninguno',
    (status) => {
      renderCard({ status, verdict: null, explanation: '', model_name: '' })

      expect(screen.getByText(copy.status[status])).toBeInTheDocument()
      for (const label of Object.values(copy.verdict)) {
        expect(screen.queryByText(label)).toBeNull()
      }
      expect(screen.getByText(copy.disclaimer)).toBeInTheDocument()
    },
  )
})
