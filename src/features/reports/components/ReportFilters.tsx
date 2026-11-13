import { useEffect, useState, type ReactNode } from 'react'
import { ChevronDown, ScanSearch, Search, SlidersHorizontal, X } from 'lucide-react'
import { DateField } from '@/components/common/DateField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { toDateOnly } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { messages } from '@/config/messages'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  REPORT_CATEGORIES,
  REPORT_STATUS_ORDER,
  type ReportCategory,
  type ReportFilters as Filters,
  type ReportOrdering,
  type ReportStatus,
} from '../types'
import { MultiSelectFilter } from './MultiSelectFilter'

const ZONE_DEBOUNCE_MS = 350

const ORDERING_LABELS: Record<ReportOrdering, string> = {
  '-created_at': messages.reports.ordering.newest,
  created_at: messages.reports.ordering.oldest,
  '-like_count': messages.reports.ordering.mostLiked,
  like_count: messages.reports.ordering.leastLiked,
}

/**
 * Un filtro con su rótulo.
 *
 * Estado y categoría no tenían rótulo visible —solo `aria-label`— y quedaban
 * desalineados con los otros cuatro, que sí lo tenían. Con todos rotulados
 * igual, la barra se lee como una sola fila de controles y no como dos grupos
 * distintos que casualmente están juntos.
 */
function FilterField({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  className?: string
  children: ReactNode
}) {
  return (
    // `min-w-0`: el control ocupa la celda de la grilla y no la desborda.
    <div className={cn('grid min-w-0 gap-1.5', className)}>
      <Label
        htmlFor={htmlFor}
        className="text-xs font-medium tracking-wide text-muted-foreground"
      >
        {label}
      </Label>
      {children}
    </div>
  )
}

interface ReportFiltersProps {
  filters: Filters
  orderings: readonly ReportOrdering[]
  isFiltered: boolean
  onChange: (patch: Partial<Filters>) => void
  onClear: () => void
}

export function ReportFilters({
  filters,
  orderings,
  isFiltered,
  onChange,
  onClear,
}: ReportFiltersProps) {
  // El input de texto se maneja local y se propaga con debounce, para no
  // disparar una request por tecla.
  // La barra arranca cerrada, para que la tabla quede arriba. Si hay filtros
  // aplicados, el botón lo dice aunque esté cerrada.
  const [open, setOpen] = useState(false)
  const [zoneDraft, setZoneDraft] = useState(filters.zone)
  const [syncedZone, setSyncedZone] = useState(filters.zone)
  const debouncedZone = useDebouncedValue(zoneDraft, ZONE_DEBOUNCE_MS)
  // Se filtra por fecha de creación: un día futuro nunca tiene reportes.
  const today = toDateOnly(new Date())

  // Si la URL cambia desde afuera —el botón de limpiar, el botón atrás del
  // navegador— el borrador se reajusta durante el render, que es el patrón que
  // React recomienda para esto en lugar de un efecto.
  if (filters.zone !== syncedZone) {
    setSyncedZone(filters.zone)
    setZoneDraft(filters.zone)
  }

  useEffect(() => {
    if (debouncedZone !== filters.zone) onChange({ zone: debouncedZone })
    // `filters.zone` queda fuera a propósito: el efecto reacciona al debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedZone])

  return (
    // Una grilla de cuatro columnas, sin scroll horizontal: arriba qué se busca
    // —estado, categoría y la zona, que es texto libre y ocupa dos celdas—, y
    // abajo el rango de fechas junto, la revisión y el orden. En pantallas
    // angostas pasa a dos columnas y a una, en el mismo orden. Todos los
    // controles llenan su celda, así las filas quedan alineadas.
    <div className="rounded-xl border bg-muted/40">
      <div className="flex items-center justify-between gap-2 p-2">
        <Button
          type="button"
          variant="ghost"
          aria-expanded={open}
          aria-controls="report-filters"
          onClick={() => setOpen((value) => !value)}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          {messages.reports.filters.toggle}
          {isFiltered && (
            <Badge variant="secondary">{messages.reports.filters.active}</Badge>
          )}
          <ChevronDown
            className={cn('size-4 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </Button>
        {/* Limpiar queda en la cabecera: se alcanza también con la barra
            cerrada. */}
        {isFiltered && (
          <Button variant="ghost" onClick={onClear} className="text-muted-foreground">
            <X className="size-4" aria-hidden />
            {messages.reports.filters.clear}
          </Button>
        )}
      </div>

      {/* Cerrada se oculta con `hidden` y no se desmonta: el texto de la zona
          que se está escribiendo no se pierde al cerrarla. */}
      <div
        id="report-filters"
        hidden={!open}
        className="grid grid-cols-1 items-end gap-3 border-t p-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <FilterField label={messages.reports.filters.status}>
          <MultiSelectFilter
            label={messages.reports.filters.status}
            emptyLabel={messages.reports.filters.allStatuses}
            options={REPORT_STATUS_ORDER}
            optionLabel={(status: ReportStatus) => messages.reports.status[status]}
            selected={filters.statuses}
            onChange={(statuses) => onChange({ statuses })}
          />
        </FilterField>

        <FilterField label={messages.reports.filters.category}>
          <MultiSelectFilter
            label={messages.reports.filters.category}
            emptyLabel={messages.reports.filters.allCategories}
            options={REPORT_CATEGORIES}
            optionLabel={(category: ReportCategory) =>
              messages.reports.category[category]
            }
            selected={filters.categories}
            onChange={(categories) => onChange({ categories })}
          />
        </FilterField>

        <FilterField
          label={messages.reports.filters.zone}
          htmlFor="zone-filter"
          className="sm:col-span-2"
        >
          <InputGroup className="w-full bg-background">
            <InputGroupAddon>
              <Search className="size-4" aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              id="zone-filter"
              value={zoneDraft}
              placeholder={messages.reports.filters.zonePlaceholder}
              onChange={(event) => setZoneDraft(event.target.value)}
            />
          </InputGroup>
        </FilterField>

        <FilterField
          label={messages.reports.filters.createdFrom}
          htmlFor="created-from"
        >
          <DateField
            id="created-from"
            className="w-full bg-background"
            value={filters.createdFrom}
            onChange={(createdFrom) => onChange({ createdFrom })}
            max={today}
          />
        </FilterField>

        <FilterField label={messages.reports.filters.createdTo} htmlFor="created-to">
          <DateField
            id="created-to"
            className="w-full bg-background"
            value={filters.createdTo}
            onChange={(createdTo) => onChange({ createdTo })}
            max={today}
          />
        </FilterField>

        <FilterField label={messages.reports.filters.review}>
          {/* Los cierres que la comparación automática señaló (US-015), para
            revisarlos antes de que venza la ventana de objeción. */}
          <Button
            type="button"
            variant={filters.closureReview ? 'default' : 'outline'}
            size="lg"
            aria-pressed={filters.closureReview}
            className={cn('w-full', !filters.closureReview && 'bg-background')}
            onClick={() => onChange({ closureReview: !filters.closureReview })}
          >
            <ScanSearch className="size-4" aria-hidden />
            {messages.reports.filters.closureReview}
          </Button>
        </FilterField>

        <FilterField label={messages.reports.filters.ordering} htmlFor="ordering">
          <Select
            value={filters.ordering}
            onValueChange={(value) => onChange({ ordering: value as ReportOrdering })}
          >
            <SelectTrigger id="ordering" className="w-full bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {orderings.map((ordering) => (
                <SelectItem key={ordering} value={ordering}>
                  {ORDERING_LABELS[ordering]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      </div>
    </div>
  )
}
