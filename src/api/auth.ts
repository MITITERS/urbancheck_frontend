import { apiClient, createApiError } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { messages } from '@/config/messages'
import { storeToken } from '@/lib/session'
import { ROLES, type AuthUser, type Role } from '@/types/auth'

/**
 * Transport-level shapes. They mirror what the backend actually sends
 * (snake_case, allauth envelopes) and never leak past this module: the rest of
 * the app only sees `AuthUser`.
 */
interface AllauthSessionResponse {
  meta?: { session_token?: string }
}

interface BackendUser {
  id: number
  email: string
  name: string
  avatar?: string | null
  role: string
  municipality?: { id: number; city: string; province: string } | null
  must_change_password?: boolean
  is_work_account_active?: boolean
}

/**
 * The API sends roles in Spanish snake_case. The mapping is centralized here so
 * the rest of the panel works with a single set of constants. An unknown value
 * degrades to `CITIZEN`, the role with the fewest privileges.
 */
const ROLE_BY_API_VALUE: Record<string, Role> = {
  admin_plataforma: ROLES.PLATFORM_ADMIN,
  agente_municipal: ROLES.MUNICIPAL_AGENT,
  validador: ROLES.VALIDATOR,
  // C-10: sin esta entrada el operario caía en el default y el panel lo
  // trataba como ciudadano.
  operario: ROLES.OPERATOR,
  ciudadano: ROLES.CITIZEN,
}

export function normalizeRole(value: string): Role {
  return ROLE_BY_API_VALUE[value.toLowerCase()] ?? ROLES.CITIZEN
}

function toAuthUser(user: BackendUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar ?? null,
    role: normalizeRole(user.role),
    municipality: user.municipality ?? null,
    mustChangePassword: user.must_change_password ?? false,
    // Ausente en un backend anterior a la baja lógica de agentes: ahí la cuenta
    // se asume habilitada, que es como se comportaba.
    isActive: user.is_work_account_active ?? true,
  }
}

/** Exchanges credentials for a session token. Does not persist anything. */
export async function login(email: string, password: string): Promise<string> {
  const { data } = await apiClient.post<AllauthSessionResponse>(endpoints.auth.login, {
    email,
    password,
  })
  const token = data.meta?.session_token
  if (!token) {
    throw createApiError(500, messages.errors.unexpected)
  }
  return token
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.get<BackendUser>(endpoints.users.me)
  return toAuthUser(data)
}

export async function logout(): Promise<void> {
  try {
    await apiClient.delete(endpoints.auth.session)
  } catch {
    // allauth answers the session delete with a 401 (the session is already
    // dead), and a logout must succeed locally even if the server is down.
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const { data } = await apiClient.post<AllauthSessionResponse>(
    endpoints.auth.changePassword,
    { current_password: currentPassword, new_password: newPassword },
  )
  // allauth rota el token de esta sesión y cierra las demás (N-04): sin
  // guardar el nuevo, el pedido siguiente iba con uno que ya no vale.
  const rotated = data?.meta?.session_token
  if (rotated) storeToken(rotated)
}
