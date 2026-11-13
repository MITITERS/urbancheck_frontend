import type { Municipality } from '@/types/auth'

export interface Validator {
  id: number
  name: string
  email: string
  /** Foto de perfil. Nula mientras la cuenta no haya subido ninguna. */
  avatar: string | null
  /** Jurisdicción del validador. La necesita el admin para distinguir filas. */
  municipality: Municipality | null
  is_active_validator: boolean
  validation_count: number
  must_change_password: boolean
}

export interface ValidatorPayload {
  name: string
  email: string
  temporaryPassword: string
  /**
   * Solo la manda el admin de la plataforma: el agente no elige municipalidad,
   * el backend le asigna la suya.
   */
  municipalityId?: number
}
