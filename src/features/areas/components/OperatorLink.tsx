import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { PersonAvatar } from '@/components/common/PersonAvatar'
import { QueryState } from '@/components/common/QueryState'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { messages } from '@/config/messages'
import { formatDate, shortAddress } from '@/lib/format'
import { ReportStatusBadge } from '@/features/reports/components/ReportStatusBadge'
import type { ReportAuthor } from '@/features/reports/types'
import { useOperatorClosures } from '../api/operatorClosures'

const labels = messages.operatorProfile

/**
 * El nombre de un operario, y lo que cerró detrás.
 *
 * Mismo patrón que `AuthorLink` para el vecino y `ValidatorLink` para el
 * validador, y por lo mismo: es un diálogo y no una ruta porque quien lo abre
 * está mirando un reporte o el plantel de un área, y mandarlo a otra pantalla
 * le hace perder eso de vista.
 *
 * Lo que cambia es qué se lista. Al vecino se le muestran los reportes que
 * **creó**; al validador, los que **decidió**; al operario, los que **cerró**,
 * que es lo que responde «¿cómo viene trabajando esta persona?».
 *
 * Solo lo alcanzan el agente y el administrador, porque solo ellos entran al
 * panel. Ante el vecino la identidad del operario no existe: responde el área
 * (US-038), y por eso este componente vive acá y no en nada que la app móvil
 * comparta.
 *
 * La consulta se dispara **solo al abrir**: un hilo de resolución puede nombrar
 * al mismo operario dos veces —cierre, apelación, segundo cierre— y no tiene
 * sentido traer su actividad por cada mención.
 */
export function OperatorLink({ operator }: { operator: ReportAuthor }) {
  const [open, setOpen] = useState(false)
  const closures = useOperatorClosures(open ? operator.id : null)

  const rows = closures.data?.results ?? []
  // Las tres cifras salen de la misma lista que se muestra abajo, así que el
  // resumen y lo que se ve al scrollear no pueden discrepar.
  const confirmed = rows.filter((row) => row.status === 'resuelto').length
  const awaiting = rows.filter(
    (row) => row.status === 'resuelto_pendiente_confirmacion',
  ).length
  const appealed = rows.filter((row) => row.status === 'en_proceso').length

  return (
    <>
      <button
        type="button"
        className="font-medium text-primary underline-offset-4 hover:underline"
        onClick={() => setOpen(true)}
      >
        {operator.name}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* Medida fija, como los otros dos perfiles: el diálogo no cambia de
            tamaño según cuántos reportes haya cerrado esta persona. */}
        <DialogContent className="flex h-[28rem] max-h-[85vh] flex-col overflow-hidden sm:max-w-lg">
          <DialogHeader className="flex-row items-center gap-3 space-y-0">
            <PersonAvatar name={operator.name} src={operator.avatar} size="lg" />
            <div className="min-w-0">
              <DialogTitle className="truncate">{operator.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-1.5">
                <Wrench className="size-3.5" aria-hidden />
                {labels.title}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex shrink-0 items-center justify-between gap-2">
              <h3 className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                {labels.closures}
              </h3>
              {rows.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {labels.counts(confirmed, awaiting, appealed)}
                </span>
              )}
            </div>

            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pr-1">
              <QueryState
                isPending={closures.isPending}
                isError={closures.isError}
                error={closures.error}
                onRetry={() => void closures.refetch()}
                isEmpty={rows.length === 0}
                emptyMessage={labels.empty}
              >
                <ul className="space-y-2">
                  {rows.map((report) => (
                    <li
                      key={report.id}
                      className="flex items-center justify-between gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          #{report.number ?? report.id} ·{' '}
                          {messages.reports.category[report.category]}
                        </p>
                        <p
                          className="truncate text-xs text-muted-foreground"
                          title={report.address}
                        >
                          {shortAddress(report.address)}
                        </p>
                        {/* Cuándo cerró **esta** persona, que es la pregunta del
                            perfil. La fecha del reporte no la responde. */}
                        {report.closure && (
                          <p className="text-xs text-muted-foreground">
                            {labels.closedOn(formatDate(report.closure.closed_at))}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {/* El estado es el **actual**: un cierre que el vecino
                            objetó volvió a gestión, y eso es lo que hay que ver
                            acá en lugar de darlo por resuelto. */}
                        <ReportStatusBadge status={report.status} />
                        <Link
                          to={`/reportes/${report.id}`}
                          className="text-xs text-primary underline-offset-4 hover:underline"
                          onClick={() => setOpen(false)}
                        >
                          {labels.openReport}
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </QueryState>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
