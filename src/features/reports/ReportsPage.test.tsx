import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ReportsPage } from './ReportsPage'
import type { PanelReportRow } from './types'

const ROW: PanelReportRow = {
  id: 42,
  // El id global es 42 y el número dentro del municipio es el 7: distintos a
  // propósito, para que ningún test pase por coincidencia.
  number: 7,
  category: 'bache',
  status: 'reportado',
  created_at: '2026-08-20T12:00:00Z',
  address: 'Av. Corrientes 1234',
  latitude: '-32.4',
  longitude: '-63.2',
  like_count: 5,
  photo_status: 'procesada',
  operative_area: null,
  has_official_response: false,
  municipality: { id: 3, city: 'Villa María', province: 'Córdoba' },
  author: { id: 1, name: 'Vecina', avatar: null },
  validation: null,
  closure: null,
  needs_closure_review: false,
  pending_complaint_count: 0,
}

beforeEach(() => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({
    data: { count: 1, next: null, previous: null, results: [ROW] },
  })
})

describe('ReportsPage', () => {
  it('nombra el reporte por su número de municipio, no por el id', async () => {
    renderWithProviders(<ReportsPage />)

    expect(await screen.findByRole('link', { name: '#7' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '#42' })).not.toBeInTheDocument()
  })

  it('el enlace usa el id, que es lo único único en toda la base', async () => {
    renderWithProviders(<ReportsPage />)

    expect(await screen.findByRole('link', { name: '#7' })).toHaveAttribute(
      'href',
      '/reportes/42',
    )
  })

  it('no muestra la municipalidad: es siempre la del agente', async () => {
    renderWithProviders(<ReportsPage />)
    const row = await screen.findByRole('row', { name: /#7/ })

    expect(within(row).queryByText('Villa María')).not.toBeInTheDocument()
  })

  it('pide el listado del panel, que el backend ya acota', async () => {
    const get = vi.spyOn(apiClient, 'get')

    renderWithProviders(<ReportsPage />)
    await screen.findByRole('link', { name: '#7' })

    const [url, config] = get.mock.calls[0]
    expect(url).toContain('/api/panel/reports/')
    // La jurisdicción no viaja en la query: la resuelve el servidor.
    expect((config as { params?: Record<string, string> })?.params).not.toHaveProperty(
      'municipality',
    )
  })

  it('deja los filtros que sí son del agente', async () => {
    renderWithProviders(<ReportsPage />)
    await screen.findByRole('link', { name: '#7' })

    expect(screen.getByLabelText(messages.reports.filters.zone)).toBeInTheDocument()
    expect(
      screen.getByLabelText(messages.reports.filters.createdFrom),
    ).toBeInTheDocument()
  })
})
