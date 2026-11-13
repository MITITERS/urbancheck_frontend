import type { Control, FieldValues, Path } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface TextFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  description?: string
  type?: 'text' | 'email' | 'password'
  autoComplete?: string
  /** Ejemplo de lo que se espera. No reemplaza a `label`, la acompaña. */
  placeholder?: string
  /** Se llama cuando el usuario escribe, además de actualizar el formulario. */
  onValueChange?: (value: string) => void
}

/** React Hook Form input wired to the shadcn `Field` primitives. */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  type = 'text',
  autoComplete,
  placeholder,
  onValueChange,
}: TextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            {...field}
            id={field.name}
            type={type}
            autoComplete={autoComplete}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
            onChange={(event) => {
              field.onChange(event)
              onValueChange?.(event.target.value)
            }}
          />
          {description && !fieldState.invalid && (
            <FieldDescription>{description}</FieldDescription>
          )}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
