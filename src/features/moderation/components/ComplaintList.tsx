import { Badge } from '@/components/ui/badge'
import { messages } from '@/config/messages'
import { AuthorLink } from '@/features/users/components/AuthorLink'
import type { ContentComplaint } from '@/features/reports/types'
import { formatDateTime } from '@/lib/format'

/**
 * Las denuncias de un reporte: motivo, comentario, quién y cuándo (US-049,
 * escenario 1). La identidad del denunciante se ve solo en el panel.
 */
export function ComplaintList({
  complaints,
  showStatus = false,
}: {
  complaints: ContentComplaint[]
  /** En el detalle del reporte importa en qué quedó cada una. */
  showStatus?: boolean
}) {
  return (
    <ul className="divide-y">
      {complaints.map((complaint) => (
        <li key={complaint.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{complaint.reason_label}</span>
            {showStatus && (
              <Badge variant="outline">
                {messages.moderation.status[complaint.status]}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {complaint.comment || messages.moderation.noComment}
          </p>
          <p className="text-xs text-muted-foreground">
            {messages.moderation.reportedBy}:{' '}
            {complaint.reporter ? (
              <AuthorLink id={complaint.reporter.id} name={complaint.reporter.name} />
            ) : (
              messages.moderation.anonymousReporter
            )}{' '}
            · {formatDateTime(complaint.created_at)}
          </p>
        </li>
      ))}
    </ul>
  )
}
