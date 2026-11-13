import {
  CircleDashed,
  Construction,
  Footprints,
  Lightbulb,
  Trash2,
  TrafficCone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { messages } from '@/config/messages'
import type { ReportCategory as Category } from '../types'

/**
 * Un ícono por categoría.
 *
 * En una tabla de veinte filas la categoría es la columna que más se repite, y
 * seis palabras parecidas en el mismo lugar se leen como un bloque. El ícono la
 * vuelve reconocible antes de leerla; la palabra sigue estando, porque el ícono
 * solo no alcanza para distinguir «vereda» de «bache».
 */
const CATEGORY_ICON: Record<Category, typeof Construction> = {
  bache: Construction,
  alumbrado: Lightbulb,
  basura: Trash2,
  semaforo: TrafficCone,
  vereda: Footprints,
  otro: CircleDashed,
}

export function ReportCategoryLabel({
  category,
  className,
}: {
  category: Category
  className?: string
}) {
  const Icon = CATEGORY_ICON[category]

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      {messages.reports.category[category]}
    </span>
  )
}
