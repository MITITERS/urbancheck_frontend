import { screen } from '@testing-library/react'
import type * as RouterModule from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ROLES, type Role } from '@/types/auth'
import { ReportDetailPage } from './ReportDetailPage'
import type { PanelReportDetail } from './types'

const VILLA_MARIA = { id: 3, city: 'Villa María', province: 'Córdoba' }

const DETAIL: PanelReportDetail = {
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
  like_count: 5,
  comments: [],
  status_history: [],
  available_transitions: [],
  validation: null,
  collective_validation: null,
  operational_area: null,
  area_assigned_at: null,
  area_assignments: [],
  archived_at: null,
  official_responses: [],
  can_publish_official_response: false,
  resolution_evidences: [],
  resolution_appeals: [],
  closed_at: null,
  objection_deadline: null,
  appeal_count: 0,
  complaints: [],
  pending_complaint_count: 0,
  moderation: null,
}

const { mockedRole } = vi.hoisted(() => ({
  mockedRole: { current: null as Role | null },
}))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ role: mockedRole.current }),
}))

// La página lee el id de la ruta; el test la monta suelta, sin esa ruta.
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof RouterModule>()
  return { ...actual, useParams: () => ({ id: '42' }) }
})

beforeEach(() => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: DETAIL })
})

describe('ReportDetailPage — a dónde vuelve cada rol', () => {
  it('el agente vuelve al listado, que es su pantalla', async () => {
    mockedRole.current = ROLES.MUNICIPAL_AGENT

    renderWithProviders(<ReportDetailPage />)

    expect(
      await screen.findByRole('link', { name: messages.reportDetail.backToList }),
    ).toHaveAttribute('href', '/reportes')
  })

  it('el admin también vuelve al listado: lo tiene con la municipalidad del header', async () => {
    // Desde el selector de municipalidad del header (21/10), el admin tiene el
    // mismo listado que el agente, acotado a la ciudad elegida.
    mockedRole.current = ROLES.PLATFORM_ADMIN

    renderWithProviders(<ReportDetailPage />)

    expect(
      await screen.findByRole('link', { name: messages.reportDetail.backToList }),
    ).toHaveAttribute('href', '/reportes')
  })

  it('dice qué validador lo confirmó en terreno', async () => {
    // El nombre ya estaba en el historial, mezclado con las acciones del
    // municipio: acá se lee de una.
    mockedRole.current = ROLES.MUNICIPAL_AGENT
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        ...DETAIL,
        validation: {
          validator: { id: 5, name: 'Marcos Vera', avatar: null },
          decided_at: '2026-08-21T09:00:00Z',
          outcome: 'validado',
        },
      },
    })

    renderWithProviders(<ReportDetailPage />)

    expect(await screen.findByText('Marcos Vera')).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(messages.reportDetail.validatedBy)),
    ).toBeVisible()
  })

  it('sin validar todavía, no inventa un validador', async () => {
    mockedRole.current = ROLES.MUNICIPAL_AGENT

    renderWithProviders(<ReportDetailPage />)
    await screen.findByText(/#7/)

    expect(
      screen.queryByText(new RegExp(messages.reportDetail.validatedBy)),
    ).not.toBeInTheDocument()
  })

  it('dice que lo validó la comunidad, sin inventar un validador', async () => {
    // US-040: el otro camino a Reportado. Antes el encabezado no mostraba nada
    // y un reporte validado por la comunidad se leía como uno sin validar.
    mockedRole.current = ROLES.MUNICIPAL_AGENT
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        ...DETAIL,
        collective_validation: {
          validated_at: '2026-09-08T09:00:00Z',
          confirmation_count: 3,
        },
      },
    })

    renderWithProviders(<ReportDetailPage />)

    expect(
      await screen.findByText(new RegExp(messages.reportDetail.validatedByCommunity)),
    ).toBeVisible()
    // Cuántos confirmaron sí; quiénes, no (US-038).
    expect(
      screen.getByText(new RegExp(messages.reportDetail.collectiveConfirmations(3))),
    ).toBeVisible()
    expect(
      screen.queryByText(new RegExp(messages.reportDetail.validatedBy)),
    ).not.toBeInTheDocument()
  })

  it('N-09 · un reporte cuyo vecino borró la cuenta dice "Usuario eliminado"', async () => {
    mockedRole.current = ROLES.MUNICIPAL_AGENT
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { ...DETAIL, author: null } })

    renderWithProviders(<ReportDetailPage />)

    expect(await screen.findByText(/Usuario eliminado/)).toBeInTheDocument()
  })

  it('nombra el reporte por su número de municipio', async () => {
    mockedRole.current = ROLES.MUNICIPAL_AGENT

    renderWithProviders(<ReportDetailPage />)

    expect(await screen.findByText(/#7/)).toBeInTheDocument()
    expect(screen.queryByText(/#42/)).not.toBeInTheDocument()
  })
})

describe('ReportDetailPage — protección de datos (US-043)', () => {
  it('CP-043-P03 (US-043 E10) · avisa que el reporte está oculto mientras se revisa la imagen', async () => {
    mockedRole.current = ROLES.MUNICIPAL_AGENT
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { ...DETAIL, under_privacy_review: true },
    })

    renderWithProviders(<ReportDetailPage />)

    expect(
      await screen.findByText(messages.reportDetail.underPrivacyReview),
    ).toBeVisible()
  })

  it('sin denuncia pendiente no hay aviso', async () => {
    mockedRole.current = ROLES.MUNICIPAL_AGENT

    renderWithProviders(<ReportDetailPage />)

    await screen.findByText(/#7/)
    expect(
      screen.queryByText(messages.reportDetail.underPrivacyReview),
    ).not.toBeInTheDocument()
  })

  it('CP-042-P01 (US-042 E6) · dice que un reporte sin difuminar todavía no es público (US-042)', async () => {
    mockedRole.current = ROLES.MUNICIPAL_AGENT
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        ...DETAIL,
        photo: null,
        photo_status: 'pendiente',
        available_transitions: [],
      },
    })

    renderWithProviders(<ReportDetailPage />)

    expect(await screen.findByText(messages.reportDetail.notPublishedYet)).toBeVisible()
    // Y en el lugar de la foto, por qué no está: un hueco se lee como un
    // error de carga.
    expect(screen.getByText(messages.reportDetail.photoProcessing)).toBeVisible()
  })

  it('CP-043-P04 (US-043 E5) · una foto retirada gana sobre el difuminado: ya no importa en qué quedó', async () => {
    mockedRole.current = ROLES.MUNICIPAL_AGENT
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        ...DETAIL,
        photo: null,
        photo_removed_at: '2026-09-03T10:00:00Z',
        photo_status: 'pendiente',
      },
    })

    renderWithProviders(<ReportDetailPage />)

    expect(await screen.findByText(messages.reportDetail.photoRemoved)).toBeVisible()
    expect(
      screen.queryByText(messages.reportDetail.photoProcessing),
    ).not.toBeInTheDocument()
  })

  it('CP-043-P05 (US-043 E5) · una foto retirada se muestra como retirada, no como un hueco', async () => {
    mockedRole.current = ROLES.MUNICIPAL_AGENT
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { ...DETAIL, photo: null, photo_removed_at: '2026-09-03T10:00:00Z' },
    })

    renderWithProviders(<ReportDetailPage />)

    expect(await screen.findByText(messages.reportDetail.photoRemoved)).toBeVisible()
    // Sin foto no se vuelve a publicar: el municipio tiene que saber que
    // ningún vecino lo ve.
    expect(screen.getByText(messages.reportDetail.withdrawn)).toBeVisible()
  })
})
