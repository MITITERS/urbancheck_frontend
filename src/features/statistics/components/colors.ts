import type { ReportCategory, ReportStatus } from '@/features/reports/types'

/** Los tonos del tema para cada categoría, en el orden del catálogo. */
export const CATEGORY_COLOR: Record<ReportCategory, string> = {
  bache: 'var(--chart-1)',
  alumbrado: 'var(--chart-2)',
  basura: 'var(--chart-3)',
  vereda: 'var(--chart-4)',
  semaforo: 'var(--chart-5)',
  otro: 'var(--muted-foreground)',
}

/**
 * Los mismos tonos que los puntos de `ReportStatusBadge`, para que un estado se
 * lea igual en la tabla y en el gráfico. Los intermedios van atenuados, como
 * en el badge.
 */
export const STATUS_COLOR: Record<ReportStatus, string> = {
  pendiente_validacion: 'var(--status-pending)',
  reportado: 'color-mix(in oklch, var(--status-in-progress) 60%, transparent)',
  en_proceso: 'var(--status-in-progress)',
  resuelto_pendiente_confirmacion:
    'color-mix(in oklch, var(--status-resolved) 45%, transparent)',
  resuelto: 'var(--status-resolved)',
  cancelado: 'var(--status-rejected)',
  archivado: 'var(--muted-foreground)',
}
