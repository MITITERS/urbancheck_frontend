/**
 * Roles that exist across the whole UrbanCheck platform. Only the platform
 * admin and the municipal agent use this panel; citizens, validators and
 * operators use the mobile app.
 */
export const ROLES = {
  PLATFORM_ADMIN: 'ADMIN_PLATAFORMA',
  MUNICIPAL_AGENT: 'AGENTE_MUNICIPAL',
  VALIDATOR: 'VALIDADOR',
  OPERATOR: 'OPERARIO',
  CITIZEN: 'CIUDADANO',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

/** The only roles allowed to reach an authenticated route of this panel. */
export const PANEL_ROLES: readonly Role[] = [
  ROLES.PLATFORM_ADMIN,
  ROLES.MUNICIPAL_AGENT,
]

/**
 * Los dos lados de una tabla de cuentas de trabajo. `inactive` es lo que el
 * panel llama «archivadas»: la cuenta existe, pero no trabaja y por eso no
 * estorba en el listado principal.
 */
export type AccountState = 'active' | 'inactive'

export interface Municipality {
  id: number
  city: string
  province: string
  /**
   * Presente en las respuestas del panel. Una cuenta de trabajo cuya
   * municipalidad está dada de baja no se puede reactivar, así que la fila
   * necesita saberlo sin pedir el municipio aparte.
   */
  is_active?: boolean
}

export interface AuthUser {
  id: number
  email: string
  name: string
  /** Foto de perfil. Nula mientras la cuenta no haya subido ninguna. */
  avatar: string | null
  role: Role
  /** Absent for the platform admin, who is not scoped to a municipality. */
  municipality: Municipality | null
  /**
   * True while the user still has the temporary password issued at creation.
   * Every route redirects to the change-password screen until it is false.
   */
  mustChangePassword: boolean
  /**
   * False when the platform admin deactivated this work account. The session is
   * still valid — the backend answers 403 to every panel endpoint — so the
   * guard stops it at the door and says why.
   */
  isActive: boolean
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export function isPanelRole(role: Role): boolean {
  return PANEL_ROLES.includes(role)
}
