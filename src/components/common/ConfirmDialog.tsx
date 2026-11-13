import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { messages } from '@/config/messages'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  /** `destructive` for actions that take something away from the user. */
  variant?: 'default' | 'destructive'
  isPending?: boolean
  onConfirm: () => void
  /** Extra content between the description and the actions (e.g. a reason). */
  children?: ReactNode
}

/** Explicit confirmation for an action with consequences. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  variant = 'default',
  isPending = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="flex-row items-start gap-3 space-y-0">
          {/* Lo que le saca algo al usuario entra por el ojo antes que por la
              lectura: el disco rojo avisa de qué clase de confirmación se
              trata sin depender de que llegue hasta el botón. */}
          <span
            aria-hidden
            className={cn(
              'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
              variant === 'destructive'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-accent text-accent-foreground',
            )}
          >
            <TriangleAlert className="size-4.5" />
          </span>
          <div className="min-w-0 space-y-1.5">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {messages.common.cancel}
          </Button>
          {/*
            El rojo pleno va acá y no en la variante `destructive` del botón:
            esa variante es un rojo al 10%, y al lado del «Cancelar» con borde
            la acción que elimina algo se leía como la opción menor de las dos.
            Es la acción principal del diálogo aunque sea la peligrosa.
          */}
          <Button
            variant={variant}
            size="lg"
            className={
              variant === 'destructive'
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : undefined
            }
            onClick={onConfirm}
            disabled={isPending}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
