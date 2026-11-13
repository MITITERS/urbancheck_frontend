import { Building2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { messages } from '@/config/messages'
import { useMunicipalityScope } from './context'

const t = messages.municipalityScope

/**
 * El selector de municipalidad del admin, en el header junto a «Panel
 * municipal». Gobierna todas las pantallas: se elige una vez y se ve toda la
 * información de esa ciudad.
 *
 * Con una sola municipalidad no hay nada que elegir: queda de solo lectura, con
 * el mismo aspecto, para que el admin igual vea cuál está mirando.
 */
export function MunicipalitySelector() {
  const { municipalities, current, select, isLoading } = useMunicipalityScope()
  const label = (id: number) => {
    const item = municipalities.find((municipality) => municipality.id === id)
    return item ? `${item.city}, ${item.province}` : ''
  }

  if (isLoading) return null

  if (!current) {
    return <span className="text-sm text-muted-foreground">{t.none}</span>
  }

  const readOnly = municipalities.length <= 1

  return (
    <Select
      value={String(current.id)}
      onValueChange={(value) => select(Number(value))}
      disabled={readOnly}
    >
      <SelectTrigger
        size="sm"
        className="max-w-60 gap-2 font-medium disabled:cursor-default disabled:opacity-100"
        aria-label={t.label}
        title={readOnly ? t.onlyOne : undefined}
      >
        <Building2 className="size-3.5 text-muted-foreground" aria-hidden />
        <SelectValue>{label(current.id)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {municipalities.map((municipality) => (
          <SelectItem key={municipality.id} value={String(municipality.id)}>
            {municipality.city}, {municipality.province}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
