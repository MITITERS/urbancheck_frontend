import { createContext } from 'react'
import type { AuthUser, LoginCredentials } from '@/types/auth'

/**
 * Session contract consumed by the whole application.
 *
 * `status` exists so screens can tell "we do not know yet" (first load, while
 * the stored token is being validated) from "there is nobody logged in".
 * Rendering guards off `user === null` alone would flash the login screen on
 * every reload.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  /** Convenience mirrors of `user`, so consumers do not repeat null checks. */
  role: AuthUser['role'] | null
  municipality: AuthUser['municipality']
  mustChangePassword: boolean
  login: (credentials: LoginCredentials) => Promise<AuthUser>
  logout: () => Promise<void>
  /** Re-reads the current user, e.g. right after the forced password change. */
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
