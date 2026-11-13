import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { messages } from '@/config/messages'
import { PAGE_SIZE_OPTIONS } from '../types'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  hasPrevious: boolean
  hasNext: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function Pagination({
  page,
  pageSize,
  total,
  hasPrevious,
  hasNext,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="mt-4 flex items-center justify-between gap-4 border-t pt-4">
      <div className="flex items-center gap-3">
        <p className="tabular text-sm text-muted-foreground">
          {messages.reports.pagination.summary(from, to, total)}
        </p>
        {/* Cuántas filas conviene ver depende de qué se esté haciendo: revisar
            el día son pocas, barrer un mes son muchas. */}
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger
            size="sm"
            className="w-auto gap-1.5"
            aria-label={messages.reports.pagination.pageSize}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {messages.reports.pagination.perPage(size)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="lg"
          disabled={!hasPrevious}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden />
          {messages.reports.pagination.previous}
        </Button>
        <Button
          variant="outline"
          size="lg"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
        >
          {messages.reports.pagination.next}
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
