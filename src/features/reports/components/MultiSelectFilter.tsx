import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { messages } from '@/config/messages'

interface MultiSelectFilterProps<T extends string> {
  label: string
  emptyLabel: string
  options: readonly T[]
  optionLabel: (value: T) => string
  selected: readonly T[]
  onChange: (values: T[]) => void
}

/** Dropdown with checkboxes: the OR inside one filter of US-012. */
export function MultiSelectFilter<T extends string>({
  label,
  emptyLabel,
  options,
  optionLabel,
  selected,
  onChange,
}: MultiSelectFilterProps<T>) {
  const toggle = (value: T) => {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    )
  }

  const summary =
    selected.length === 0
      ? emptyLabel
      : selected.length === 1
        ? optionLabel(selected[0])
        : messages.reports.filters.selected(selected.length)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          aria-label={label}
          className="w-full justify-between"
        >
          <span className="truncate">{summary}</span>
          <ChevronDown className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={selected.includes(option)}
            onCheckedChange={() => toggle(option)}
            onSelect={(event) => event.preventDefault()}
          >
            {optionLabel(option)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
