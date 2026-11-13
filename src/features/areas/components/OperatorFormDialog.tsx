import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormDialog } from '@/components/common/FormDialog'
import { PasswordField } from '@/components/common/PasswordField'
import { TextField } from '@/components/common/TextField'
import { messages } from '@/config/messages'
import { applyFieldErrors } from '@/lib/forms'
import { useCreateOperator, useUpdateOperator } from '../api/operators'
import type { OperationalArea, Operator } from '../types'

const MIN_PASSWORD_LENGTH = 8

const PHONE = /^\+?[0-9][0-9\s\-()]{5,29}$/
const PHONE_MESSAGE =
  'El teléfono solo puede tener números, espacios, guiones, paréntesis y un «+» inicial.'

/**
 * Un solo formulario para el alta y la edición, con la misma forma en los dos
 * casos: dos esquemas de tipos distintos no se pueden pasar al mismo
 * `useForm`. Lo que cambia son las reglas de los campos que solo existen en el
 * alta, y esos campos tampoco se dibujan al editar.
 */
const baseSchema = z.object({
  name: z.string().trim().min(1, 'Ingresá el nombre del operario.'),
  phone: z.string().trim().min(1, 'Ingresá un teléfono.').regex(PHONE, PHONE_MESSAGE),
  areaId: z.string().min(1, 'Elegí un área operativa activa.'),
  email: z.string(),
  temporaryPassword: z.string(),
})

const createSchema = baseSchema.extend({
  email: z.string().trim().email('El correo no es válido.'),
  temporaryPassword: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Usá al menos ${MIN_PASSWORD_LENGTH} caracteres.`),
})

type CreateForm = z.infer<typeof baseSchema>

const FIELD_MAP = {
  temporary_password: 'temporaryPassword',
  operational_area_id: 'areaId',
} as const

interface OperatorFormDialogProps {
  /** Áreas activas entre las que puede vivir el operario (US-044). */
  areas: OperationalArea[]
  /** Área preseleccionada: la ficha desde la que se abrió el formulario. */
  defaultAreaId: number
  /** Cuando viene, el diálogo edita ese operario en lugar de crear uno. */
  operator?: Operator
  trigger?: React.ReactNode
}

/**
 * Alta y edición de un operario, siempre dentro del contexto de un área.
 *
 * El email no se edita: es la identidad con la que inicia sesión. Por eso el
 * formulario de edición no lo dibuja y tampoco pide contraseña — la temporal se
 * define una sola vez, en el alta, con el mismo circuito de US-035.
 */
export function OperatorFormDialog({
  areas,
  defaultAreaId,
  operator,
  trigger,
}: OperatorFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const isEdit = operator !== undefined
  const createOperator = useCreateOperator()
  const updateOperator = useUpdateOperator(operator?.id ?? 0)

  const defaults: CreateForm = {
    name: operator?.name ?? '',
    email: operator?.email ?? '',
    phone: operator?.phone ?? '',
    temporaryPassword: '',
    areaId: String(operator?.operational_area?.id ?? defaultAreaId),
  }

  const form = useForm<CreateForm>({
    resolver: zodResolver(isEdit ? baseSchema : createSchema),
    defaultValues: defaults,
  })

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      form.reset(defaults)
      setFormError(null)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      if (isEdit) {
        await updateOperator.mutateAsync({
          name: values.name,
          phone: values.phone,
          areaId: Number(values.areaId),
        })
      } else {
        await createOperator.mutateAsync({
          name: values.name,
          email: values.email,
          phone: values.phone,
          temporaryPassword: values.temporaryPassword,
          areaId: Number(values.areaId),
        })
      }
      toast.success(isEdit ? messages.operators.updated : messages.operators.created)
      handleOpenChange(false)
    } catch (error) {
      setFormError(applyFieldErrors(error, form.setError, FIELD_MAP))
    }
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={
        trigger ?? (
          <Button disabled={areas.length === 0}>{messages.operators.create}</Button>
        )
      }
      title={isEdit ? messages.operators.editTitle : messages.operators.createTitle}
      error={formError}
      isSubmitting={form.formState.isSubmitting}
      onSubmit={onSubmit}
    >
      <TextField control={form.control} name="name" label={messages.operators.name} />
      {!isEdit && (
        <TextField
          control={form.control}
          name="email"
          type="email"
          label={messages.operators.email}
        />
      )}
      <TextField control={form.control} name="phone" label={messages.operators.phone} />
      {!isEdit && (
        <PasswordField
          control={form.control}
          name="temporaryPassword"
          autoComplete="new-password"
          label={messages.operators.temporaryPassword}
          description={messages.operators.temporaryPasswordHint}
        />
      )}
      <Controller
        control={form.control}
        name="areaId"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{messages.operators.area}</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={field.name} aria-invalid={fieldState.invalid}>
                <SelectValue placeholder={messages.operators.areaPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {/* Solo áreas activas: un operario no puede existir sin un área
                    activa que lo contenga (escenario 4). */}
                {areas.map((area) => (
                  <SelectItem key={area.id} value={String(area.id)}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FormDialog>
  )
}
