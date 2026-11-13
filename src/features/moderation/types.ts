import type {
  ContentComplaint,
  ModerationAppealStatus,
  ReportAuthor,
  ReportCategory,
  ReportStatus,
} from '@/features/reports/types'
import type { Municipality } from '@/types/auth'

/**
 * Una entrada de la bandeja de denuncias (US-049): **un reporte**, con todas sus
 * denuncias pendientes. Se resuelven juntas, en una sola decisión.
 */
export interface ModerationInboxEntry {
  id: number
  number: number | null
  category: ReportCategory
  status: ReportStatus
  description: string
  address: string
  /** Nula si no tiene, o si está retenida por una denuncia de dato personal. */
  photo: string | null
  created_at: string
  /** Nulo si el vecino borró su cuenta (N-09). */
  author: ReportAuthor | null
  pending_complaint_count: number
  oldest_complaint_at: string
  complaints: ContentComplaint[]
}

export type ModerationDecisionKind = 'discard' | 'dismiss'

export type ModerationAppealState = 'pending' | 'resolved'

/** Una apelación contra un descarte, tal como la ve el administrador. */
export interface ModerationAppeal {
  id: number
  status: ModerationAppealStatus
  reason: string
  created_at: string
  resolved_at: string | null
  resolved_by: ReportAuthor | null
  resolution_reason: string
  /** Nulo si el vecino borró su cuenta (N-09). */
  author: ReportAuthor | null
  report: {
    id: number
    number: number | null
    category: ReportCategory
    status: ReportStatus
    description: string
    address: string
    /** Nula si no tiene, o si está retenida por una denuncia de dato personal. */
    photo: string | null
    created_at: string
    municipality: Municipality
  }
  decision: {
    id: number
    reason: string
    previous_status: ReportStatus
    decided_by: ReportAuthor | null
    created_at: string
  }
  complaints: ContentComplaint[]
}

/** Los motivos de denuncia que resuelve el agente (US-049). */
export type ContentReason = 'contenido_inapropiado' | 'reporte_falso'

/**
 * Una decisión ya tomada sobre las denuncias por contenido de un reporte: la
 * pestaña «Resueltas» de Denuncias.
 */
export interface ResolvedModeration {
  id: number
  outcome: 'descartado' | 'desestimado'
  outcome_label: string
  /** El motivo de la decisión; si se descartó, es público. */
  reason: string
  decided_by: ReportAuthor | null
  created_at: string
  reverted_at: string | null
  reverted_by: ReportAuthor | null
  /** La denuncia más vieja que cerró la decisión. */
  received_at: string | null
  report: ModerationAppeal['report']
  complaints: ContentComplaint[]
}
