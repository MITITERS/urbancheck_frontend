import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { messages } from '@/config/messages'
import type { PanelReportDetail } from '@/features/reports/types'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ROLES, type Role } from '@/types/auth'
import { ReportModerationCard } from './ReportModerationCard'

const t = messages.moderation

const { mockedRole } = vi.hoisted(() => ({
  mockedRole: { current: null as Role | null },
}))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ role: mockedRole.current }),
}))

const COMPLAINT = {
  id: 1,
  reason: 'reporte_falso' as const,
  reason_label: 'Reporte falso o inexistente',
  comment: 'No existe',
  reporter: { id: 9, name: 'Vecina Denunciante', avatar: null },
  status: 'reporte_descartado' as const,
  created_at: '2026-10-02T12:00:00Z',
  resolved_at: '2026-10-03T12:00:00Z',
}

const DISCARD = {
  id: 5,
  reason: 'La foto es de otra ciudad.',
  previous_status: 'en_proceso' as const,
  decided_by: { id: 3, name: 'Agente Municipal', avatar: null },
  created_at: '2026-10-03T12:00:00Z',
  appeal: null,
}

function report(overrides: Partial<PanelReportDetail> = {}): PanelReportDetail {
  return {
    id: 42,
    status: 'cancelado',
    complaints: [COMPLAINT],
    pending_complaint_count: 0,
    moderation: DISCARD,
    ...overrides,
  } as PanelReportDetail
}

beforeEach(() => {
  mockedRole.current = ROLES.MUNICIPAL_AGENT
})

describe('ReportModerationCard', () => {
  it('CP-049-P07 (US-049 E5) · muestra el motivo público del descarte y las denuncias resueltas', () => {
    renderWithProviders(<ReportModerationCard report={report()} />)

    expect(screen.getByText(t.discardedTitle)).toBeInTheDocument()
    expect(screen.getByText(DISCARD.reason)).toBeInTheDocument()
    expect(screen.getByText(t.status.reporte_descartado)).toBeInTheDocument()
    // El agente no revierte: eso es del admin.
    expect(screen.queryByRole('button', { name: t.revert })).toBeNull()
  })

  it('CP-049-P08 (US-049 E8) · el admin revierte de oficio, con motivo, al estado previo', async () => {
    mockedRole.current = ROLES.PLATFORM_ADMIN
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} } as never)
    const user = userEvent.setup()
    renderWithProviders(<ReportModerationCard report={report()} />)

    await user.click(screen.getByRole('button', { name: t.revert }))
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(t.revertDescription(messages.reports.status.en_proceso)),
    ).toBeInTheDocument()
    await user.type(
      within(dialog).getByLabelText(t.reasonLabel),
      'Descarte injustificado',
    )
    await user.click(within(dialog).getByRole('button', { name: t.revertConfirm }))

    expect(post).toHaveBeenCalledWith(endpoints.moderationAppeals.revert(42), {
      reason: 'Descarte injustificado',
    })
  })

  it('CP-049-P09 (US-049 E12) · con denuncias pendientes, el agente va a la bandeja', () => {
    renderWithProviders(
      <ReportModerationCard
        report={report({
          status: 'reportado',
          moderation: null,
          pending_complaint_count: 1,
          complaints: [{ ...COMPLAINT, status: 'pendiente', resolved_at: null }],
        })}
      />,
    )

    expect(screen.getByRole('link', { name: t.resolveInInbox })).toHaveAttribute(
      'href',
      '/denuncias',
    )
  })

  it('sin denuncias ni descarte no se dibuja', () => {
    renderWithProviders(
      <ReportModerationCard report={report({ complaints: [], moderation: null })} />,
    )

    expect(screen.queryByText(t.complaintsTitle)).toBeNull()
  })
})
