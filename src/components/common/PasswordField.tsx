import { useState } from 'react'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Eye, EyeOff } from 'lucide-react'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { messages } from '@/config/messages'
import { cn } from '@/lib/utils'

interface PasswordFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  description?: string
  autoComplete?: 'current-password' | 'new-password'
}

/**
 * Campo de contraseña con la opción de ver lo que se está escribiendo.
 *
 * El botón es `type="button"` a propósito: dentro de un formulario, un botón
 * sin tipo envía el formulario, y mostrar la contraseña terminaría intentando
 * un login a medio escribir.
 *
 * El campo arranca siempre oculto: mostrarlo es una decisión explícita de quien
 * está escribiendo, no el default.
 */
export function PasswordField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  autoComplete = 'current-password',
}: PasswordFieldProps<T>) {
  const [visible, setVisible] = useState(false)

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <div className="relative">
            <Input
              {...field}
              id={field.name}
              type={visible ? 'text' : 'password'}
              autoComplete={autoComplete}
              aria-invalid={fieldState.invalid}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              aria-label={
                visible ? messages.auth.hidePassword : messages.auth.showPassword
              }
              aria-pressed={visible}
              className={cn(
                'absolute inset-y-0 right-0 flex w-10 items-center justify-center',
                'text-muted-foreground transition-colors hover:text-foreground',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              )}
            >
              {visible ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          {description && !fieldState.invalid && (
            <FieldDescription>{description}</FieldDescription>
          )}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
