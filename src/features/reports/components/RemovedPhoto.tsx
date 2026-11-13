import { ImageOff } from 'lucide-react'
import { messages } from '@/config/messages'
import { cn } from '@/lib/utils'

/**
 * El lugar de una foto retirada por protección de datos (US-043).
 *
 * Se dibuja en vez de nada para que un reporte sin imagen no parezca un error
 * de carga: la foto existió y se sacó a propósito.
 */
export function RemovedPhoto({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg bg-muted px-3 py-4 text-sm text-muted-foreground',
        className,
      )}
    >
      <ImageOff className="size-4 shrink-0" aria-hidden />
      {messages.reportDetail.photoRemoved}
    </div>
  )
}
