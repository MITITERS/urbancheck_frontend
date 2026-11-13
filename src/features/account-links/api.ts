import { apiClient, createApiError, isApiError } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { messages } from '@/config/messages'
import type { ApiError } from '@/types/api'

/**
 * Sin sesión, allauth responde **401** cuando el reset o la verificación salen
 * bien: el cambio está hecho y queda pendiente ingresar. Se acepta como
 * respuesta para que el interceptor no lo lea como una sesión vencida.
 */
const doneWithoutSession = (status: number) => status === 200 || status === 401

/** La clave del enlace es inválida, ya se usó o venció. */
function toLinkError(error: unknown): ApiError {
  if (isApiError(error) && error.fieldErrors.key) {
    return createApiError(error.status, messages.accountLinks.invalidLink)
  }
  return isApiError(error) ? error : createApiError(0, messages.errors.unexpected)
}

export async function resetPassword(key: string, password: string): Promise<void> {
  try {
    await apiClient.post(
      endpoints.auth.resetPassword,
      { key, password },
      { validateStatus: doneWithoutSession },
    )
  } catch (error) {
    throw toLinkError(error)
  }
}

export async function verifyEmail(key: string): Promise<void> {
  try {
    await apiClient.post(
      endpoints.auth.verifyEmail,
      { key },
      { validateStatus: doneWithoutSession },
    )
  } catch (error) {
    throw toLinkError(error)
  }
}
