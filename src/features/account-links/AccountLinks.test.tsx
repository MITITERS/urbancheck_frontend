import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient, createApiError } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { messages } from '@/config/messages'
import { AppRoutes } from '@/routes'
import { renderWithProviders } from '@/test/renderWithProviders'

/**
 * N-16 — las páginas públicas a las que llevan los enlaces de los correos,
 * ahora que allauth no tiene páginas HTML.
 */
const t = messages.accountLinks
// La clave llega codificada en el enlace (`:` como `%3A`).
const KEY = 'MTMz:1xMR1p:abc'
const ENCODED = encodeURIComponent(KEY)

afterEach(() => vi.restoreAllMocks())

/** El `validateStatus` con que se hizo el pedido: debe aceptar el 401. */
function acceptedStatuses(post: ReturnType<typeof vi.spyOn>) {
  const config = post.mock.calls[0][2] as { validateStatus: (s: number) => boolean }
  return [200, 400, 401].filter((status) => config.validateStatus(status))
}

describe('ResetPasswordPage', () => {
  async function fill(password: string) {
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText(t.newPassword), password)
    await user.type(screen.getByLabelText(t.confirmPassword), password)
    await user.click(screen.getByRole('button', { name: t.resetSubmit }))
  }

  it('se abre sin sesión y cambia la contraseña con la clave del enlace', async () => {
    const post = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue({ status: 401, data: {} } as never)
    renderWithProviders(<AppRoutes />, {
      route: `/restablecer-contrasena?key=${ENCODED}`,
    })

    await fill('Otra#Clave99x')

    expect(await screen.findByText(t.resetDone)).toBeInTheDocument()
    expect(post).toHaveBeenCalledWith(
      endpoints.auth.resetPassword,
      { key: KEY, password: 'Otra#Clave99x' },
      expect.anything(),
    )
    // Sin sesión, el 401 de allauth es el éxito: no puede leerse como sesión vencida.
    expect(acceptedStatuses(post)).toEqual([200, 401])
  })

  it('una clave vencida dice que el enlace no sirve', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      createApiError(400, 'Invalid or expired key.', {
        key: ['Invalid or expired key.'],
      }),
    )
    renderWithProviders(<AppRoutes />, {
      route: `/restablecer-contrasena?key=${ENCODED}`,
    })

    await fill('Otra#Clave99x')

    expect(await screen.findByText(t.invalidLink)).toBeInTheDocument()
  })
})

describe('ConfirmEmailPage', () => {
  it('confirma el correo al abrirse, sin sesión', async () => {
    const post = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue({ status: 401, data: {} } as never)
    renderWithProviders(<AppRoutes />, { route: `/confirmar-correo?key=${ENCODED}` })

    expect(await screen.findByText(t.confirmDone)).toBeInTheDocument()
    expect(post).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenCalledWith(
      endpoints.auth.verifyEmail,
      { key: KEY },
      expect.anything(),
    )
    expect(acceptedStatuses(post)).toEqual([200, 401])
  })

  it('un enlace ya usado o vencido lo dice', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      createApiError(400, 'Invalid or expired key.', {
        key: ['Invalid or expired key.'],
      }),
    )
    renderWithProviders(<AppRoutes />, { route: `/confirmar-correo?key=${ENCODED}` })

    expect(await screen.findByText(t.invalidLink)).toBeInTheDocument()
  })
})
