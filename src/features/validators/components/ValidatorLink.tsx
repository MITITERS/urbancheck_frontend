import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { PersonAvatar } from '@/components/common/PersonAvatar'
import { QueryState } from '@/components/common/QueryState'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { messages } from '@/config/messages'
import { shortAddress } from '@/lib/format'
import { ReportStatusBadge } from '@/features/reports/components/ReportStatusBadge'
import type { ReportAuthor } from '@/features/reports/types'
import { useValidatorDecisions } from '../api/validatorDecisions'

const labels = messages.validatorProfile

/**
 * El nombre de un validador, y lo que decidió detrás.
 *
 * Mismo patrón que `AuthorLink` para el vecino, y por lo mismo: es un diálogo y
 * no una ruta porque quien lo abre está mirando un reporte, y mandarlo a otra
 * pantalla le hace perder eso de vista.
 *
 * Lo que cambia respecto del vecino es qué se lista. Al vecino se le muestran
 * los reportes que **creó**; al validador, los que **decidió** —validó o
 * rechazó—, que es lo que responde «¿cómo viene trabajando esta persona?».
 *
 * La consulta se dispara **solo al abrir**: un historial puede nombrar al mismo
 * validador varias veces y no tiene sentido traer su actividad por cada
 * mención.
 */
export function ValidatorLink({ validator }: { validator: ReportAuthor }) {
  const [open, setOpen] = useState(false)
  const decisions = useValidatorDecisions(open ? validator.id : null)

  const rows = decisions.data?.results ?? []
  const validated = rows.filter((row) => row.validation?.outcome === 'validado').length
  const rejected = rows.length - validated

  return (
    <>
      <button
        type="button"
        className="font-medium text-primary underline-offset-4 hover:underline"
        onClick={() => setOpen(true)}
      >
        {validator.name}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* Medida fija, como el perfil del vecino: el diálogo no cambia de
            tamaño según cuántos reportes haya decidido esta persona. */}
        <DialogContent className="flex h-[28rem] max-h-[85vh] flex-col overflow-hidden sm:max-w-lg">
          <DialogHeader className="flex-row items-center gap-3 space-y-0">
            <PersonAvatar name={validator.name} src={validator.avatar} size="lg" />
            <div className="min-w-0">
              <DialogTitle className="truncate">{validator.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" aria-hidden />
                {labels.title}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex shrink-0 items-center justify-between gap-2">
              <h3 className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                {labels.decisions}
              </h3>
              {rows.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {labels.counts(validated, rejected)}
                </span>
              )}
            </div>

            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pr-1">
              <QueryState
                isPending={decisions.isPending}
                isError={decisions.isError}
                error={decisions.error}
                onRetry={() => void decisions.refetch()}
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
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {/* Qué decidió esta persona, y aparte en qué terminó el
                            reporte. No son lo mismo: uno que validó puede
                            haberlo cancelado después el municipio. */}
                        {report.validation && (
                          <Badge
                            variant="secondary"
                            className={
                              report.validation.outcome === 'validado'
                                ? 'bg-status-resolved/12 text-status-resolved'
                                : 'bg-status-rejected/12 text-status-rejected'
                            }
                          >
                            {labels.outcome[report.validation.outcome]}
                          </Badge>
                        )}
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
