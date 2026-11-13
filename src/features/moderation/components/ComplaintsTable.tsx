import { Link } from 'react-router-dom'
import { Clock, ImageOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { messages } from '@/config/messages'
import type { PrivacyDecision } from '@/features/privacy/api/privacyRequests'
import { describeRemaining, isOverdue } from '@/features/privacy/deadline'
import type { PrivacyRequest } from '@/features/privacy/types'
import type { ContentComplaint } from '@/features/reports/types'
import { AuthorLink } from '@/features/users/components/AuthorLink'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type {
  ModerationDecisionKind,
  ModerationInboxEntry,
  ResolvedModeration,
} from '../types'

const t = messages.moderation

/**
 * Una fila de Denuncias. Las de contenido son **un reporte** con todas sus
 * denuncias, que se resuelven juntas (US-049); las de dato personal son **una
 * imagen** (US-043). Se muestran en la misma tabla, sin separar por tipo.
 */
export type PendingRow =
  | { kind: 'content'; key: string; receivedAt: string; entry: ModerationInboxEntry }
  | { kind: 'privacy'; key: string; receivedAt: string; request: PrivacyRequest }

export type ResolvedRow =
  | { kind: 'content'; key: string; resolvedAt: string; decision: ResolvedModeration }
  | { kind: 'privacy'; key: string; resolvedAt: string; request: PrivacyRequest }

interface ComplaintsTableProps {
  now: number
  /** Sin él la fila de contenido es de solo lectura: el admin la ve, no decide. */
  onDecideContent?: (
    entry: ModerationInboxEntry,
    decision: ModerationDecisionKind,
  ) => void
  onDecidePrivacy?: (request: PrivacyRequest, decision: PrivacyDecision) => void
}

/**
 * La tabla de Denuncias, la misma para todos los tipos. Lo que cambia entre
 * pestañas es el final: en las pendientes, el plazo y las decisiones; en las
 * resueltas, qué se decidió, quién y cuándo.
 */
export function PendingComplaintsTable({
  rows,
  now,
  onDecideContent,
  onDecidePrivacy,
}: ComplaintsTableProps & { rows: PendingRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-36">{t.columns.image}</TableHead>
          <TableHead>{t.columns.report}</TableHead>
          <TableHead className="w-48">{t.columns.type}</TableHead>
          <TableHead className="w-32">{t.columns.receivedAt}</TableHead>
          <TableHead className="w-40">{t.columns.deadline}</TableHead>
          <TableHead className="w-44" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) =>
          row.kind === 'content' ? (
            <TableRow key={row.key}>
              <TableCell>
                <ImageCell url={row.entry.photo} label={t.reportPhoto} />
              </TableCell>
              <TableCell className="max-w-xs whitespace-normal">
                <ReportCell
                  id={row.entry.id}
                  number={row.entry.number}
                  address={row.entry.address}
                  description={row.entry.description}
                />
              </TableCell>
              <TableCell>
                <ContentTypeCell complaints={row.entry.complaints} />
              </TableCell>
              <TableCell className="text-sm whitespace-normal text-muted-foreground">
                {formatDateTime(row.receivedAt)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {t.noDeadline}
              </TableCell>
              <TableCell className="text-right">
                {onDecideContent && (
                  <div className="flex flex-col items-stretch gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onDecideContent(row.entry, 'dismiss')}
                    >
                      {t.dismiss}
                    </Button>
                    <Button
                      className="bg-destructive text-white hover:bg-destructive/90"
                      onClick={() => onDecideContent(row.entry, 'discard')}
                    >
                      {t.discard}
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ) : (
            <TableRow key={row.key}>
              <TableCell>
                <PrivacyImageCell request={row.request} />
              </TableCell>
              <TableCell className="max-w-xs whitespace-normal">
                <ReportCell
                  id={row.request.report.id}
                  number={row.request.report.number}
                  address={row.request.report.address}
                  description={row.request.report.description}
                />
              </TableCell>
              <TableCell>
                <PrivacyTypeCell />
              </TableCell>
              <TableCell className="text-sm whitespace-normal text-muted-foreground">
                {formatDateTime(row.receivedAt)}
              </TableCell>
              <TableCell>
                <DeadlineCell deadline={row.request.deadline} now={now} />
              </TableCell>
              <TableCell className="text-right">
                {onDecidePrivacy && (
                  <div className="flex flex-col items-stretch gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onDecidePrivacy(row.request, 'dismiss')}
                    >
                      {messages.privacy.dismiss}
                    </Button>
                    <Button
                      className="bg-destructive text-white hover:bg-destructive/90"
                      onClick={() => onDecidePrivacy(row.request, 'remove-image')}
                    >
                      {messages.privacy.removeImage}
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ),
        )}
      </TableBody>
    </Table>
  )
}

export function ResolvedComplaintsTable({ rows }: { rows: ResolvedRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-36">{t.columns.image}</TableHead>
          <TableHead>{t.columns.report}</TableHead>
          <TableHead className="w-48">{t.columns.type}</TableHead>
          <TableHead className="w-32">{t.columns.receivedAt}</TableHead>
          <TableHead className="w-56">{t.columns.decision}</TableHead>
          <TableHead className="w-44">{t.columns.resolvedAt}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) =>
          row.kind === 'content' ? (
            <TableRow key={row.key}>
              <TableCell>
                <ImageCell url={row.decision.report.photo} label={t.reportPhoto} />
              </TableCell>
              <TableCell className="max-w-xs whitespace-normal">
                <ReportCell
                  id={row.decision.report.id}
                  number={row.decision.report.number}
                  address={row.decision.report.address}
                  description={row.decision.report.description}
                />
              </TableCell>
              <TableCell>
                <ContentTypeCell complaints={row.decision.complaints} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(row.decision.received_at)}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Badge variant="secondary">{row.decision.outcome_label}</Badge>
                  {row.decision.reverted_at && (
                    <Badge variant="outline" className="ml-1">
                      {t.revertedBadge}
                    </Badge>
                  )}
                  {row.decision.decided_by && (
                    <span className="block text-xs text-muted-foreground">
                      {t.resolvedBy}: {row.decision.decided_by.name}
                    </span>
                  )}
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {t.decisionReason}: {row.decision.reason}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(row.resolvedAt)}
              </TableCell>
            </TableRow>
          ) : (
            <TableRow key={row.key}>
              <TableCell>
                <PrivacyImageCell request={row.request} />
              </TableCell>
              <TableCell className="max-w-xs whitespace-normal">
                <ReportCell
                  id={row.request.report.id}
                  number={row.request.report.number}
                  address={row.request.report.address}
                  description={row.request.report.description}
                />
              </TableCell>
              <TableCell>
                <PrivacyTypeCell />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(row.request.received_at)}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {messages.privacy.status[row.request.status]}
                </Badge>
                {row.request.resolved_by && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {t.resolvedBy}:{' '}
                    {row.request.resolved_by.name || row.request.resolved_by.email}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm">
                <span className="block text-muted-foreground">
                  {formatDateTime(row.resolvedAt)}
                </span>
                {/* El plazo es solo de las de dato personal (RN-12). */}
                <span
                  className={cn(
                    'text-xs font-medium',
                    row.request.resolved_within_deadline
                      ? 'text-status-resolved'
                      : 'text-destructive',
                  )}
                >
                  {row.request.resolved_within_deadline
                    ? messages.privacy.withinDeadline
                    : messages.privacy.lateResolution}
                </span>
              </TableCell>
            </TableRow>
          ),
        )}
      </TableBody>
    </Table>
  )
}

function ImageCell({ url, label }: { url: string | null; label: string }) {
  return (
    <figure className="space-y-1">
      {url ? (
        // Abre la foto completa en otra pestaña: la miniatura no alcanza para
        // decidir.
        <a href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt={label}
            className="h-20 w-32 rounded-md object-cover ring-1 ring-border"
          />
        </a>
      ) : (
        <span className="flex h-20 w-32 flex-col items-center justify-center gap-1 rounded-md bg-muted px-2 text-center text-xs text-muted-foreground">
          <ImageOff className="size-4" aria-hidden />
          {messages.privacy.imageGone}
        </span>
      )}
      <figcaption className="text-xs text-muted-foreground">{label}</figcaption>
    </figure>
  )
}

const PRIVACY_IMAGE_LABEL: Record<PrivacyRequest['image']['kind'], string> = {
  report: messages.privacy.reportPhoto,
  resolution_evidence: messages.privacy.evidencePhoto,
  resolution_appeal: messages.privacy.appealPhoto,
}

function PrivacyImageCell({ request }: { request: PrivacyRequest }) {
  return (
    <ImageCell
      url={request.image.url}
      label={PRIVACY_IMAGE_LABEL[request.image.kind]}
    />
  )
}

function ReportCell({
  id,
  number,
  address,
  description,
}: {
  id: number
  number: number | null
  address: string
  description: string
}) {
  return (
    <div className="space-y-0.5">
      <Link to={`/reportes/${id}`} className="font-medium text-primary hover:underline">
        {messages.privacy.reportNumber(number ?? id)}
      </Link>
      <p className="line-clamp-1 text-xs text-muted-foreground">{address || '—'}</p>
      <p className="line-clamp-2 text-sm">{description}</p>
    </div>
  )
}

/** Los motivos, y quién denunció qué: el agente lo necesita para decidir. */
function ContentTypeCell({ complaints }: { complaints: ContentComplaint[] }) {
  const reasons = [...new Set(complaints.map((complaint) => complaint.reason_label))]
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {reasons.map((reason) => (
          <Badge key={reason} variant="outline">
            {reason}
          </Badge>
        ))}
      </div>
      <ul className="space-y-1">
        {complaints.map((complaint) => (
          <li key={complaint.id} className="text-xs text-muted-foreground">
            {complaint.reporter ? (
              <AuthorLink id={complaint.reporter.id} name={complaint.reporter.name} />
            ) : (
              t.anonymousReporter
            )}
            {complaint.comment && (
              <span className="line-clamp-2">«{complaint.comment}»</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PrivacyTypeCell() {
  return <Badge variant="outline">{t.filter.dato_personal}</Badge>
}

function DeadlineCell({ deadline, now }: { deadline: string; now: number }) {
  const overdue = isOverdue(deadline, now)
  return (
    <div className="space-y-1">
      {overdue && <Badge variant="destructive">{messages.privacy.overdue}</Badge>}
      <p
        className={cn(
          'flex items-center gap-1.5 text-sm',
          overdue ? 'font-medium text-destructive' : 'text-foreground',
        )}
      >
        <Clock className="size-3.5 shrink-0" aria-hidden />
        {describeRemaining(deadline, now)}
      </p>
    </div>
  )
}
