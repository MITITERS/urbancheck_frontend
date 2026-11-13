import type { Municipality } from '@/types/auth'

/** Una dependencia municipal que resuelve reportes (US-039). */
export interface OperationalArea {
  id: number
  name: string
  contact_email: string
  contact_phone: string
  is_active: boolean
  /** Cuántos reportes tiene vinculados. Lo muestra el listado y la baja. */
  report_count: number
  /** Cuántos operarios la integran (US-044). */
  operator_count: number
  /** Jurisdicción del área. La necesita el admin para distinguir filas. */
  municipality: Municipality | null
  created_at: string
}

export interface OperationalAreaPayload {
  name: string
  contactEmail: string
  contactPhone: string
  /**
   * Solo la manda el admin de la plataforma: el agente no elige municipalidad,
   * el backend le asigna la suya.
   */
  municipalityId?: number
}

/** Un operario, tal como lo lista la ficha de su área (US-044). */
export interface Operator {
  id: number
  name: string
  email: string
  phone: string
  avatar: string | null
  municipality: Municipality | null
  operational_area: OperationalArea | null
  is_active_operator: boolean
  /** Cuántos reportes cerró: la cifra de actividad del rol. */
  closed_count: number
  must_change_password: boolean
}

export interface OperatorPayload {
  name: string
  email: string
  phone: string
  temporaryPassword: string
  areaId: number
}

export interface OperatorUpdatePayload {
  name?: string
  phone?: string
  areaId?: number
}
