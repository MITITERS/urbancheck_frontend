import { Info } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { messages } from '@/config/messages'

/**
 * El ícono de información junto al título de una tarjeta, con una explicación
 * de una o dos líneas de qué muestra.
 *
 * Es un popover y no un tooltip para que también se abra tocando, no solo al
 * pasar el mouse. Los textos siguen los cortes de
 * `urbancheck/reports/statistics.py` del backend.
 */
export function InfoHint({ card, text }: { card: string; text: string }) {
  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={messages.statistics.help.label(card)}
      >
        <Info className="size-4" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="text-sm text-muted-foreground">
        {text}
      </PopoverContent>
    </Popover>
  )
}

/** El título de una tarjeta con su ayuda al lado. */
export function TitleWithHint({ title, hint }: { title: string; hint: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {title}
      <InfoHint card={title} text={hint} />
    </span>
  )
}
