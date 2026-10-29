import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  EyeOff,
  MapPin,
  ShieldCheck,
  ThumbsUp,
  User,
  Users,
} from 'lucide-react'
import { PersonAvatar } from '@/components/common/PersonAvatar'
import { QueryState } from '@/components/common/QueryState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { messages } from '@/config/messages'
import { AuthorLink } from '@/features/users/components/AuthorLink'
import { ValidatorLink } from '@/features/validators/components/ValidatorLink'
import { ReportModerationCard } from '@/features/moderation/components/ReportModerationCard'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/format'
import { useReportDetail } from './api/reportDetail'
import { ReportCategoryLabel } from './components/ReportCategory'
import { ReportMap } from './components/ReportMap'
import { ReportStatusBadge } from './components/ReportStatusBadge'
import { ProcessingPhoto } from './components/ProcessingPhoto'
import { RemovedPhoto } from './components/RemovedPhoto'
import { AreaCard } from './components/AreaCard'
import { OfficialResponses } from './components/OfficialResponses'
import { ObjectionDeadline, ResolutionThread } from './components/ResolutionThread'
import { StatusHistory } from './components/StatusHistory'
import { TransitionActions } from './components/TransitionActions'
import { REPORT_STATUSES } from './types'

/** Rótulo de una sección dentro de la ficha del reporte. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
      {children}
    </h2>
  )
}

/** Un dato de la cabecera: ícono, y el valor al lado. */
function MetaItem({
  icon,
  children,
  className,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span aria-hidden className="text-muted-foreground/70">
        {icon}
      </span>
      {children}
    </span>
  )
}

/** US-013 — detalle del reporte con las acciones de estado disponibles. */
export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const reportId = Number(id)
  const query = useReportDetail(reportId)
  const report = query.data
  // Los dos roles llegan desde el listado de reportes: el admin también lo
  // tiene, con la municipalidad elegida en el header.
  const back = { to: '/reportes', label: messages.reportDetail.backToList }

  return (
    <div className="space-y-6">
      <Button
        asChild
        variant="ghost"
        size="lg"
        className="-ml-2.5 text-muted-foreground"
      >
        <Link to={back.to}>
          <ArrowLeft className="size-4" aria-hidden />
          {back.label}
        </Link>
      </Button>

      <QueryState
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {report && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-2">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                      <span className="tabular">#{report.number ?? report.id}</span>
                      <span aria-hidden className="text-border">
                        ·
                      </span>
                      <ReportCategoryLabel category={report.category} />
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <MetaItem icon={<Clock className="size-3.5" />}>
                        {formatDateTime(report.created_at)}
                      </MetaItem>
                      <MetaItem icon={<User className="size-3.5" />}>
                        {messages.reportDetail.author}:{' '}
                        {report.author ? (
                          <AuthorLink id={report.author.id} name={report.author.name} />
                        ) : (
                          messages.common.deletedUser
                        )}
                      </MetaItem>
                      <MetaItem icon={<ThumbsUp className="size-3.5" />}>
                        {messages.reportDetail.likes}: {report.like_count}
                      </MetaItem>
                      {/* Quién salió a mirarlo en terreno, y qué decidió. Lo
                          resuelve el servidor: `reactivar` deja el reporte en
                          Reportado y `cancelar` lo deja en Cancelado, pero las
                          ejecuta un agente, así que deducirlo del historial
                          haría pasar a ese agente por validador. */}
                      {report.validation?.validator && (
                        <MetaItem icon={<ShieldCheck className="size-3.5" />}>
                          {report.validation.outcome === 'rechazado'
                            ? messages.reportDetail.rejectedBy
                            : messages.reportDetail.validatedBy}
                          : <ValidatorLink validator={report.validation.validator} />
                          <span className="text-muted-foreground">
                            {' · '}
                            {formatDateTime(report.validation.decided_at)}
                          </span>
                        </MetaItem>
                      )}
                      {/* El otro camino a Reportado (US-040). Sin esto el
                          encabezado no mostraba nada y un reporte validado por
                          la comunidad se leía como uno que nadie validó. No
                          lleva nombre porque no hubo persona: lo certificó la
                          cantidad, y quiénes confirmaron no se expone (US-038). */}
                      {report.collective_validation && (
                        <MetaItem icon={<Users className="size-3.5" />}>
                          {messages.reportDetail.validatedByCommunity}
                          {report.collective_validation.confirmation_count !== null
                            ? ` · ${messages.reportDetail.collectiveConfirmations(
                                report.collective_validation.confirmation_count,
                              )}`
                            : ''}
                          <span className="text-muted-foreground">
                            {' · '}
                            {formatDateTime(report.collective_validation.validated_at)}
                          </span>
                        </MetaItem>
                      )}
                    </div>
                  </div>
                  <ReportStatusBadge status={report.status} />
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* El panel no es una vista pública y sigue mostrando el
                      reporte, pero el agente tiene que saber por qué el vecino
                      no lo encuentra (US-043). */}
                  {/* Retirado por protección de datos (US-043): el municipio
                      lo sigue viendo, pero nadie más. */}
                  {report.photo_removed_at && (
                    <p
                      role="status"
                      className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground"
                    >
                      <EyeOff className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {messages.reportDetail.withdrawn}
                    </p>
                  )}
                  {report.under_privacy_review && (
                    <p
                      role="status"
                      className="flex items-start gap-2 rounded-lg bg-destructive/5 px-3 py-2.5 text-sm text-destructive ring-1 ring-destructive/20 ring-inset"
                    >
                      <EyeOff className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {messages.reportDetail.underPrivacyReview}
                    </p>
                  )}
                  {/* Todavía no se publicó: su imagen sigue en el difuminado,
                      o no se pudo difuminar (US-042). El panel lo ve igual,
                      pero no lo puede gestionar y el vecino no lo ve. */}
                  {!report.photo_removed_at && report.photo_status !== 'procesada' && (
                    <p
                      role="status"
                      className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground"
                    >
                      <EyeOff className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {report.photo_status === 'fallida'
                        ? messages.reportDetail.photoProcessingFailed
                        : messages.reportDetail.notPublishedYet}
                    </p>
                  )}
                  {/* Precedencia: retirada gana sobre el difuminado. Si la
                      foto se sacó por protección de datos, en qué quedó el
                      procesamiento ya no le importa a nadie. */}
                  {report.photo ? (
                    <img
                      src={report.photo}
                      alt=""
                      className="max-h-96 w-full rounded-lg object-cover ring-1 ring-border"
                    />
                  ) : report.photo_removed_at ? (
                    <RemovedPhoto />
                  ) : (
                    report.photo_status !== 'procesada' && (
                      <ProcessingPhoto failed={report.photo_status === 'fallida'} />
                    )
                  )}
                  <div className="space-y-1.5">
                    <SectionLabel>{messages.reportDetail.description}</SectionLabel>
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {report.description}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <SectionLabel>{messages.reportDetail.location}</SectionLabel>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
                      {report.address || '—'}
                    </p>
                    <ReportMap
                      latitude={report.latitude}
                      longitude={report.longitude}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* El parte de trabajo del operario va antes que todo lo demás
                  cuando existe: es lo último que pasó con el reporte y lo que
                  el agente necesita mirar para decidir si confirma el cierre. */}
              {report.resolution_evidences.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{messages.reportDetail.resolution}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ObjectionDeadline report={report} />
                    <ResolutionThread report={report} />
                  </CardContent>
                </Card>
              )}

              {/* El hilo institucional va antes que los comentarios y con un
                  tratamiento propio: es la voz del municipio, no la del
                  vecindario, y confundirlos es justo lo que el escenario 10 de
                  US-024 pide evitar. */}
              <Card>
                <CardHeader>
                  <CardTitle>{messages.reportDetail.officialResponses}</CardTitle>
                </CardHeader>
                <CardContent>
                  <OfficialResponses report={report} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{messages.reportDetail.comments}</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {messages.reportDetail.noComments}
                    </p>
                  ) : (
                    <ul className="space-y-4">
                      {report.comments.map((comment) => (
                        <li key={comment.id} className="flex gap-3">
                          <PersonAvatar
                            name={comment.author.name}
                            src={comment.author.avatar}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm">{comment.text}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              <AuthorLink
                                id={comment.author.id}
                                name={comment.author.name}
                              />{' '}
                              · {formatDateTime(comment.created_at)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* La columna de acciones acompaña el scroll: el historial y los
                botones son lo que se consulta mientras se lee el reporte. */}
            <div className="space-y-6 lg:sticky lg:top-22 lg:self-start">
              <Card>
                <CardHeader>
                  <CardTitle>{messages.reportDetail.actions}</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.available_transitions.length > 0 ? (
                    <TransitionActions
                      reportId={report.id}
                      transitions={report.available_transitions}
                    />
                  ) : (
                    <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                      {report.status === REPORT_STATUSES.PENDING_VALIDATION
                        ? messages.reportDetail.awaitingValidation
                        : messages.reportDetail.finalStatus}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Las denuncias por contenido y el descarte, si lo hubo
                  (US-049): al lado de las acciones, porque son una razón más
                  para decidir qué hacer con el reporte. */}
              <ReportModerationCard report={report} />

              <Card>
                <CardHeader>
                  <CardTitle>{messages.reportDetail.area}</CardTitle>
                </CardHeader>
                <CardContent>
                  <AreaCard report={report} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{messages.reportDetail.history}</CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusHistory entries={report.status_history} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </QueryState>
    </div>
  )
}
