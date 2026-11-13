import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ROLES, type Role } from '@/types/auth'
import { ValidatorsPage } from './ValidatorsPage'
import type { Validator } from './types'

/** El config de la instancia compartida, sin importar axios (regla del repo). */
type RequestConfig = Parameters<typeof apiClient.get>[1]

const VILLA_MARIA = { id: 3, city: 'Villa María', province: 'Córdoba' }
const VILLA_NUEVA = { id: 4, city: 'Villa Nueva', province: 'Córdoba' }

const ACTIVE: Validator = {
  id: 7,
  name: 'Validador Uno',
  email: 'validador@muni.gob.ar',
  avatar: null,
  municipality: VILLA_MARIA,
  is_active_validator: true,
  validation_count: 3,
  must_change_password: false,
}

// La página se ramifica por rol, y el rol sale del contexto de sesión. Mockear
// el hook es más directo que montar una sesión falsa en cada caso.
const { mockedRole } = vi.hoisted(() => ({
  mockedRole: { current: null as Role | null },
}))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ role: mockedRole.current }),
}))

function signedInAs(role: Role) {
  mockedRole.current = role
}

/**
 * Responde como el backend: cada pestaña pide su propio estado, y el validador
 * aparece solo en la lista que le corresponde.
 */
function stubApi(validator: Validator = ACTIVE) {
  vi.spyOn(apiClient, 'get').mockImplementation(
    async (url: string, config?: RequestConfig) => {
      if (url.includes('municipalities')) {
        return { data: { results: [VILLA_MARIA, VILLA_NUEVA] } } as never
      }
      const wanted = validator.is_active_validator ? 'active' : 'inactive'
      const state = (config?.params as { state?: string } | undefined)?.state
      const results = state === wanted ? [validator] : []
      return { data: { results } } as never
    },
  )
}

beforeEach(() => {
  signedInAs(ROLES.MUNICIPAL_AGENT)
  stubApi()
})

describe('ValidatorsPage, como agente municipal', () => {
  it('lists validators with their state and validation count', async () => {
    renderWithProviders(<ValidatorsPage />)

    const row = await screen.findByRole('row', { name: /Validador Uno/ })
    expect(within(row).getByText(messages.validators.active)).toBeInTheDocument()
    expect(within(row).getByText('3')).toBeInTheDocument()
  })

  it('asks for confirmation before deactivating, explaining what is kept', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { ...ACTIVE, is_active_validator: false },
    })
    const user = userEvent.setup()

    renderWithProviders(<ValidatorsPage />)
    await user.click(
      await screen.findByRole('button', { name: messages.validators.deactivate }),
    )

    expect(
      await screen.findByText(messages.validators.deactivateDescription),
    ).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', { name: messages.validators.deactivateConfirm }),
    )

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/validators/7/deactivate/'),
    )
  })

  it('does not offer a municipality selector when creating a validator', async () => {
    const user = userEvent.setup()

    renderWithProviders(<ValidatorsPage />)
    await user.click(
      await screen.findByRole('button', { name: messages.validators.create }),
    )

    // La municipalidad la pone el backend: ofrecerla sería un bug de US-035.
    expect(await screen.findByLabelText(messages.validators.name)).toBeInTheDocument()
    expect(screen.queryByText(messages.validators.municipality)).not.toBeInTheDocument()
  })

  it('does not offer the municipality filter either', async () => {
    renderWithProviders(<ValidatorsPage />)
    await screen.findByRole('row', { name: /Validador Uno/ })

    expect(
      screen.queryByLabelText(messages.validators.filterByMunicipality),
    ).not.toBeInTheDocument()
  })

  it('sends no municipality when creating: the backend uses its own', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: ACTIVE })
    const user = userEvent.setup()

    renderWithProviders(<ValidatorsPage />)
    await user.click(
      await screen.findByRole('button', { name: messages.validators.create }),
    )
    await user.type(await screen.findByLabelText(messages.validators.name), 'Ana')
    await user.type(screen.getByLabelText(messages.validators.email), 'a@muni.gob.ar')
    await user.type(
      screen.getByLabelText(messages.validators.temporaryPassword),
      'Xk7#mP9@qLz2!',
    )
    await user.click(screen.getByRole('button', { name: messages.common.save }))

    await waitFor(() => expect(post).toHaveBeenCalled())
    expect(post.mock.calls[0][1]).not.toHaveProperty('municipality_id')
  })
})

describe('ValidatorsPage, como admin de la plataforma', () => {
  beforeEach(() => {
    signedInAs(ROLES.PLATFORM_ADMIN)
  })

  it('no repite la municipalidad en cada fila: es la del header', async () => {
    // Desde el selector del header (21/10) toda la lista es de una sola
    // municipalidad, y la columna no diría nada.
    renderWithProviders(<ValidatorsPage />)

    const row = await screen.findByRole('row', { name: /Validador Uno/ })
    expect(within(row).queryByText(VILLA_MARIA.city)).toBeNull()
  })

  it('el alta usa la municipalidad del header, fija', async () => {
    // Decisión del usuario (21/10): el admin elige la municipalidad una vez, en
    // el header, y las altas van a esa. El formulario la muestra como dato.
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: ACTIVE })
    const user = userEvent.setup()

    renderWithProviders(<ValidatorsPage />)
    await user.click(
      await screen.findByRole('button', { name: messages.validators.create }),
    )
    expect(await screen.findByText('Villa María, Córdoba')).toBeInTheDocument()
    await user.type(screen.getByLabelText(messages.validators.name), 'Ana')
    await user.type(screen.getByLabelText(messages.validators.email), 'a@muni.gob.ar')
    await user.type(
      screen.getByLabelText(messages.validators.temporaryPassword),
      'Xk7#mP9@qLz2!',
    )
    await user.click(screen.getByRole('button', { name: messages.common.save }))

    await waitFor(() => expect(post).toHaveBeenCalled())
    expect(post.mock.calls[0][1]).toMatchObject({ municipality_id: VILLA_MARIA.id })
  })

  it('pide los validadores de la municipalidad del header, sin filtro propio', async () => {
    const get = vi.spyOn(apiClient, 'get')

    renderWithProviders(<ValidatorsPage />)
    await screen.findByRole('row', { name: /Validador Uno/ })

    expect(screen.queryByLabelText(messages.validators.filterByMunicipality)).toBeNull()
    expect(get).toHaveBeenCalledWith('/api/validators/', {
      params: { state: 'active', municipality: VILLA_MARIA.id },
    })
  })

  it('un validador archivado sale del listado principal', async () => {
    stubApi({ ...ACTIVE, is_active_validator: false })
    const user = userEvent.setup()

    renderWithProviders(<ValidatorsPage />)

    expect(
      await screen.findByText(messages.validators.emptyForMunicipality),
    ).toBeInTheDocument()
    expect(screen.queryByRole('row', { name: /Validador Uno/ })).not.toBeInTheDocument()

    await user.click(await screen.findByRole('tab', { name: /Archivados/ }))

    const row = await screen.findByRole('row', { name: /Validador Uno/ })
    expect(within(row).getByText(messages.validators.inactive)).toBeInTheDocument()
  })

  it('desde archivados lo reactiva sin pedir confirmación', async () => {
    stubApi({ ...ACTIVE, is_active_validator: false })
    const post = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue({ data: ACTIVE } as never)
    const user = userEvent.setup()

    renderWithProviders(<ValidatorsPage />)
    await user.click(await screen.findByRole('tab', { name: /Archivados/ }))
    await screen.findByRole('row', { name: /Validador Uno/ })

    await user.click(screen.getByRole('button', { name: messages.validators.activate }))

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/validators/7/activate/'),
    )
  })
})
