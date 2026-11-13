import { Building2 } from 'lucide-react'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { messages } from '@/config/messages'
import type { Municipality } from '@/types/auth'

/**
 * La municipalidad de un alta, fija en la que el admin eligió en el header. Se
 * muestra como dato y no se cambia acá: para dar de alta en otra, se cambia el
 * selector del header.
 */
export function FixedMunicipalityField({
  label,
  municipality,
}: {
  label: string
  municipality: Municipality
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <p className="flex h-9 items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm">
        <Building2 className="size-4 text-muted-foreground" aria-hidden />
        {municipality.city}, {municipality.province}
      </p>
      <FieldDescription>{messages.municipalityScope.fixed}</FieldDescription>
    </Field>
  )
}
