import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
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
import { usePublicProfile, useReportsByAuthor } from '../api/publicProfile'

interface AuthorLinkProps {
  id: number
  name: string
}

function formatMonth(isoString: string) {
  return new Date(isoString).toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  })
}

/**
 * El nombre de un vecino, y su perfil detrás.
 *
 * Es un diálogo y no una página: el agente está triando un reporte y mandarlo a
 * otra ruta le hace perder eso de vista. Lo que necesita del vecino —cuánto
 * reportó acá, desde cuándo está— entra en una tarjeta.
 *
 * Las dos consultas se piden **solo al abrir**: el listado de un reporte puede
 * tener diez nombres y no tiene sentido traer diez perfiles que nadie miró.
 */
export function AuthorLink({ id, name }: AuthorLinkProps) {
  const [open, setOpen] = useState(false)
  const profile = usePublicProfile(open ? id : null)
  const reports = useReportsByAuthor(open ? id : null)

  return (
    <>
      <button
        type="button"
        className="font-medium text-primary underline-offset-4 hover:underline"
        onClick={() => setOpen(true)}
      >
        {name}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/*
          Medida fija: el diálogo no cambia de tamaño según cuántos reportes
          tenga la persona, que es lo que lo hacía saltar de una fila a diez.
          `flex` pisa la grilla del componente base para que la lista sea la
          única zona que scrollea, y `overflow-hidden` corta el desborde
          horizontal —una grilla no achica a sus hijos por debajo de su
          contenido, y una dirección larga estiraba el modal entero—.
        */}
        <DialogContent className="flex h-[28rem] max-h-[85vh] flex-col overflow-hidden sm:max-w-lg">
          <DialogHeader className="flex-row items-center gap-3 space-y-0">
            <PersonAvatar
              name={profile.data?.name || name}
              src={profile.data?.avatar}
              size="lg"
            />
            <div className="min-w-0">
              <DialogTitle className="truncate">
                {profile.data?.name || name}
              </DialogTitle>
              <DialogDescription>{messages.profile.title}</DialogDescription>
            </div>
          </DialogHeader>

          <QueryState
            isPending={profile.isPending}
            isError={profile.isError}
            error={profile.error}
            onRetry={() => void profile.refetch()}
          >
            {profile.data?.is_public ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {profile.data.date_joined && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" aria-hidden />
                    {messages.profile.memberSince}{' '}
                    {formatMonth(profile.data.date_joined)}
                  </span>
                )}
                <Badge variant="secondary">
                  {profile.data.report_count} {messages.profile.reports}
                </Badge>
              </div>
            ) : (
              // Se respeta la decisión del vecino sobre su perfil, aunque quien
              // mire sea del municipio: la privacidad es del dato público.
              <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                {messages.profile.private}
              </p>
            )}
          </QueryState>

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            {/* Los reportes sí se muestran siempre: son de la jurisdicción que
                esta persona ya gestiona, y los ve igual en su propio listado.
                El perfil no le enseña nada que no tuviera a un clic. */}
            <h3 className="shrink-0 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              {messages.profile.reportsHere}
            </h3>
            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pr-1">
              <QueryState
                isPending={reports.isPending}
                isError={reports.isError}
                error={reports.error}
                onRetry={() => void reports.refetch()}
                isEmpty={reports.data?.results.length === 0}
                emptyMessage={messages.profile.noReports}
              >
                <ul className="space-y-2">
                  {reports.data?.results.map((report) => (
                    <li
                      key={report.id}
                      className="flex items-center justify-between gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          #{report.number ?? report.id} ·{' '}
                          {messages.reports.category[report.category]}
                        </p>
                        {/* La dirección va acortada: el geocodificador devuelve
                            la jerarquía entera —municipio, pedanía, provincia,
                            país— y en una fila de dos renglones no informa. */}
                        <p
                          className="truncate text-xs text-muted-foreground"
                          title={report.address}
                        >
                          {shortAddress(report.address)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <ReportStatusBadge status={report.status} />
                        <Link
                          to={`/reportes/${report.id}`}
                          className="text-xs text-primary underline-offset-4 hover:underline"
                          onClick={() => setOpen(false)}
                        >
                          {messages.profile.openReport}
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
