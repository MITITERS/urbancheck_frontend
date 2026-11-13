import { AlertCircle, Loader2 } from 'lucide-react'
import { messages } from '@/config/messages'
import { cn } from '@/lib/utils'

/**
 * El lugar de una foto que todavía no terminó de difuminarse (US-042).
 *
 * Mismo criterio que `RemovedPhoto`: un hueco se lee como un error de carga.
 * Acá no falló nada —o falló, y hay que decirlo— y además el agente tiene que
 * entender por qué el vecino todavía no ve este reporte.
 */
export function ProcessingPhoto({
  failed = false,
  className,
}: {
  /** El difuminado se agotó sin poder procesarla: no se va a publicar. */
  failed?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg bg-muted px-3 py-4 text-sm text-muted-foreground',
        className,
      )}
    >
      {failed ? (
        <AlertCircle className="size-4 shrink-0" aria-hidden />
      ) : (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      )}
      {failed
        ? messages.reportDetail.photoFailed
        : messages.reportDetail.photoProcessing}
    </div>
  )
}
