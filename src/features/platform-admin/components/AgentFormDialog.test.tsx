import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { apiClient, createApiError } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { AgentFormDialog } from './AgentFormDialog'
import type { MunicipalityDetail } from '../types'

/**
 * Alta de un agente municipal (US-017, escenarios 2 y 3).
 *
 * El administrador de la plataforma crea la cuenta con una contraseña temporal
 * y la asocia a una municipalidad. Las dos cosas son obligatorias: una cuenta
 * sin jurisdicción no puede operar ningún panel.
 */

const labels = messages.agents

function municipality(id: number, city: string): MunicipalityDetail {
  return {
    id,
    city,
    province: 'Córdoba',
    latitude: '-32.41',
    longitude: '-63.24',
    boundary: [
      [-32.39, -63.26],
      [-32.39, -63.22],
      [-32.43, -63.22],
      [-32.43, -63.26],
    ] as [number, number][],
    is_active: true,
    report_count: 0,
    user_count: 0,
    created_at: '2026-08-01T10:00:00Z',
  }
}

const VILLA_MARIA = municipality(3, 'Villa María')

/** La municipalidad viene fija: la que el admin eligió en el header. */
async function openDialog(chosen = VILLA_MARIA) {
  renderWithProviders(<AgentFormDialog municipality={chosen} />)
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: labels.create }))
  await screen.findByText(labels.createTitle)
  return user
}

/** Completa el formulario por el camino feliz. */
async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(labels.name), 'Ana Agente')
  await user.type(screen.getByLabelText(labels.email), 'ana@villamaria.gob.ar')
  await user.type(screen.getByLabelText(labels.temporaryPassword), 'temporal123')
}

describe('AgentFormDialog', () => {
  it('explica que la contraseña temporal se usa una sola vez', async () => {
    await openDialog()

    expect(screen.getByText(labels.temporaryPasswordHint)).toBeInTheDocument()
  })

  it('la municipalidad es la del header, fija: no se elige en el formulario', async () => {
    await openDialog()

    expect(screen.getByText('Villa María, Córdoba')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('crea el agente con el cuerpo que espera la API', async () => {
    const post = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue({ data: { id: 9 } } as never)
    const user = await openDialog()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: messages.common.save }))

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/municipal-agents/', {
        name: 'Ana Agente',
        email: 'ana@villamaria.gob.ar',
        temporary_password: 'temporal123',
        // La del header.
        municipality_id: 3,
      }),
    )
  })

  it('confirma el alta y cierra el diálogo', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { id: 9 } } as never)
    const user = await openDialog()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: messages.common.save }))

    expect(await screen.findAllByText(labels.created)).not.toHaveLength(0)
    await waitFor(() =>
      expect(screen.queryByText(labels.createTitle)).not.toBeInTheDocument(),
    )
  })

  it('exige el nombre, el correo y la contraseña', async () => {
    const post = vi.spyOn(apiClient, 'post')
    const user = await openDialog()

    await user.click(screen.getByRole('button', { name: messages.common.save }))

    expect(await screen.findByText('Ingresá el nombre del agente.')).toBeInTheDocument()
    expect(screen.getByText('El correo no es válido.')).toBeInTheDocument()
    expect(screen.getByText('Usá al menos 8 caracteres.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('rechaza una contraseña temporal demasiado corta', async () => {
    const post = vi.spyOn(apiClient, 'post')
    const user = await openDialog()

    await user.type(screen.getByLabelText(labels.name), 'Ana')
    await user.type(screen.getByLabelText(labels.email), 'ana@villamaria.gob.ar')
    await user.type(screen.getByLabelText(labels.temporaryPassword), 'corta')
    await user.click(screen.getByRole('button', { name: messages.common.save }))

    expect(await screen.findByText('Usá al menos 8 caracteres.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('muestra el error del backend en el campo que lo produjo', async () => {
    // El correo duplicado solo lo sabe el servidor: la validación del navegador
    // no puede anticiparlo, así que el mensaje tiene que aterrizar en el campo.
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      createApiError(400, 'Ya existe un usuario con ese correo.', {
        email: ['Ya existe un usuario con ese correo.'],
      }),
    )
    const user = await openDialog()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: messages.common.save }))

    expect(
      await screen.findByText('Ya existe un usuario con ese correo.'),
    ).toBeInTheDocument()
    expect(screen.getByText(labels.createTitle)).toBeInTheDocument()
  })

  it('traduce el nombre del campo de la API al del formulario', async () => {
    // La API habla de `temporary_password`; el formulario, de `temporaryPassword`.
    // Sin el mapeo, el error del servidor quedaba sin campo donde mostrarse.
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      createApiError(400, 'Contraseña demasiado común.', {
        temporary_password: ['Contraseña demasiado común.'],
      }),
    )
    const user = await openDialog()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: messages.common.save }))

    const field = screen.getByLabelText(labels.temporaryPassword)
    await waitFor(() => expect(field).toHaveAttribute('aria-invalid', 'true'))
  })

  it('cerrar y volver a abrir descarta lo escrito', async () => {
    const user = await openDialog()
    await user.type(screen.getByLabelText(labels.name), 'Ana Agente')

    await user.click(screen.getByRole('button', { name: messages.common.cancel }))
    await waitFor(() =>
      expect(screen.queryByText(labels.createTitle)).not.toBeInTheDocument(),
    )
    await user.click(screen.getByRole('button', { name: labels.create }))

    expect(await screen.findByLabelText(labels.name)).toHaveValue('')
  })
})
