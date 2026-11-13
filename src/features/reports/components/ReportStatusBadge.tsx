import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { messages } from '@/config/messages'
import { REPORT_STATUSES, type ReportStatus } from '../types'

/**
 * Status colors come from the `--status-*` design tokens, never from a hex
 * value written in a component.
 *
 * Cada estado aporta dos clases: el fondo con el anillo del badge, y el color
 * del punto. El punto es lo que hace legible el estado de un vistazo en una
 * tabla de veinte filas —el ojo lo encuentra antes que la palabra— y además
 * sostiene la distinción cuando el fondo es demasiado tenue para pelearla solo.
 */
const STATUS_CLASS: Record<ReportStatus, { badge: string; dot: string }> = {
  [REPORT_STATUSES.PENDING_VALIDATION]: {
    badge: 'bg-status-pending/12 text-status-pending ring-status-pending/25',
    dot: 'bg-status-pending',
  },
  [REPORT_STATUSES.REPORTED]: {
    badge:
      'bg-status-in-progress/10 text-status-in-progress ring-status-in-progress/20',
    dot: 'bg-status-in-progress/60',
  },
  [REPORT_STATUSES.IN_PROGRESS]: {
    badge:
      'bg-status-in-progress/18 text-status-in-progress ring-status-in-progress/30',
    dot: 'bg-status-in-progress',
  },
  // Resuelto **pendiente de confirmación**: el mismo verde que el estado final
  // pero a media tinta y con el punto hueco. Lo importante es que se lea como
  // "casi resuelto" y no como "resuelto", que es justo la diferencia que la
  // ventana de objeción de US-047 existe para sostener.
  [REPORT_STATUSES.PENDING_CONFIRMATION]: {
    badge: 'bg-status-resolved/8 text-status-resolved/85 ring-status-resolved/20',
    dot: 'bg-status-resolved/45',
  },
  [REPORT_STATUSES.RESOLVED]: {
    badge: 'bg-status-resolved/12 text-status-resolved ring-status-resolved/25',
    dot: 'bg-status-resolved',
  },
  [REPORT_STATUSES.CANCELLED]: {
    badge: 'bg-status-rejected/12 text-status-rejected ring-status-rejected/25',
    dot: 'bg-status-rejected',
  },
  [REPORT_STATUSES.ARCHIVED]: {
    badge: 'bg-muted text-muted-foreground ring-border',
    dot: 'bg-muted-foreground',
  },
}

export function ReportStatusBadge({
  status,
  className,
}: {
  status: ReportStatus
  className?: string
}) {
  const style = STATUS_CLASS[status]

  return (
    <Badge
      variant="secondary"
      className={cn(
        'gap-1.5 border-0 pl-1.5 ring-1 ring-inset',
        style.badge,
        className,
      )}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', style.dot)} />
      {messages.reports.status[status]}
    </Badge>
  )
}
