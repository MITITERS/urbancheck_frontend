import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FormAlert } from '@/components/common/FormAlert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { messages } from '@/config/messages'

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactNode
  title: string
  description?: string
  /** Form-level error, shown above the actions. */
  error?: string | null
  isSubmitting: boolean
  submitLabel?: string
  onSubmit: () => void
  children: ReactNode
}

/**
 * A modal wrapping a form: same layout, same error placement and same pair of
 * actions everywhere in the panel.
 */
export function FormDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  error,
  isSubmitting,
  submitLabel = messages.common.save,
  onSubmit,
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <FieldGroup>{children}</FieldGroup>
          {error && <FormAlert message={error} className="mt-4" />}
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {messages.common.cancel}
            </Button>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? messages.common.saving : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
