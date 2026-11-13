import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { OperationalArea } from '@/features/areas/types'
import { AreaSelectField } from './AreaSelectField'

/**
 * El selector de área, compartido por procesar (US-028, escenario 1) y por
 * reasignar (escenario 5).
 *
 * Es donde viven dos reglas de la historia que no son del backend: que solo se
 * ofrezcan áreas activas (escenario 3) y que una municipalidad sin áreas vea
 * qué le falta y cómo resolverlo, en lugar de un desplegable vacío
 * (escenario 4).
 */

function area(overrides: Partial<OperationalArea> = {}): OperationalArea {
  return {
    id: 9,
    name: 'Obras Públicas',
    contact_email: 'obras@muni.gob.ar',
    contact_phone: '3534123456',
    is_active: true,
    report_count: 0,
    operator_count: 0,
    municipality: { id: 3, city: 'Villa María', province: 'Córdoba' },
    created_at: '2026-08-01T10:00:00Z',
    ...overrides,
  } as OperationalArea
}

function renderField(areas: OperationalArea[], error: string | null = null) {
  const onChange = vi.fn()
  renderWithProviders(
    <AreaSelectField areas={areas} value="" onChange={onChange} error={error} />,
  )
  return { onChange }
}

describe('AreaSelectField', () => {
  it('ofrece las áreas que recibió y avisa cuál eligió', async () => {
    const user = userEvent.setup()
    const { onChange } = renderField([
      area(),
      area({ id: 10, name: 'Alumbrado Público' }),
    ])

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Alumbrado Público' }))

    expect(onChange).toHaveBeenCalledWith('10')
  })

  it('sin áreas registradas explica qué falta en lugar de un desplegable vacío', () => {
    // Escenario 4: el agente se entera de que primero hay que registrar un área.
    renderField([])

    expect(screen.getByText(messages.reportDetail.noAreas)).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('y lleva directo a la gestión de áreas para resolverlo', () => {
    renderField([])

    expect(
      screen.getByRole('link', { name: messages.reportDetail.manageAreas }),
    ).toHaveAttribute('href', '/areas')
  })

  it('marca el campo cuando se confirmó sin elegir área', () => {
    // Escenario 2: el área es obligatoria, y el error se ve en el campo.
    renderField([area()], 'Elegí un área operativa')

    expect(screen.getByText('Elegí un área operativa')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('sin error el campo no arranca marcado', () => {
    renderField([area()])

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'false')
  })
})
