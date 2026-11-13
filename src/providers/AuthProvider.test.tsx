import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '@/api/auth'
import { apiClient, setSessionExpiredHandler } from '@/api/client'
import { createQueryClient } from '@/lib/queryClient'
import { clearStoredToken, getStoredToken, storeToken } from '@/lib/session'
import { useAuth } from '@/hooks/useAuth'
import { AuthProvider } from '@/providers/AuthProvider'
import { ROLES, type AuthUser } from '@/types/auth'

/**
 * Ciclo de vida de la sesión del panel.
 *
 * Lo que se prueba es la máquina de estados que ve el resto de la aplicación:
 * `loading` mientras el token guardado no está confirmado, `authenticated`
 * cuando la API contestó, y `anonymous` en cuanto la sesión deja de servir.
 */

const AGENT: AuthUser = {
  id: 7,
  email: 'agente@villamaria.gob.ar',
  name: 'Ana Agente',
  avatar: null,
  role: ROLES.MUNICIPAL_AGENT,
  municipality: { id: 3, city: 'Villa María', province: 'Córdoba' },
  mustChangePassword: false,
  isActive: true,
}

/** Refleja el contexto en el DOM para poder afirmarlo desde afuera. */
function Probe() {
  const { status, user, role, mustChangePassword } = useAuth()
  return (
    <dl>
      <dd data-testid="status">{status}</dd>
      <dd data-testid="user">{user?.name ?? '—'}</dd>
      <dd data-testid="role">{role ?? '—'}</dd>
      <dd data-testid="must-change">{String(mustChangePassword)}</dd>
    </dl>
  )
}

function renderProvider(children: React.ReactNode = <Probe />) {
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({ queries: { retry: false } })
  const result = render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
  return { ...result, queryClient }
}

afterEach(() => {
  clearStoredToken()
  setSessionExpiredHandler(null)
})

describe('AuthProvider, arranque', () => {
  it('sin token guardado arranca anónimo, sin pantalla de carga', async () => {
    // Es la diferencia entre entrar al login directo y ver un parpadeo de
    // «verificando sesión» en cada visita nueva.
    const fetchUser = vi.spyOn(authApi, 'fetchCurrentUser')

    renderProvider()

    expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
    expect(fetchUser).not.toHaveBeenCalled()
  })

  it('con token guardado espera la confirmación de la API', async () => {
    storeToken('tok-abc')
    vi.spyOn(authApi, 'fetchCurrentUser').mockResolvedValue(AGENT)

    renderProvider()

    expect(screen.getByTestId('status')).toHaveTextContent('loading')
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated'),
    )
    expect(screen.getByTestId('user')).toHaveTextContent('Ana Agente')
    expect(screen.getByTestId('role')).toHaveTextContent(ROLES.MUNICIPAL_AGENT)
  })

  it('un token que la API rechaza se descarta', async () => {
    storeToken('tok-vencida')
    vi.spyOn(authApi, 'fetchCurrentUser').mockRejectedValue(new Error('401'))

    renderProvider()

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('anonymous'),
    )
    expect(getStoredToken()).toBeNull()
  })
})

describe('AuthProvider, login', () => {
  it('guarda el token y publica el usuario', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue('tok-nueva')
    vi.spyOn(authApi, 'fetchCurrentUser').mockResolvedValue(AGENT)

    function LoginButton() {
      const { login } = useAuth()
      return (
        <button onClick={() => void login({ email: 'a@b.com', password: 'x' })}>
          entrar
        </button>
      )
    }

    renderProvider(
      <>
        <Probe />
        <LoginButton />
      </>,
    )
    await userEvent.setup().click(screen.getByRole('button', { name: 'entrar' }))

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated'),
    )
    expect(getStoredToken()).toBe('tok-nueva')
  })

  it('un token que no sirve para leer el usuario no se conserva', async () => {
    // Quedarse con un token inutilizable es peor que no tener ninguno: la
    // aplicación creería que hay sesión y fallaría en cada pantalla.
    vi.spyOn(authApi, 'login').mockResolvedValue('tok-rota')
    vi.spyOn(authApi, 'fetchCurrentUser').mockRejectedValue(new Error('403'))

    function LoginButton() {
      const { login } = useAuth()
      return (
        <button
          onClick={() => {
            void login({ email: 'a@b.com', password: 'x' }).catch(() => {})
          }}
        >
          entrar
        </button>
      )
    }

    renderProvider(
      <>
        <Probe />
        <LoginButton />
      </>,
    )
    await userEvent.setup().click(screen.getByRole('button', { name: 'entrar' }))

    await waitFor(() => expect(getStoredToken()).toBeNull())
    expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
  })
})

describe('AuthProvider, cierre de sesión', () => {
  it('logout borra el token, el usuario y la caché de consultas', async () => {
    storeToken('tok-abc')
    vi.spyOn(authApi, 'fetchCurrentUser').mockResolvedValue(AGENT)
    vi.spyOn(authApi, 'logout').mockResolvedValue()

    function LogoutButton() {
      const { logout } = useAuth()
      return <button onClick={() => void logout()}>salir</button>
    }

    const { queryClient } = renderProvider(
      <>
        <Probe />
        <LogoutButton />
      </>,
    )
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated'),
    )
    // Datos de la sesión anterior que no pueden sobrevivir al cierre.
    queryClient.setQueryData(['reportes', 'list', {}], [{ id: 1 }])

    await userEvent.setup().click(screen.getByRole('button', { name: 'salir' }))

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('anonymous'),
    )
    expect(getStoredToken()).toBeNull()
    expect(queryClient.getQueryData(['reportes', 'list', {}])).toBeUndefined()
  })

  it('un 401 del cliente HTTP termina la sesión sin pasar por logout', async () => {
    // El puente entre el interceptor de axios y la UI: sin esto, un token
    // vencido dejaba la pantalla protegida montada hasta la próxima recarga.
    storeToken('tok-abc')
    vi.spyOn(authApi, 'fetchCurrentUser').mockResolvedValue(AGENT)
    const adapter = apiClient.defaults.adapter
    apiClient.defaults.adapter = (async () => {
      throw {
        isAxiosError: true,
        message: 'Unauthorized',
        config: { url: '/api/panel/reports/', headers: {} },
        response: { status: 401, data: null, headers: {}, config: {} },
      }
    }) as never

    renderProvider()
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated'),
    )

    await expect(apiClient.get('/api/panel/reports/')).rejects.toBeTruthy()

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('anonymous'),
    )
    apiClient.defaults.adapter = adapter
  })
})

describe('AuthProvider, refreshUser', () => {
  it('vuelve a leer el usuario, que es como se apaga la contraseña temporal', async () => {
    storeToken('tok-abc')
    const fetchUser = vi
      .spyOn(authApi, 'fetchCurrentUser')
      .mockResolvedValueOnce({ ...AGENT, mustChangePassword: true })
      .mockResolvedValueOnce(AGENT)

    function Refresher() {
      const { refreshUser } = useAuth()
      return <button onClick={() => void refreshUser()}>refrescar</button>
    }

    renderProvider(
      <>
        <Probe />
        <Refresher />
      </>,
    )
    await waitFor(() =>
      expect(screen.getByTestId('must-change')).toHaveTextContent('true'),
    )

    await userEvent.setup().click(screen.getByRole('button', { name: 'refrescar' }))

    await waitFor(() =>
      expect(screen.getByTestId('must-change')).toHaveTextContent('false'),
    )
    expect(fetchUser).toHaveBeenCalledTimes(2)
  })
})

describe('useAuth', () => {
  it('fuera del provider avisa en vez de devolver un contexto vacío', () => {
    function Orphan() {
      useAuth()
      return null
    }
    // React reporta el error del render; se silencia para no ensuciar la salida.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Orphan />)).toThrow(/AuthProvider/)

    consoleError.mockRestore()
  })
})
