import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import * as authApi from '@/api/auth'
import { setSessionExpiredHandler } from '@/api/client'
import { clearStoredToken, getStoredToken, storeToken } from '@/lib/session'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context'
import type { AuthUser, LoginCredentials } from '@/types/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<AuthUser | null>(null)
  // Without a stored token there is nothing to validate, so the very first
  // render can already say "anonymous" instead of flashing a loading screen.
  const [status, setStatus] = useState<AuthStatus>(() =>
    getStoredToken() ? 'loading' : 'anonymous',
  )

  const endSession = useCallback(() => {
    clearStoredToken()
    setUser(null)
    setStatus('anonymous')
    queryClient.clear()
  }, [queryClient])

  // The axios client owns the 401 handling; this is how it tells the UI.
  useEffect(() => {
    setSessionExpiredHandler(endSession)
    return () => setSessionExpiredHandler(null)
  }, [endSession])

  // On boot, a stored token is only trusted after the API confirms it.
  useEffect(() => {
    let cancelled = false

    if (!getStoredToken()) return

    authApi
      .fetchCurrentUser()
      .then((currentUser) => {
        if (cancelled) return
        setUser(currentUser)
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        clearStoredToken()
        setUser(null)
        setStatus('anonymous')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(
    async ({ email, password }: LoginCredentials): Promise<AuthUser> => {
      const token = await authApi.login(email, password)
      storeToken(token)
      try {
        const currentUser = await authApi.fetchCurrentUser()
        setUser(currentUser)
        setStatus('authenticated')
        return currentUser
      } catch (error) {
        // A token we cannot use is worse than no token at all.
        clearStoredToken()
        setStatus('anonymous')
        throw error
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    await authApi.logout()
    endSession()
  }, [endSession])

  const refreshUser = useCallback(async () => {
    const currentUser = await authApi.fetchCurrentUser()
    setUser(currentUser)
    setStatus('authenticated')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      role: user?.role ?? null,
      municipality: user?.municipality ?? null,
      mustChangePassword: user?.mustChangePassword ?? false,
      login,
      logout,
      refreshUser,
    }),
    [status, user, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
