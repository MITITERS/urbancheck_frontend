import { CalendarDays, X } from 'lucide-react'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { messages } from '@/config/messages'
import { cn } from '@/lib/utils'
import { formatDateOnly, parseDateOnly, toDateOnly } from '@/lib/format'

/** Lo que se muestra cuando no hay fecha elegida. Es también el formato. */
const PLACEHOLDER = 'dd/mm/aaaa'

interface DateFieldProps {
  id?: string
  /** La fecha en el formato de la API: `aaaa-mm-dd`, o vacío. */
  value: string
  onChange: (value: string) => void
  /** La última fecha elegible, en `aaaa-mm-dd`. Las posteriores se ven deshabilitadas. */
  max?: string
  className?: string
}

/**
 * Un campo de fecha que siempre se lee `dd/mm/aaaa`.
 *
 * Reemplaza al `input[type=date]` nativo, que **no** se puede formatear: el
 * orden de los campos lo decide el idioma del navegador, no la página ni el
 * `lang` del documento. Un panel en español abierto en un Chrome en inglés
 * mostraba `mm/dd/aaaa`, y en un filtro de rango eso no es un detalle
 * cosmético: `09/02` y `02/09` son dos meses distintos y nada en pantalla dice
 * cuál se está mirando.
 *
 * El valor que entra y sale sigue siendo el de la API (`aaaa-mm-dd`): lo único
 * que cambia es cómo se muestra y cómo se elige.
 */
export function DateField({ id, value, onChange, max, className }: DateFieldProps) {
  const selected = parseDateOnly(value)
  const last = max ? parseDateOnly(max) : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          size="lg"
          className={cn(
            'w-36 justify-start gap-2 font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          {selected ? formatDateOnly(value) : PLACEHOLDER}
          {selected && (
            // Limpiar una sola punta del rango sin tener que borrar el resto de
            // los filtros. Va como `span` y no como `button`: adentro del
            // disparador del popover, un botón anidado no es HTML válido.
            <span
              role="button"
              tabIndex={-1}
              aria-label={messages.reports.filters.clearDate}
              className="ml-auto rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              onPointerDown={(event) => {
                // Frena la apertura del popover: el clic es para borrar.
                event.preventDefault()
                event.stopPropagation()
                onChange('')
              }}
            >
              <X className="size-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={es}
          autoFocus
          selected={selected}
          defaultMonth={selected}
          disabled={last && { after: last }}
          endMonth={last}
          onSelect={(date) => onChange(date ? toDateOnly(date) : '')}
        />
      </PopoverContent>
    </Popover>
  )
}
