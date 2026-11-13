import { useState } from 'react'
import { Eye } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { messages } from '@/config/messages'

interface ReasonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  variant?: 'default' | 'destructive'
  isPending?: boolean
  /** Aviso destacado antes del campo: que el motivo será público. */
  warning?: string
  label?: string
  onConfirm: (reason: string) => void
}

/**
 * Confirmación con motivo obligatorio (US-049, escenario 5).
 *
 * Toda decisión de moderación lleva motivo, en los dos sentidos, y el servidor
 * lo vuelve a exigir: esto solo evita el viaje de ida y vuelta.
 */
export function ReasonDialog({
  open,
  onOpenChange,
  warning,
  label = messages.moderation.reasonLabel,
  onConfirm,
  ...props
}: ReasonDialogProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const close = (next: boolean) => {
    if (!next) {
      setReason('')
      setError(null)
    }
    onOpenChange(next)
  }

  const confirm = () => {
    if (reason.trim() === '') {
      setError(messages.moderation.reasonRequired)
      return
    }
    onConfirm(reason.trim())
  }

  return (
    <ConfirmDialog {...props} open={open} onOpenChange={close} onConfirm={confirm}>
      {warning && (
        <p
          role="note"
          className="flex items-start gap-2 rounded-lg bg-status-pending/10 px-3 py-2.5 text-sm text-status-pending ring-1 ring-status-pending/25 ring-inset"
        >
          <Eye className="mt-0.5 size-4 shrink-0" aria-hidden />
          {warning}
        </p>
      )}
      <Field data-invalid={error !== null}>
        <FieldLabel htmlFor="moderation-reason">{label}</FieldLabel>
        <Textarea
          id="moderation-reason"
          value={reason}
          placeholder={messages.moderation.reasonPlaceholder}
          aria-invalid={error !== null}
          onChange={(event) => {
            setReason(event.target.value)
            setError(null)
          }}
        />
        {error && <FieldError errors={[{ message: error }]} />}
      </Field>
    </ConfirmDialog>
  )
}
