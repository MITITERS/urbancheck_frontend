import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { Ban, CalendarDays, Heart, Landmark, MapPin, Smartphone } from 'lucide-react'
import { BrandLockup } from '@/components/common/Brand'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { messages } from '@/config/messages'
import { ReportCategoryLabel } from '@/features/reports/components/ReportCategory'
import { ReportMap } from '@/features/reports/components/ReportMap'
import { ReportStatusBadge } from '@/features/reports/components/ReportStatusBadge'
import { formatDate, formatDateTime, shortAddress } from '@/lib/format'
import { usePublicReport, type PublicReport, type UnavailableReport } from './api'

const t = messages.publicReport

/** El marco de la página: la marca arriba y el contenido centrado. */
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="brand-canvas min-h-svh px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex justify-center">
          <BrandLockup />
        </div>
        {children}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

/** El enlace que abre la app si está instalada. */
function OpenInApp({ token }: { token: string }) {
  return (
    <Card className="shadow-hero">
      <CardContent className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <Smartphone className="size-8 shrink-0 text-primary" aria-hidden />
        <p className="flex-1 text-sm text-muted-foreground">{t.cta}</p>
        <Button asChild>
          <a href={`urbancheck://r/${token}`}>{t.openInApp}</a>
        </Button>
      </CardContent>
    </Card>
  )
}

function Report({ report }: { report: PublicReport }) {
  return (
    <Card className="overflow-hidden shadow-hero">
      {report.photo && (
        <img src={report.photo} alt="" className="max-h-[22rem] w-full object-cover" />
      )}
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="flex items-center gap-2 font-heading text-xl font-semibold">
              <ReportCategoryLabel category={report.category} />
              {report.number !== null && (
                <span className="text-muted-foreground tabular-nums">
                  #{report.number}
                </span>
              )}
            </h1>
            <ReportStatusBadge status={report.status} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden />
              {t.reportedOn(formatDate(report.created_at))}
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="size-4" aria-hidden />
              {t.likes(report.like_count)}
            </span>
            <span className="flex items-center gap-1.5">
              <Landmark className="size-4" aria-hidden />
              {report.municipality.city}, {report.municipality.province}
            </span>
          </div>
        </div>

        <Section title={t.description}>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {report.description}
          </p>
        </Section>

        <Section title={t.location}>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" aria-hidden />
            {shortAddress(report.address) || '—'}
          </p>
          <ReportMap latitude={report.latitude} longitude={report.longitude} />
        </Section>

        {report.official_responses.length > 0 && (
          <Section title={t.officialResponses}>
            <ul className="space-y-2">
              {report.official_responses.map((response) => (
                <li
                  key={response.created_at}
                  className="rounded-lg bg-primary/5 p-3 text-sm ring-1 ring-primary/15 ring-inset"
                >
                  <p className="whitespace-pre-line">{response.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(response.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title={t.timeline}>
          <ol className="relative space-y-3 border-l pl-5">
            {report.timeline.map((entry) => (
              <li key={`${entry.status}-${entry.created_at}`} className="relative">
                <span
                  aria-hidden
                  className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full bg-primary ring-4 ring-card"
                />
                <p className="text-sm font-medium">{entry.status_label}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(entry.created_at)}
                </p>
              </li>
            ))}
          </ol>
        </Section>
      </CardContent>
    </Card>
  )
}

function Unavailable({ notice }: { notice: UnavailableReport }) {
  return (
    <Card className="shadow-hero">
      <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Ban className="size-7 text-muted-foreground" aria-hidden />
        </span>
        <h1 className="font-heading text-lg font-semibold">{t.unavailableTitle}</h1>
        {notice.moderation ? (
          <div className="max-w-md space-y-2 text-sm">
            <p className="text-muted-foreground">{t.discardedBody}</p>
            <p className="rounded-lg bg-muted/60 p-3">{notice.moderation.reason}</p>
          </div>
        ) : (
          <p className="max-w-md text-sm text-muted-foreground">{t.unavailableBody}</p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * US-030 — la versión web de un reporte compartido, para quien no tiene la app.
 *
 * Es la **única** ruta del panel que no pide sesión: se arma fuera del
 * `ProtectedRoute` y sin el marco del panel. Muestra el reporte con todos sus
 * detalles públicos (escenario 2) y, si ya no está disponible —archivado,
 * cancelado, eliminado—, lo dice (escenario 3). Con la app instalada, el mismo
 * enlace se abre directo en ella y esta página no llega a verse.
 */
export function PublicReportPage() {
  const { token = '' } = useParams<{ token: string }>()
  const query = usePublicReport(token)

  return (
    <Shell>
      {query.isPending ? (
        <Card>
          <CardContent className="space-y-3">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ) : query.isError ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            {t.loadError}
          </CardContent>
        </Card>
      ) : query.data.available ? (
        <Report report={query.data.report} />
      ) : (
        <Unavailable notice={query.data.notice} />
      )}
      <OpenInApp token={token} />
    </Shell>
  )
}
