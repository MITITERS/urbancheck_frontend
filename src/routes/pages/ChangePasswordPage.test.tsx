import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '@/api/auth'
import { createApiError } from '@/api/client'
import { messages } from '@/config/messages'
import { createQueryClient } from '@/lib/queryClient'
import { clearStoredToken, storeToken } from '@/lib/session'
import { AuthProvider } from '@/providers/AuthProvider'
import { ChangePasswordPage } from '@/routes/pages/ChangePasswordPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { Toaster } from '@/components/ui/sonner'
import { ROLES, type AuthUser, type Role } from '@/types/auth'

/**
 * Cambio forzado de la contraseña temporal (US-017, escenario 3, y US-035).
 *
 * La pantalla vive fuera del shell del panel: hasta que la contraseña temporal
 * se reemplaza no hay ninguna otra sección alcanzable, así que lo que se prueba
 * es tanto el formulario como a dónde deja al usuario cuando termina.
 */

const labels = messages.changePassword

function userWith(role: Role, mustChangePassword: boolean): AuthUser {
  return {
    id: 7,
    email: 'agente@villamaria.gob.ar',
    name: 'Ana Agente',
    avatar: null,
    role,
    municipality: { id: 3, city: 'Villa María', province: 'Córdoba' },
    mustChangePassword,
    isActive: true,
  }
}

/**
 * Monta la pantalla como la monta la aplicación —detrás de `ProtectedRoute`, que
 * es quien retiene el render mientras la sesión se resuelve— con los dos
 * destinos posibles, para poder afirmar la redirección por rol sin espiar el
 * router.
 */
function renderPage(user: AuthUser) {
  storeToken('tok-abc')
  vi.spyOn(authApi, 'fetchCurrentUser').mockResolvedValue(user)
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({ queries: { retry: false } })

  return render(
    <MemoryRouter initialEntries={['/cambiar-password']}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/cambiar-password" element={<ChangePasswordPage />} />
            </Route>
            <Route path="/reportes" element={<h1>Reportes</h1>} />
            <Route path="/municipalidades" element={<h1>Municipalidades</h1>} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

/** Completa los tres campos del formulario. */
async function fill(
  user: ReturnType<typeof userEvent.setup>,
  { current = 'temporal1', next = 'definitiva1', repeat = 'definitiva1' } = {},
) {
  if (current) await user.type(screen.getByLabelText(labels.currentPassword), current)
  await user.type(screen.getByLabelText(labels.newPassword), next)
  if (repeat) await user.type(screen.getByLabelText(labels.confirmPassword), repeat)
}

afterEach(() => {
  clearStoredToken()
})

describe('ChangePasswordPage', () => {
  it('explica por qué se pide el cambio', async () => {
    renderPage(userWith(ROLES.MUNICIPAL_AGENT, true))

    expect(await screen.findByText(labels.title)).toBeInTheDocument()
    expect(screen.getByText(labels.description)).toBeInTheDocument()
  })

  it('quien no tiene contraseña temporal no ve la pantalla', async () => {
    // Sin esto, la URL quedaría abierta para cualquiera que la escriba a mano.
    renderPage(userWith(ROLES.MUNICIPAL_AGENT, false))

    expect(await screen.findByRole('heading', { name: 'Reportes' })).toBeInTheDocument()
    expect(screen.queryByText(labels.title)).not.toBeInTheDocument()
  })

  it('rechaza una contraseña nueva de menos de 8 caracteres', async () => {
    const change = vi.spyOn(authApi, 'changePassword').mockResolvedValue()
    renderPage(userWith(ROLES.MUNICIPAL_AGENT, true))
    const user = userEvent.setup()
    await screen.findByText(labels.title)

    await fill(user, { next: 'corta', repeat: 'corta' })
    await user.click(screen.getByRole('button', { name: labels.submit }))

    expect(await screen.findByText('Usá al menos 8 caracteres.')).toBeInTheDocument()
    expect(change).not.toHaveBeenCalled()
  })

  it('rechaza cuando la repetición no coincide', async () => {
    const change = vi.spyOn(authApi, 'changePassword').mockResolvedValue()
    renderPage(userWith(ROLES.MUNICIPAL_AGENT, true))
    const user = userEvent.setup()
    await screen.findByText(labels.title)

    await fill(user, { next: 'definitiva1', repeat: 'definitiva2' })
    await user.click(screen.getByRole('button', { name: labels.submit }))

    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument()
    expect(change).not.toHaveBeenCalled()
  })

  it('exige la contraseña actual', async () => {
    const change = vi.spyOn(authApi, 'changePassword').mockResolvedValue()
    renderPage(userWith(ROLES.MUNICIPAL_AGENT, true))
    const user = userEvent.setup()
    await screen.findByText(labels.title)

    await fill(user, { current: '' })
    await user.click(screen.getByRole('button', { name: labels.submit }))

    expect(await screen.findByText('Ingresá tu contraseña actual.')).toBeInTheDocument()
    expect(change).not.toHaveBeenCalled()
  })

  it('al guardar, manda las contraseñas y lleva al agente a sus reportes', async () => {
    const change = vi.spyOn(authApi, 'changePassword').mockResolvedValue()
    renderPage(userWith(ROLES.MUNICIPAL_AGENT, true))
    const user = userEvent.setup()
    await screen.findByText(labels.title)

    await fill(user)
    await user.click(screen.getByRole('button', { name: labels.submit }))

    await waitFor(() => expect(change).toHaveBeenCalledWith('temporal1', 'definitiva1'))
    expect(await screen.findByRole('heading', { name: 'Reportes' })).toBeInTheDocument()
  })

  it('el administrador de plataforma aterriza en municipalidades', async () => {
    // Cada rol vuelve a su propia sección: mandarlos a todos al mismo lugar era
    // lo que dejaba al admin en un «permisos insuficientes» recién cambiada la
    // contraseña.
    vi.spyOn(authApi, 'changePassword').mockResolvedValue()
    renderPage(userWith(ROLES.PLATFORM_ADMIN, true))
    const user = userEvent.setup()
    await screen.findByText(labels.title)

    await fill(user)
    await user.click(screen.getByRole('button', { name: labels.submit }))

    expect(
      await screen.findByRole('heading', { name: 'Municipalidades' }),
    ).toBeInTheDocument()
  })

  it('muestra el motivo del rechazo del servidor y no navega', async () => {
    vi.spyOn(authApi, 'changePassword').mockRejectedValue(
      createApiError(400, 'La contraseña es demasiado común.'),
    )
    renderPage(userWith(ROLES.MUNICIPAL_AGENT, true))
    const user = userEvent.setup()
    await screen.findByText(labels.title)

    await fill(user)
    await user.click(screen.getByRole('button', { name: labels.submit }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La contraseña es demasiado común.',
    )
    expect(screen.queryByRole('heading', { name: 'Reportes' })).not.toBeInTheDocument()
  })

  it('un error que no es del API se muestra con el texto genérico', async () => {
    vi.spyOn(authApi, 'changePassword').mockRejectedValue(new Error('boom'))
    renderPage(userWith(ROLES.MUNICIPAL_AGENT, true))
    const user = userEvent.setup()
    await screen.findByText(labels.title)

    await fill(user)
    await user.click(screen.getByRole('button', { name: labels.submit }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.errors.unexpected,
    )
  })

  it('vuelve a leer el usuario para apagar la contraseña temporal', async () => {
    // Sin el refresh, el guard seguiría creyendo que la contraseña es temporal y
    // devolvería a esta misma pantalla.
    vi.spyOn(authApi, 'changePassword').mockResolvedValue()
    const fetchUser = vi.spyOn(authApi, 'fetchCurrentUser')
    renderPage(userWith(ROLES.MUNICIPAL_AGENT, true))
    const user = userEvent.setup()
    await screen.findByText(labels.title)
    const callsBefore = fetchUser.mock.calls.length

    await fill(user)
    await user.click(screen.getByRole('button', { name: labels.submit }))

    await waitFor(() =>
      expect(fetchUser.mock.calls.length).toBeGreaterThan(callsBefore),
    )
  })
})
