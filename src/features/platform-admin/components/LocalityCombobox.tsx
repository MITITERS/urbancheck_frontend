import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { messages } from '@/config/messages'
import type { Locality } from '../api/geo'

interface LocalityComboboxProps {
  id: string
  localities: Locality[]
  value: string
  isLoading: boolean
  /** Sin provincia elegida todavía no hay nada que listar. */
  disabled: boolean
  invalid: boolean
  onSelect: (locality: Locality) => void
}

/**
 * Selector de localidad: se escribe y la lista se filtra sola.
 *
 * Es un combobox y no un `select` porque una provincia puede tener más de
 * quinientas localidades: elegir de una lista sin poder tipear sería inusable.
 */
export function LocalityCombobox({
  id,
  localities,
  value,
  isLoading,
  disabled,
  invalid,
  onSelect,
}: LocalityComboboxProps) {
  const [open, setOpen] = useState(false)

  const placeholder = disabled
    ? messages.municipalities.cityNeedsProvince
    : isLoading
      ? messages.municipalities.cityLoading
      : messages.municipalities.cityPlaceholder

  return (
    /*
     * `modal` no está de adorno: este combobox vive dentro de un `Dialog`, que
     * bloquea el scroll de todo lo que quede fuera de su contenido. La lista se
     * renderiza en un portal colgado del `body`, o sea afuera, así que sin esto
     * la rueda del mouse no la mueve. En modo modal el popover instala su
     * propio bloqueo y se declara a sí mismo como la zona que sí puede scrollear.
     */
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          disabled={disabled || isLoading}
          className="justify-between font-normal"
        >
          <span className={cn(!value && 'text-muted-foreground')}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder={messages.municipalities.citySearch} />
          <CommandList>
            <CommandEmpty>{messages.municipalities.cityNoMatches}</CommandEmpty>
            <CommandGroup>
              {localities.map((locality) => (
                <CommandItem
                  key={locality.id}
                  value={locality.name}
                  onSelect={() => {
                    onSelect(locality)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'size-4',
                      locality.name === value ? 'opacity-100' : 'opacity-0',
                    )}
                    aria-hidden
                  />
                  {locality.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
