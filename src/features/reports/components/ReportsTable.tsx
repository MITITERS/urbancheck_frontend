import { Link } from 'react-router-dom'
import {
  EyeOff,
  Flag,
  MapPin,
  MessageSquareDot,
  ScanSearch,
  ThumbsUp,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { messages } from '@/config/messages'
import { formatDate, formatTime, streetAddress } from '@/lib/format'
import type { PanelReportRow } from '../types'
import { ReportCategoryLabel } from './ReportCategory'
import { ReportStatusBadge } from './ReportStatusBadge'

const columns = messages.reports.columns

/**
 * Escenario 13 de US-024: lo que se busca de un vistazo son los reclamos **sin**
 * comunicación institucional, así que ese es el estado que se marca y el otro
 * queda discreto.
 */
function OfficialResponseState({ answered }: { answered: boolean }) {
  return answered ? (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <MessageSquareDot className="size-3.5" aria-hidden />
      {messages.reports.answered}
    </span>
  ) : (
    <Badge variant="secondary">{messages.reports.unanswered}</Badge>
  )
}

export function ReportsTable({ reports }: { reports: PanelReportRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">{columns.id}</TableHead>
          <TableHead>{columns.category}</TableHead>
          <TableHead>{columns.status}</TableHead>
          <TableHead>{columns.createdAt}</TableHead>
          <TableHead>{columns.address}</TableHead>
          {/* Por debajo de xl, likes, área y respuesta no tienen columna
              propia: el área baja debajo de la categoría, la respuesta se suma
              a los badges del estado y los likes quedan para el detalle. Así la
              tabla entra sin scroll horizontal también en pantallas medianas. */}
          <TableHead className="hidden w-20 text-right xl:table-cell">
            {columns.likes}
          </TableHead>
          <TableHead className="hidden xl:table-cell">
            {columns.operativeArea}
          </TableHead>
          <TableHead className="hidden xl:table-cell">
            {columns.officialResponse}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => (
          <TableRow key={report.id} className="group">
            <TableCell>
              {/* Cada fila enlaza al detalle, donde viven las acciones (US-013). */}
              <Link
                to={`/reportes/${report.id}`}
                className="font-semibold text-primary underline-offset-4 group-hover:underline"
              >
                {/* Se lo nombra por su número de municipio; el id va en la
                    URL, que es donde importa que sea único en toda la base. */}
                #{report.number ?? report.id}
              </Link>
            </TableCell>
            <TableCell className="font-medium">
              <ReportCategoryLabel category={report.category} />
              {report.operative_area && (
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground xl:hidden">
                  {report.operative_area.name}
                </span>
              )}
            </TableCell>
            {/* Los badges extra bajan a otra línea en vez de ensanchar la tabla. */}
            <TableCell className="whitespace-normal">
              <span className="flex flex-wrap items-center gap-1.5">
                <ReportStatusBadge status={report.status} />
                {/* US-015, escenario 3: el cierre que la comparación automática
                    marcó como dudoso, para priorizarlo mientras corre la
                    ventana de objeción. Es un indicio, no un veredicto. */}
                {report.needs_closure_review && (
                  <Badge
                    variant="outline"
                    title={messages.reports.closureReviewHint}
                    className="gap-1 border-transparent bg-status-pending/12 text-status-pending ring-1 ring-status-pending/25 ring-inset"
                  >
                    <ScanSearch className="size-3" aria-hidden />
                    {messages.reports.closureReview}
                  </Badge>
                )}
                {/* US-049, escenario 12: denuncias por contenido esperando
                    la decisión del agente. */}
                {report.pending_complaint_count > 0 && (
                  <Badge
                    variant="outline"
                    title={messages.moderation.listFlagHint}
                    className="gap-1 border-transparent bg-destructive/10 text-destructive ring-1 ring-destructive/20 ring-inset"
                  >
                    <Flag className="size-3" aria-hidden />
                    {messages.moderation.listFlag(report.pending_complaint_count)}
                  </Badge>
                )}
                {/* US-042: el vecino todavía no ve este reporte porque su
                    imagen sigue en el difuminado. El panel es el único lugar
                    donde aparece, así que tiene que decir en qué estado está o
                    el agente lo trata como cualquier otro. */}
                {report.photo_status !== 'procesada' && (
                  <Badge
                    variant="outline"
                    title={
                      report.photo_status === 'fallida'
                        ? messages.reports.notPublishedFailedHint
                        : messages.reports.notPublishedHint
                    }
                    className="gap-1 border-transparent bg-muted text-muted-foreground ring-1 ring-border ring-inset"
                  >
                    <EyeOff className="size-3" aria-hidden />
                    {messages.reports.notPublished}
                  </Badge>
                )}
                <span className="xl:hidden">
                  <OfficialResponseState answered={report.has_official_response} />
                </span>
              </span>
            </TableCell>
            {/* Fecha y hora en dos líneas: en una sola, era la columna que más
                empujaba el ancho. */}
            <TableCell className="text-muted-foreground">
              <span className="block">{formatDate(report.created_at)}</span>
              <span className="block text-xs">{formatTime(report.created_at)}</span>
            </TableCell>
            {/* Solo calle y número; la dirección completa queda en el título y
                en el detalle. */}
            <TableCell className="max-w-48">
              <span className="flex items-center gap-1.5">
                <MapPin
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="truncate" title={report.address || undefined}>
                  {streetAddress(report.address) || '—'}
                </span>
              </span>
            </TableCell>
            <TableCell className="hidden text-right xl:table-cell">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <ThumbsUp className="size-3.5" aria-hidden />
                {report.like_count}
              </span>
            </TableCell>
            <TableCell className="hidden whitespace-normal text-muted-foreground xl:table-cell">
              {report.operative_area?.name ?? '—'}
            </TableCell>
            <TableCell className="hidden xl:table-cell">
              <OfficialResponseState answered={report.has_official_response} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
