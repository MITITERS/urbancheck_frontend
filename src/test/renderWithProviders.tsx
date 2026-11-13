import type { ReactNode } from 'react'
import { render, type RenderResult } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { createQueryClient } from '@/lib/queryClient'
import { MunicipalityScopeProvider } from '@/features/municipality-scope/MunicipalityScopeProvider'
import { AuthProvider } from '@/providers/AuthProvider'

/**
 * Mirrors `AppProviders`, but with a router we can point at an arbitrary path
 * and a query client that is thrown away after each test.
 */
export function renderWithProviders(
  ui: ReactNode,
  { route = '/' }: { route?: string } = {},
): RenderResult {
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({ queries: { retry: false } })

  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {/* Igual que AppShell: las pantallas leen de acá qué municipalidad
              muestran. */}
          <MunicipalityScopeProvider>{ui}</MunicipalityScopeProvider>
          {/* Igual que en AppProviders: sin él los toasts no se renderizan. */}
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}
