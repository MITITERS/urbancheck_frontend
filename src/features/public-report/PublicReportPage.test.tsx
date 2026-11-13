import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { messages } from '@/config/messages'
import { AppRoutes } from '@/routes'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { PublicReport } from './api'
import { PublicReportPage } from './PublicReportPage'

const t = messages.publicReport
const TOKEN = 'da139cad-eb68-4d1a-bd2f-9ae4b21c7601'

const REPORT: PublicReport = {
  number: 136,
  category: 'vereda',
  category_label: 'Vereda',
  status: 'en_proceso',
  status_label: 'En proceso',
  description: 'Baldosas levantadas por raíces',
  photo: 'https://example.test/vereda.jpg',
  address: 'Corrientes 529, Centro, Villa María, Córdoba, Argentina',
  latitude: null,
  longitude: null,
  created_at: '2026-10-21T12:14:00Z',
  municipality: { city: 'Villa María', province: 'Córdoba' },
  like_count: 3,
  timeline: [
    {
      status: 'pendiente_validacion',
      status_label: 'Pendiente de validación',
      created_at: '2026-10-21T12:14:00Z',
    },
    {
      status: 'en_proceso',
      status_label: 'En proceso',
      created_at: '2026-10-22T12:00:00Z',
    },
  ],
  official_responses: [
    { text: 'Ya está asignado a Obras.', created_at: '2026-10-22T13:00:00Z' },
  ],
  share_url: `https://urbancheck.com.ar/r/${TOKEN}`,
}

function respond(status: number, data: unknown) {
  return vi.spyOn(apiClient, 'get').mockResolvedValue({ status, data } as never)
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/reporte/:token" element={<PublicReportPage />} />
    </Routes>,
    { route: `/reporte/${TOKEN}` },
  )
}

describe('PublicReportPage', () => {
  it('CP-030-P01 (US-030 E2) · muestra el reporte con sus detalles, buscado por el token', async () => {
    const get = respond(200, REPORT)
    renderPage()

    expect(
      await screen.findByText('Baldosas levantadas por raíces'),
    ).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith(
      endpoints.publicReports.detail(TOKEN),
      expect.anything(),
    )
    expect(screen.getByText('#136')).toBeInTheDocument()
    expect(screen.getByText(t.likes(3))).toBeInTheDocument()
    expect(screen.getByText('Ya está asignado a Obras.')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de validación')).toBeInTheDocument()
  })

  it('CP-030-P02 (US-030 E2) · ofrece abrirlo en la app con el mismo token', async () => {
    respond(200, REPORT)
    renderPage()

    const link = await screen.findByRole('link', { name: t.openInApp })
    expect(link).toHaveAttribute('href', `urbancheck://r/${TOKEN}`)
  })

  it('CP-030-P03 (US-030 E3) · un reporte archivado o eliminado ya no está disponible', async () => {
    respond(404, { code: 'report_unavailable', detail: 'x', moderation: null })
    renderPage()

    expect(await screen.findByText(t.unavailableTitle)).toBeInTheDocument()
    expect(screen.getByText(t.unavailableBody)).toBeInTheDocument()
  })

  it('CP-030-P04 (US-049) · si lo descartó el municipio, muestra el motivo público', async () => {
    respond(404, {
      code: 'report_unavailable',
      detail: 'x',
      moderation: {
        reason: 'La foto es de otra ciudad',
        decided_at: '2026-10-05T12:00:00Z',
      },
    })
    renderPage()

    expect(await screen.findByText('La foto es de otra ciudad')).toBeInTheDocument()
    expect(screen.getByText(t.discardedBody)).toBeInTheDocument()
  })

  it('N-06 · sin número no muestra el id ni un numeral suelto', async () => {
    // La respuesta pública ya no trae el id, que es correlativo.
    respond(200, { ...REPORT, number: null })
    renderPage()

    expect(
      await screen.findByText('Baldosas levantadas por raíces'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/^#/)).toBeNull()
  })

  it('CP-030-P05 (US-030 E2) · se abre sin sesión: no pasa por el login', async () => {
    respond(200, REPORT)
    renderWithProviders(<AppRoutes />, { route: `/reporte/${TOKEN}` })

    expect(
      await screen.findByText('Baldosas levantadas por raíces'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ingresar/i })).toBeNull()
  })
})
