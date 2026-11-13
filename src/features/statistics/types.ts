import type { ReportCategory, ReportStatus } from '@/features/reports/types'

/** Las ventanas del selector (US-023, escenario 4). */
export const PERIOD_KEYS = ['7d', '30d', '12m', 'custom'] as const
export type PeriodKey = (typeof PERIOD_KEYS)[number]

/** Sin elegir nada, la sección arranca con los últimos 30 días (escenario 5). */
export const DEFAULT_PERIOD: PeriodKey = '30d'

/** El período pedido. Las fechas van en `aaaa-mm-dd` y solo con `custom`. */
export interface PeriodSelection {
  period: PeriodKey
  start?: string
  end?: string
}

/** Una barra de una distribución: valor absoluto y porcentaje del total. */
export interface DistributionBucket<K extends string = string> {
  key: K
  label: string
  count: number
  /** Nulo si el período no tiene reportes: no hay porcentaje sobre cero. */
  percentage: number | null
}

/** Un tiempo promedio con su tamaño de muestra (US-050, escenario 11). */
export interface AverageTime {
  /** Nulo si no hubo casos: no es cero, que se leería como instantáneo. */
  avg_seconds: number | null
  sample_size: number
}

export interface OpenReports {
  status: ReportStatus
  label: string
  count: number
  /** Desde cuándo está en ese estado el que más lleva esperando. */
  oldest_since: string | null
  oldest_age_seconds: number | null
}

/** Los indicadores de gestión (US-050), sobre el mismo período. */
export interface Indicators {
  validation: { overall: AverageTime; field: AverageTime; collective: AverageTime }
  assignment: AverageTime
  resolution: AverageTime
  open: OpenReports[]
  appealed_closures: {
    closures: number
    appealed: number
    percentage: number | null
    /** Desde qué porcentaje se destaca; lo configura el servidor. */
    alert_threshold: number
    above_threshold: boolean
  }
  cancellations: { field_rejection: number; moderation: number; municipal: number }
  archived_by_inactivity: number
}

/** La respuesta entera de la sección: un solo pedido para toda la pantalla. */
export interface Statistics {
  /** La ventana que se aplicó de verdad, ya resuelta por el servidor. */
  period: { key: PeriodKey; start: string; end: string }
  total: number
  by_category: DistributionBucket<ReportCategory>[]
  by_status: DistributionBucket<ReportStatus>[]
  indicators: Indicators
}
