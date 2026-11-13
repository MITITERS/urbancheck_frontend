import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { RouteErrorBoundary } from '@/components/common/ErrorBoundary'
import { OfflineBanner } from '@/components/common/OfflineBanner'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from './AuthProvider'
import { QueryProvider } from './QueryProvider'

/**
 * Composition root for every cross-cutting provider. Order matters:
 * `AuthProvider` uses the query client, and both need the router to be able to
 * redirect.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          {/* N-19: sin red lo dice, y un error no deja la pantalla en blanco. */}
          <OfflineBanner />
          <RouteErrorBoundary fullScreen>{children}</RouteErrorBoundary>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  )
}
