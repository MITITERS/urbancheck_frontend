import { messages } from '@/config/messages'
import type { ReportStatus } from '@/features/reports/types'
import type { DistributionBucket } from '../types'
import { STATUS_COLOR } from './colors'

const t = messages.statistics

/**
 * Los siete estados, agrupados por cómo terminó el reporte (US-023, escenario
 * 2): lo que sigue en curso, lo resuelto y lo que salió del circuito. Así se
 * lee de un vistazo cuánto trabajo queda abierto, que es la pregunta de la
 * historia.
 */
const GROUPS: readonly { label: string; statuses: readonly ReportStatus[] }[] = [
  {
    label: t.groupOpen,
    statuses: [
      'pendiente_validacion',
      'reportado',
      'en_proceso',
      'resuelto_pendiente_confirmacion',
    ],
  },
  { label: t.groupResolved, statuses: ['resuelto'] },
  { label: t.groupOut, statuses: ['cancelado', 'archivado'] },
]

/**
 * La distribución por estado: una barra de composición arriba, que muestra de
 * un vistazo cómo se reparte el período, y abajo cada estado con su barra, su
 * valor absoluto y su porcentaje. Los colores son los de los badges de estado.
 */
export function StatusBreakdown({
  rows,
}: {
  rows: DistributionBucket<ReportStatus>[]
}) {
  const byKey = new Map(rows.map((row) => [row.key, row]))
  const max = Math.max(1, ...rows.map((row) => row.count))

  return (
    <div role="group" aria-label={t.byStatus} className="space-y-5">
      {/* La composición entera en una sola barra. Es decorativa: los mismos
          números están en las filas de abajo. */}
      <div
        aria-hidden
        className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-muted"
      >
        {rows
          .filter((row) => row.count > 0)
          .map((row) => (
            <div
              key={row.key}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ flexGrow: row.count, background: STATUS_COLOR[row.key] }}
            />
          ))}
      </div>

      <div className="space-y-4">
        {GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
              {group.label}
            </p>
            <ul>
              {group.statuses.map((status) => {
                const row = byKey.get(status)
                if (!row) return null
                return (
                  <li
                    key={status}
                    className="grid grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto] items-center gap-3 py-1 text-sm"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: STATUS_COLOR[status] }}
                      />
                      <span className="truncate" title={row.label}>
                        {row.label}
                      </span>
                    </span>
                    <span aria-hidden className="h-1.5 rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${(row.count / max) * 100}%`,
                          background: STATUS_COLOR[status],
                        }}
                      />
                    </span>
                    <span className="flex w-24 items-baseline justify-end gap-2 tabular-nums">
                      <span className="font-semibold">{row.count}</span>
                      <span className="w-12 text-right text-xs text-muted-foreground">
                        {t.percent(row.percentage)}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
