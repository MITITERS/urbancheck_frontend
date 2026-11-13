import { Link } from 'react-router-dom'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { messages } from '@/config/messages'
import type { OperationalArea } from '@/features/areas/types'

interface AreaSelectFieldProps {
  areas: OperationalArea[]
  value: string
  onChange: (value: string) => void
  error: string | null
}

/**
 * El selector de área operativa, compartido por procesar y por reasignar.
 *
 * Ofrece únicamente áreas activas —las trae el endpoint con `?state=active`—,
 * y cuando la municipalidad no tiene ninguna dibuja el estado vacío del
 * escenario 4 con el acceso directo a la gestión, en lugar de un desplegable
 * sin opciones que no explica nada.
 */
export function AreaSelectField({
  areas,
  value,
  onChange,
  error,
}: AreaSelectFieldProps) {
  if (areas.length === 0) {
    return (
      <div className="space-y-2 rounded-lg border border-dashed bg-muted/40 p-3">
        <p className="text-sm text-muted-foreground">{messages.reportDetail.noAreas}</p>
        <Link
          to="/areas"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {messages.reportDetail.manageAreas}
        </Link>
      </div>
    )
  }

  return (
    <Field data-invalid={error !== null}>
      <FieldLabel htmlFor="transition-area">
        {messages.reportDetail.areaLabel}
      </FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="transition-area" aria-invalid={error !== null}>
          <SelectValue placeholder={messages.reportDetail.areaPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {areas.map((area) => (
            <SelectItem key={area.id} value={String(area.id)}>
              {area.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <FieldError errors={[{ message: error }]} />}
    </Field>
  )
}
