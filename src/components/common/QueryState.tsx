import type { ReactNode } from 'react'
import { Inbox, TriangleAlert } from 'lucide-react'
import { isApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { messages } from '@/config/messages'

interface QueryStateProps {
  isPending: boolean
  isError: boolean
  error?: unknown
  onRetry?: () => void
  /** Rendered instead of the children when the query resolved to nothing. */
  isEmpty?: boolean
  emptyMessage?: string
  children: ReactNode
}

/** Cuántas filas dibuja el esqueleto mientras carga un listado. */
const SKELETON_ROWS = 5

/**
 * Loading, error and empty states for a query-backed view, in one place.
 *
 * Every listing of the panel goes through it so none of them can end up as a
 * blank table: the three states are always resolved explicitly.
 */
export function QueryState({
  isPending,
  isError,
  error,
  onRetry,
  isEmpty = false,
  emptyMessage = messages.common.empty,
  children,
}: QueryStateProps) {
  if (isPending) {
    return (
      // El esqueleto imita la forma de lo que viene —una banda de encabezado y
      // filas parejas— para que la pantalla no salte cuando llegan los datos.
      <div className="space-y-2" role="status" aria-busy="true">
        <Skeleton className="h-10 w-full rounded-md" />
        <div className="space-y-px">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton
              key={index}
              className="h-12 w-full rounded-none first:rounded-t-md last:rounded-b-md"
              // Cada fila un poco más tenue que la anterior: sugiere que la
              // lista sigue hacia abajo en lugar de cortarse en seco.
              style={{ opacity: 1 - index * 0.14 }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
          >
            <TriangleAlert className="size-4" />
          </span>
          <p role="alert" className="pt-1.5 text-sm text-destructive">
            {isApiError(error) ? error.message : messages.common.loadError}
          </p>
        </div>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="ml-10.5">
            {messages.common.retry}
          </Button>
        )}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-10 text-center">
        <span
          aria-hidden
          className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <Inbox className="size-5" />
        </span>
        <p className="max-w-md text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return <>{children}</>
}
