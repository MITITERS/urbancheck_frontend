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
import { useCreateMunicipalAgent } from '../api/agents'

const MIN_PASSWORD_LENGTH = 8

const schema = z.object({
  name: z.string().trim().min(1, 'Ingresá el nombre del agente.'),
  email: z.string().trim().email('El correo no es válido.'),
  temporaryPassword: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Usá al menos ${MIN_PASSWORD_LENGTH} caracteres.`),
  municipalityId: z.string(),
})

type AgentForm = z.infer<typeof schema>

/** API field name -> form field name, for the backend validation errors. */
const FIELD_MAP = {
  temporary_password: 'temporaryPassword',
  municipality_id: 'municipalityId',
} as const

export function AgentFormDialog({
  municipality,
}: {
  /** La municipalidad del alta, fija: la que el admin eligió en el header. */
  municipality: Municipality
}) {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const createAgent = useCreateMunicipalAgent()

  const form = useForm<AgentForm>({
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
      await createAgent.mutateAsync({
        name: values.name,
        email: values.email,
        temporaryPassword: values.temporaryPassword,
        municipalityId: municipality.id,
      })
      toast.success(messages.agents.created)
      handleOpenChange(false)
    } catch (error) {
      setFormError(applyFieldErrors(error, form.setError, FIELD_MAP))
    }
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={<Button>{messages.agents.create}</Button>}
      title={messages.agents.createTitle}
      error={formError}
      isSubmitting={form.formState.isSubmitting}
      onSubmit={onSubmit}
    >
      <TextField control={form.control} name="name" label={messages.agents.name} />
      <TextField
        control={form.control}
        name="email"
        type="email"
        label={messages.agents.email}
      />
      <PasswordField
        control={form.control}
        name="temporaryPassword"
        autoComplete="new-password"
        label={messages.agents.temporaryPassword}
        description={messages.agents.temporaryPasswordHint}
      />
      <FixedMunicipalityField
        label={messages.agents.municipality}
        municipality={municipality}
      />
    </FormDialog>
  )
}
