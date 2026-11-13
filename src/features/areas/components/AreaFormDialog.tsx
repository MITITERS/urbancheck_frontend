import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { FormDialog } from '@/components/common/FormDialog'
import { TextField } from '@/components/common/TextField'
import { messages } from '@/config/messages'
import { FixedMunicipalityField } from '@/features/municipality-scope/FixedMunicipalityField'
import type { Municipality } from '@/types/auth'
import { applyFieldErrors } from '@/lib/forms'
import { useCreateArea, useUpdateArea } from '../api/areas'
import type { OperationalArea } from '../types'

const schema = z.object({
  name: z.string().trim().min(1, 'Ingresá el nombre del área.'),
  contactEmail: z.string().trim().email('El correo no es válido.'),
  contactPhone: z
    .string()
    .trim()
    .min(1, 'Ingresá un teléfono de contacto.')
    .regex(
      /^\+?[0-9][0-9\s\-()]{5,29}$/,
      'El teléfono solo puede tener números, espacios, guiones, paréntesis y un «+» inicial.',
    ),
  // Vacío para el agente, que no elige: lo exige el refinamiento de abajo solo
  // cuando el formulario dibuja el selector.
  municipalityId: z.string(),
})

type AreaForm = z.infer<typeof schema>

const FIELD_MAP = {
  contact_email: 'contactEmail',
  contact_phone: 'contactPhone',
  municipality_id: 'municipalityId',
} as const

interface AreaFormDialogProps {
  /** Municipalidades entre las que elegir. Sin esto, no hay selector. */
  /** Solo en el alta del admin: la municipalidad elegida en el header. */
  municipality?: Municipality
  /** Cuando viene, el diálogo edita esa área en lugar de crear una nueva. */
  area?: OperationalArea
  trigger?: React.ReactNode
}

/**
 * Alta y edición de un área operativa, para los dos roles del panel.
 *
 * El agente no elige municipalidad: el backend le asigna la suya (US-039), así
 * que el selector no se dibuja. El admin de la plataforma no tiene jurisdicción
 * propia de la cual derivarla, así que la elige. Quién es cada uno lo decide
 * `municipalities`, igual que en el alta de validadores.
 *
 * Editar no ofrece el selector ni cuando lo mira el admin: la jurisdicción de
 * un área no se muda, y el backend ignora el campo en una edición.
 */
export function AreaFormDialog({ municipality, area, trigger }: AreaFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const isEdit = area !== undefined
  const createArea = useCreateArea()
  const updateArea = useUpdateArea(area?.id ?? 0)
  const mutation = isEdit ? updateArea : createArea
  // Editar no muda el área de jurisdicción: la municipalidad va solo en el alta.
  const fixedMunicipality = isEdit ? undefined : municipality

  const form = useForm<AreaForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: area?.name ?? '',
      contactEmail: area?.contact_email ?? '',
      contactPhone: area?.contact_phone ?? '',
      municipalityId: '',
    },
  })

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      form.reset({
        name: area?.name ?? '',
        contactEmail: area?.contact_email ?? '',
        contactPhone: area?.contact_phone ?? '',
        municipalityId: '',
      })
      setFormError(null)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      await mutation.mutateAsync({
        name: values.name,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        ...(fixedMunicipality ? { municipalityId: fixedMunicipality.id } : {}),
      })
      toast.success(isEdit ? messages.areas.updated : messages.areas.created)
      handleOpenChange(false)
    } catch (error) {
      setFormError(applyFieldErrors(error, form.setError, FIELD_MAP))
    }
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger ?? <Button>{messages.areas.create}</Button>}
      title={isEdit ? messages.areas.editTitle : messages.areas.createTitle}
      error={formError}
      isSubmitting={form.formState.isSubmitting}
      onSubmit={onSubmit}
    >
      <TextField
        control={form.control}
        name="name"
        label={messages.areas.name}
        placeholder={messages.areas.namePlaceholder}
      />
      <TextField
        control={form.control}
        name="contactEmail"
        type="email"
        label={messages.areas.contactEmail}
      />
      <TextField
        control={form.control}
        name="contactPhone"
        label={messages.areas.contactPhone}
        description={messages.areas.contactPhoneHint}
      />
      {fixedMunicipality && (
        <FixedMunicipalityField
          label={messages.areas.municipality}
          municipality={fixedMunicipality}
        />
      )}
    </FormDialog>
  )
}
