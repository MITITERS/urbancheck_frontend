import { useState } from 'react'
import { DateField } from '@/components/common/DateField'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { messages } from '@/config/messages'
import { toDateOnly } from '@/lib/format'
import { PERIOD_KEYS, type PeriodKey, type PeriodSelection } from '../types'

const t = messages.statistics

/**
 * El selector único de la sección (US-023, escenarios 3 a 6), en la cabecera.
 *
 * Gobierna todos los gráficos e indicadores a la vez: no hay un filtro por
 * tarjeta. Los períodos fijos se aplican al elegirlos; el rango personalizado
 * pide las dos fechas y se aplica con «Aplicar». Si el rango es inválido, se
 * dice por qué y queda aplicado el período anterior.
 */
export function PeriodSelector({
  selection,
  onApply,
}: {
  selection: PeriodSelection
  /** Devuelve el motivo del rechazo, o `null` si se aplicó. */
  onApply: (next: PeriodSelection) => string | null
}) {
  const [choice, setChoice] = useState<PeriodKey>(selection.period)
  const [start, setStart] = useState(selection.start ?? '')
  const [end, setEnd] = useState(selection.end ?? '')
  const [error, setError] = useState<string | null>(null)
  // El rango no puede incluir días futuros: el calendario ni los ofrece.
  const today = toDateOnly(new Date())

  const choose = (value: string) => {
    const period = value as PeriodKey
    setChoice(period)
    setError(null)
    if (period !== 'custom') onApply({ period })
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {choice === 'custom' && (
          <>
            <DateField
              id="statistics-start"
              value={start}
              onChange={setStart}
              max={today}
              className="w-40"
            />
            <span className="text-sm text-muted-foreground">–</span>
            <DateField
              id="statistics-end"
              value={end}
              onChange={setEnd}
              max={today}
              className="w-40"
            />
            <Button
              variant="outline"
              onClick={() => setError(onApply({ period: 'custom', start, end }))}
            >
              {t.apply}
            </Button>
          </>
        )}
        <Select value={choice} onValueChange={choose}>
          <SelectTrigger className="w-48" aria-label={t.periodLabel}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {PERIOD_KEYS.map((key) => (
              <SelectItem key={key} value={key}>
                {t.periods[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error && <FieldError errors={[{ message: error }]} />}
    </div>
  )
}
