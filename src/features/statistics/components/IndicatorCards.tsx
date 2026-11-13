import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { messages } from '@/config/messages'
import { formatDuration, formatHours } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { AverageTime, Indicators } from '../types'
import { STATUS_COLOR } from './colors'
import { TitleWithHint } from './InfoHint'

const t = messages.statistics

/** Una etapa del circuito: el promedio grande y la muestra al lado. */
function Stage({ title, value }: { title: string; value: AverageTime }) {
  return (
    <div role="group" aria-label={title} className="min-w-0 space-y-1.5">
      <span className="block text-sm font-medium text-muted-foreground">{title}</span>
      {value.avg_seconds === null ? (
        <p className="py-1.5 text-sm text-muted-foreground">{t.noCases}</p>
      ) : (
        <p className="flex items-baseline gap-2">
          <span className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
            {formatHours(value.avg_seconds)}
          </span>
          <span className="text-xs text-muted-foreground">
            {t.sample(value.sample_size)}
          </span>
        </p>
      )}
    </div>
  )
}

/** Una tarjeta de seguimiento, todas de la misma altura. */
function FollowUp({
  title,
  hint,
  children,
  className,
}: {
  title: string
  hint: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card role="group" aria-label={title} className={cn('h-full', className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          <TitleWithHint title={title} hint={hint} />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  )
}

/** Una fila etiqueta–valor, para las listas cortas de las tarjetas. */
function Row({
  label,
  value,
  dot,
}: {
  label: ReactNode
  value: ReactNode
  dot?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="flex items-center gap-2 text-sm">
        {dot && (
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ background: dot }}
          />
        )}
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  )
}

/**
 * Los indicadores de gestión (US-050), encima de los gráficos de US-023.
 *
 * Arriba, los tres tiempos en una sola tarjeta y en el orden del circuito,
 * para que se lea de un vistazo dónde está el cuello de botella. Abajo, lo que los promedios esconden: lo abierto, los
 * cierres apelados contra su umbral y las salidas del circuito.
 */
export function IndicatorCards({ indicators }: { indicators: Indicators }) {
  const { validation, appealed_closures: appealed, cancellations } = indicators

  return (
    <section className="space-y-4" aria-label={t.stages}>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            <TitleWithHint title={t.stages} hint={t.help.stages} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <Stage title={t.validation} value={validation.overall} />
            <Stage title={t.assignment} value={indicators.assignment} />
            <Stage title={t.resolution} value={indicators.resolution} />
          </div>
          <p className="border-t pt-3 text-xs text-muted-foreground">{t.stagesNote}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <FollowUp title={t.open} hint={t.help.open}>
          <div className="divide-y">
            {indicators.open.map((row) => (
              <Row
                key={row.status}
                dot={STATUS_COLOR[row.status]}
                label={
                  <span>
                    {row.label}
                    {row.oldest_age_seconds !== null && (
                      <span className="block text-xs text-muted-foreground">
                        {t.oldest(formatDuration(row.oldest_age_seconds))}
                      </span>
                    )}
                  </span>
                }
                value={row.count}
              />
            ))}
          </div>
        </FollowUp>

        <FollowUp title={t.appealed} hint={t.help.appealed}>
          {appealed.percentage === null ? (
            <p className="text-sm text-muted-foreground">{t.noCases}</p>
          ) : (
            <div className="space-y-3">
              <p className="flex items-baseline gap-2">
                <span
                  className={cn(
                    'font-heading text-3xl font-semibold tracking-tight tabular-nums',
                    appealed.above_threshold && 'text-destructive',
                  )}
                >
                  {appealed.percentage.toLocaleString('es-AR')} %
                </span>
                <span className="text-xs text-muted-foreground">
                  {t.appealedDetail(appealed.appealed, appealed.closures)}
                </span>
              </p>
              {/* La barra muestra el porcentaje contra el umbral configurado:
                  la marca vertical es el límite a partir del cual se destaca. */}
              <div className="relative h-2 rounded-full bg-muted" aria-hidden>
                <div
                  className={cn(
                    'h-full rounded-full',
                    appealed.above_threshold ? 'bg-destructive' : 'bg-status-resolved',
                  )}
                  style={{ width: `${Math.min(appealed.percentage, 100)}%` }}
                />
                <div
                  className="absolute -top-1 h-4 w-0.5 rounded bg-foreground/50"
                  style={{ left: `${Math.min(appealed.alert_threshold, 100)}%` }}
                />
              </div>
              {appealed.above_threshold ? (
                <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                  <TriangleAlert className="size-3.5" aria-hidden />
                  {t.appealedAlert(appealed.alert_threshold)}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t.threshold(appealed.alert_threshold)}
                </p>
              )}
            </div>
          )}
        </FollowUp>

        <FollowUp title={t.exits} hint={t.help.exits}>
          <div className="divide-y">
            <Row
              dot={STATUS_COLOR.cancelado}
              label={t.cancellationsFieldRejection}
              value={cancellations.field_rejection}
            />
            <Row
              dot={STATUS_COLOR.cancelado}
              label={t.cancellationsModeration}
              value={cancellations.moderation}
            />
            <Row
              dot={STATUS_COLOR.cancelado}
              label={t.cancellationsMunicipal}
              value={cancellations.municipal}
            />
            {/* Aparte de las cancelaciones (escenario 8): caducar sin atención
                no es lo mismo que ser descartado por falso. */}
            <Row
              dot={STATUS_COLOR.archivado}
              label={t.archived}
              value={indicators.archived_by_inactivity}
            />
          </div>
        </FollowUp>
      </div>
    </section>
  )
}
