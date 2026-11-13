import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ban } from 'lucide-react'
import { toast } from 'sonner'
import { normalizeError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { messages } from '@/config/messages'
import { useAuth } from '@/hooks/useAuth'
import type { PanelReportDetail } from '@/features/reports/types'
import { formatDateTime } from '@/lib/format'
import { ROLES } from '@/types/auth'
import { useRevertModeration } from '../api/moderation'
import { ComplaintList } from './ComplaintList'
import { ReasonDialog } from './ReasonDialog'

const HTTP_CONFLICT = 409
const t = messages.moderation

/**
 * Lo que pasó con las denuncias de un reporte, en su detalle (US-049).
 *
 * El agente ve las denuncias y su estado, y si hay pendientes, el camino a la
 * bandeja: se resuelven allá, donde está el contexto. Si el reporte fue
 * descartado, la tarjeta muestra el motivo público y la apelación; el admin,
 * además, puede revertir el descarte de oficio (escenario 8).
 */
export function ReportModerationCard({ report }: { report: PanelReportDetail }) {
  const { role } = useAuth()
  const revert = useRevertModeration(report.id)
  const [reverting, setReverting] = useState(false)
  const { moderation, complaints } = report

  if (!moderation && complaints.length === 0) return null

  const confirmRevert = async (reason: string) => {
    try {
      await revert.mutateAsync(reason)
    } catch (error) {
      const apiError = normalizeError(error)
      toast.error(apiError.status === HTTP_CONFLICT ? t.notDiscarded : apiError.message)
      setReverting(false)
      return
    }
    toast.success(t.reverted)
    setReverting(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.complaintsTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {moderation && (
          <div
            role="status"
            className="space-y-2 rounded-lg bg-destructive/5 p-3 text-sm ring-1 ring-destructive/20 ring-inset"
          >
            <p className="flex items-center gap-2 font-medium text-destructive">
              <Ban className="size-4 shrink-0" aria-hidden />
              {t.discardedTitle}
            </p>
            <p>
              <span className="text-muted-foreground">{t.publicReason}: </span>
              {moderation.reason}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.discardedBy(
                moderation.decided_by?.name ?? '—',
                formatDateTime(moderation.created_at),
              )}
            </p>
            {moderation.appeal?.status === 'pendiente' && (
              <p className="text-xs font-medium">{t.appealPending}</p>
            )}
            {moderation.appeal?.status === 'rechazada' && (
              <p className="text-xs font-medium">{t.appealRejected}</p>
            )}
            {role === ROLES.PLATFORM_ADMIN && (
              <Button size="sm" variant="outline" onClick={() => setReverting(true)}>
                {t.revert}
              </Button>
            )}
          </div>
        )}

        {complaints.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noComplaints}</p>
        ) : (
          <ComplaintList complaints={complaints} showStatus />
        )}

        {report.pending_complaint_count > 0 && role === ROLES.MUNICIPAL_AGENT && (
          <Button asChild size="sm" variant="outline">
            <Link to="/denuncias">{t.resolveInInbox}</Link>
          </Button>
        )}
      </CardContent>

      {moderation && (
        <ReasonDialog
          key={reverting ? 'abierto' : 'cerrado'}
          open={reverting}
          onOpenChange={setReverting}
          title={t.revertTitle}
          description={t.revertDescription(
            messages.reports.status[moderation.previous_status],
          )}
          confirmLabel={t.revertConfirm}
          isPending={revert.isPending}
          onConfirm={(reason) => void confirmRevert(reason)}
        />
      )}
    </Card>
  )
}
