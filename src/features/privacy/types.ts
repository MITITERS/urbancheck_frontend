import type { ReportCategory, ReportStatus } from '@/features/reports/types'

/** Qué pasó con la solicitud. `pendiente` es la única que espera decisión. */
export type PrivacyRequestStatus = 'pendiente' | 'imagen_eliminada' | 'desestimada'

/** Las dos pestañas de la bandeja: lo que espera y el registro de lo resuelto. */
export type PrivacyRequestState = 'pending' | 'resolved'

interface PrivacyRequestPerson {
  id: number
  name: string
  email: string
}

/**
 * Una solicitud de revisión por dato personal visible (US-043), tal como la ve
 * el administrador de la plataforma.
 */
export interface PrivacyRequest {
  id: number
  reason: 'dato_personal'
  reason_label: string
  status: PrivacyRequestStatus
  /** Recepción: el plazo de la RN-12 corre desde acá y desde nada más. */
  received_at: string
  deadline: string
  /** Negativo si venció. Nulo en las resueltas, donde ya no corre. */
  remaining_seconds: number | null
  is_overdue: boolean
  resolved_at: string | null
  resolved_by: PrivacyRequestPerson | null
  /** Si se resolvió dentro del plazo: la evidencia de cumplimiento. */
  resolved_within_deadline: boolean | null
  image: {
    /**
     * La foto del reporte, la de un cierre del operario (escenario 11) o la de
     * una objeción del autor (escenario 1).
     */
    kind: 'report' | 'resolution_evidence' | 'resolution_appeal'
    evidence_id: number | null
    appeal_id: number | null
    /**
     * Nula si se eliminó, o si el autor la reemplazó mientras tanto: lo que se
     * mostraría entonces no es lo que se denunció.
     */
    url: string | null
  }
  report: {
    id: number
    number: number | null
    description: string
    category: ReportCategory
    status: ReportStatus
    address: string
    municipality: { id: number; city: string; province: string }
  }
  reporter: PrivacyRequestPerson | null
}
