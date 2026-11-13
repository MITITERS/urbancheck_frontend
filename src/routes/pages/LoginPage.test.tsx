import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '@/api/auth'
import { createApiError } from '@/api/client'
import { messages } from '@/config/messages'
import { createQueryClient } from '@/lib/queryClient'
import { clearStoredToken } from '@/lib/session'
import { AuthProvider } from '@/providers/AuthProvider'
import { LoginPage } from '@/routes/pages/LoginPage'

/**
 * Ingreso al panel ante los límites de intentos (Sprint 5, punto 5.1).
 *
 * El bloqueo por intentos fallidos responde 429. Mostrarlo como "correo o
 * contraseña incorrectos" haría que el agente siga probando, que es justo lo
 * que extiende el bloqueo.
 */

function renderPage() {
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({ queries: { retry: false } })
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

async function submit(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText(messages.auth.email), email)
  await user.type(screen.getByLabelText(messages.auth.password), password)
  await user.click(screen.getByRole('button', { name: messages.auth.submit }))
}

afterEach(() => {
  vi.restoreAllMocks()
  clearStoredToken()
})

describe('LoginPage', () => {
  it('CP-SEC05-P04 · el bloqueo por intentos dice que hay que esperar', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue(
      createApiError(429, messages.errors.tooManyRequests),
    )
    renderPage()

    await submit('agente@villamaria.gob.ar', 'otra-vez-mal')

    expect(await screen.findByText(messages.errors.tooManyRequests)).toBeVisible()
    expect(screen.queryByText(messages.auth.invalidCredentials)).toBeNull()
  })

  it('CP-SEC05-P05 · una contraseña equivocada sigue diciendo lo de siempre, sin más detalle', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue(
      createApiError(
        400,
        'The email address and/or password you specified are not correct.',
      ),
    )
    renderPage()

    await submit('agente@villamaria.gob.ar', 'mal')

    expect(await screen.findByText(messages.auth.invalidCredentials)).toBeVisible()
  })
})
