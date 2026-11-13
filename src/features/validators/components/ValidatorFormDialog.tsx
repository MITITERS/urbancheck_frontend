import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { FormDialog } from '@/components/common/FormDialog'
import { PasswordField } from '@/components/common/PasswordField'
import { TextField } from '@/components/common/TextField'
import { messages } from '@/config/messages'
import { FixedMunicipalityField } from '@/features/municipality-scope/FixedMunicipalityField'
import type { Municipality } from '@/types/auth'
import { applyFieldErrors } from '@/lib/forms'
import { useCreateValidator } from '../api/validators'

const MIN_PASSWORD_LENGTH = 8

const schema = z.object({
  name: z.string().trim().min(1, 'Ingresá el nombre del validador.'),
  email: z.string().trim().email('El correo no es válido.'),
  temporaryPassword: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Usá al menos ${MIN_PASSWORD_LENGTH} caracteres.`),
  // Vacío para el agente, que no elige: lo valida el refinamiento de abajo,
  // que solo exige el campo cuando el formulario lo muestra.
  municipalityId: z.string(),
})

type ValidatorForm = z.infer<typeof schema>

const FIELD_MAP = {
  temporary_password: 'temporaryPassword',
  municipality_id: 'municipalityId',
} as const

/**
 * Alta de validador, para los dos roles del panel.
 *
 * El agente no elige municipalidad: el backend le asigna la suya (US-035), así
 * que el selector no se dibuja. El admin de la plataforma no tiene jurisdicción
 * propia de la cual derivarla, así que la elige y es obligatoria. Quién es cada
 * uno lo decide `municipalities`: si llega la lista, hay selector.
 */
export function ValidatorFormDialog({
  municipality,
}: {
  /**
   * La municipalidad del alta, fija: la que el admin eligió en el header. Sin
   * esto —el agente— no se manda: el backend le asigna la suya.
   */
  municipality?: Municipality
}) {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const createValidator = useCreateValidator()

  const form = useForm<ValidatorForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      temporaryPassword: '',
      municipalityId: '',
    },
  })

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      form.reset()
      setFormError(null)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      await createValidator.mutateAsync({
        name: values.name,
        email: values.email,
        temporaryPassword: values.temporaryPassword,
        ...(municipality ? { municipalityId: municipality.id } : {}),
      })
      toast.success(messages.validators.created)
      handleOpenChange(false)
    } catch (error) {
      setFormError(applyFieldErrors(error, form.setError, FIELD_MAP))
    }
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={<Button>{messages.validators.create}</Button>}
      title={messages.validators.createTitle}
      error={formError}
      isSubmitting={form.formState.isSubmitting}
      onSubmit={onSubmit}
    >
      <TextField control={form.control} name="name" label={messages.validators.name} />
      <TextField
        control={form.control}
        name="email"
        type="email"
        label={messages.validators.email}
      />
      <PasswordField
        control={form.control}
        name="temporaryPassword"
        autoComplete="new-password"
        label={messages.validators.temporaryPassword}
        description={messages.validators.temporaryPasswordHint}
      />
      {municipality && (
        <FixedMunicipalityField
          label={messages.validators.municipality}
          municipality={municipality}
        />
      )}
    </FormDialog>
  )
}
