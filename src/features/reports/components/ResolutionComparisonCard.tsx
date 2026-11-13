import { CircleCheck, ScanSearch, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { messages } from '@/config/messages'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ResolutionComparison } from '../types'

const copy = messages.reportDetail.comparison

/**
 * La comparación automática entre la foto del reporte y la del cierre (US-015).
 *
 * Va **presentada como sugerencia**, con la aclaración siempre visible: el
 * veredicto no cambia el estado ni el plazo de objeción, y el control efectivo
 * sobre un cierre mal hecho es la objeción del vecino. Por eso el tono es
 * neutro —no es ni un cierre ni una objeción— y solo el veredicto lleva color.
 *
 * Las dos fotos van lado a lado porque eso es lo que el agente tiene que mirar
 * para decidir si le cree al modelo.
 */
export function ResolutionComparisonCard({
  comparison,
  originalPhoto,
  resolutionPhoto,
}: {
  comparison: ResolutionComparison
  originalPhoto: string | null
  resolutionPhoto: string | null
}) {
  const completed = comparison.status === 'completada' && comparison.verdict !== null

  return (
    <section
      aria-label={copy.title}
      className="space-y-3 rounded-xl bg-muted/40 p-3.5 ring-1 ring-border ring-inset"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <Sparkles className="size-3.5" aria-hidden />
          {copy.title}
        </p>
        {completed && comparison.verdict && (
          <Badge
            variant="outline"
            className={cn(
              'gap-1 border-transparent ring-1 ring-inset',
              comparison.is_doubtful
                ? 'bg-status-pending/12 text-status-pending ring-status-pending/25'
                : 'bg-status-resolved/12 text-status-resolved ring-status-resolved/25',
            )}
          >
            {comparison.is_doubtful ? (
              <ScanSearch className="size-3" aria-hidden />
            ) : (
              <CircleCheck className="size-3" aria-hidden />
            )}
            {copy.verdict[comparison.verdict]}
          </Badge>
        )}
      </div>

      {completed ? (
        <div className="space-y-1">
          {comparison.explanation && (
            <p className="text-sm leading-relaxed">{comparison.explanation}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {copy.meta(
              comparison.model_name,
              formatDateTime(comparison.completed_at ?? comparison.requested_at),
            )}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {copy.status[comparison.status]}
        </p>
      )}

      {(originalPhoto || resolutionPhoto) && (
        <div className="grid gap-2 sm:grid-cols-2">
          <ComparedPhoto label={copy.before} src={originalPhoto} />
          <ComparedPhoto label={copy.after} src={resolutionPhoto} />
        </div>
      )}

      <p className="text-xs text-muted-foreground italic">{copy.disclaimer}</p>
    </section>
  )
}

function ComparedPhoto({ label, src }: { label: string; src: string | null }) {
  return (
    <figure className="space-y-1">
      {src ? (
        <img
          src={src}
          alt={label}
          className="aspect-4/3 w-full rounded-lg object-cover ring-1 ring-border"
        />
      ) : (
        <div className="aspect-4/3 w-full rounded-lg bg-muted ring-1 ring-border" />
      )}
      <figcaption className="text-xs text-muted-foreground">{label}</figcaption>
    </figure>
  )
}
