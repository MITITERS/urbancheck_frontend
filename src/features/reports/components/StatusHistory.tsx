import { messages } from '@/config/messages'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/format'
import type { StatusHistoryEntry } from '../types'

/**
 * Cómo se nombra el origen de una transición, o cadena vacía si no aporta.
 *
 * `manual` no se rotula: decir "manual" al lado del nombre de quien la ejecutó
 * es ruido. Los otros orígenes sí, porque son justamente los que la forma de la
 * transición no alcanza a distinguir.
 */
function originLabel(entry: StatusHistoryEntry): string {
  if (!entry.origin) return ''
  return messages.reportDetail.origin[entry.origin]
}

/** US-013, escenario 7: quién movió el reporte, cuándo, y por qué. */
export function StatusHistory({ entries }: { entries: StatusHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {messages.reportDetail.historyEmpty}
      </p>
    )
  }

  return (
    <ol>
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1

        return (
          <li
            key={`${entry.created_at}-${index}`}
            className="relative flex gap-3 pb-5 last:pb-0"
          >
            {/*
              Un punto por movimiento y una línea que los cose. El borde
              izquierdo que había antes se leía como el margen de una cita, no
              como una secuencia: sin marcas por entrada, no se veía dónde
              terminaba un cambio y empezaba el siguiente.
            */}
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={cn(
                  'mt-1 size-2 shrink-0 rounded-full ring-4',
                  index === 0
                    ? 'bg-primary ring-primary/15'
                    : 'bg-border ring-transparent',
                )}
              />
              {!isLast && (
                // Baja hasta el punto siguiente: la línea es lo que convierte
                // tres fechas sueltas en una secuencia.
                <span aria-hidden className="mt-1.5 -mb-5 w-px flex-1 bg-border" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {entry.previous_status
                  ? `${messages.reports.status[entry.previous_status]} → ${
                      messages.reports.status[entry.status]
                    }`
                  : messages.reportDetail.initialStatus}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(entry.created_at)}
                {/*
                  El origen reemplaza al nombre cuando no hay nombre: una
                  transición sin responsable individual —la validación
                  colectiva, la confirmación automática, el archivado por
                  inactividad— dejaba antes una línea con solo la fecha, que no
                  decía quién la había producido. Cuando sí hay responsable, el
                  origen igual aporta: distingue una validación en terreno de
                  una decisión del panel (US-038).
                */}
                {entry.changed_by ? ` · ${entry.changed_by.name}` : ''}
                {/*
                  El admin ejecuta las acciones con las reglas del agente: sin
                  esta marca, el asiento no deja ver que no fue el municipio
                  (C-15).
                */}
                {entry.changed_by_role === 'admin_plataforma'
                  ? ` (${messages.reportDetail.actedAsPlatformAdmin})`
                  : ''}
                {originLabel(entry) ? ` · ${originLabel(entry)}` : ''}
                {entry.confirmation_count !== null
                  ? ` · ${messages.reportDetail.collectiveConfirmations(
                      entry.confirmation_count,
                    )}`
                  : ''}
              </p>
              {entry.reason && (
                <p className="mt-1.5 rounded-md bg-muted/70 px-2.5 py-1.5 text-sm">
                  <span className="text-muted-foreground">
                    {messages.reportDetail.reason}:{' '}
                  </span>
                  {entry.reason}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
