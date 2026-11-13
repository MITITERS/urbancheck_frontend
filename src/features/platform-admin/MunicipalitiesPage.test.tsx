import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { MunicipalitiesPage } from './MunicipalitiesPage'
import type { MunicipalityDetail } from './types'

const labels = messages.municipalities

const STAFFED: MunicipalityDetail = {
  id: 3,
  city: 'Villa María',
  province: 'Córdoba',
  latitude: '-32.410300',
  longitude: '-63.240000',
  boundary: [
    [-32.39, -63.26],
    [-32.39, -63.22],
    [-32.43, -63.22],
    [-32.43, -63.26],
  ] as [number, number][],
  is_active: true,
  report_count: 4,
  user_count: 2,
  created_at: '2026-08-01T10:00:00Z',
}

function stubApi(municipality: MunicipalityDetail = STAFFED) {
  vi.spyOn(apiClient, 'get').mockResolvedValue({
    data: { results: [municipality] },
  } as never)
}

beforeEach(() => {
  stubApi()
})

describe('MunicipalitiesPage, baja en cascada', () => {
  it('avisa que el personal queda desactivado antes de ejecutar la baja', async () => {
    const user = userEvent.setup()

    renderWithProviders(<MunicipalitiesPage />)
    await user.click(await screen.findByRole('button', { name: labels.delete }))

    // El aviso va en el diálogo, no en un toast posterior: la consecuencia
    // ocurre en otra pantalla y hay que poder arrepentirse a tiempo.
    expect(await screen.findByText(labels.deleteStaffWarning)).toBeInTheDocument()
  })

  it('no lo avisa cuando la municipalidad no tiene personal', async () => {
    stubApi({ ...STAFFED, user_count: 0 })
    const user = userEvent.setup()

    renderWithProviders(<MunicipalitiesPage />)
    await user.click(await screen.findByRole('button', { name: labels.delete }))

    await screen.findByText(labels.deleteTitle)
    expect(screen.queryByText(labels.deleteStaffWarning)).not.toBeInTheDocument()
  })

  it('al confirmar, dice cuántas cuentas quedaron archivadas', async () => {
    const del = vi.spyOn(apiClient, 'delete').mockResolvedValue({
      data: { deactivated_users: 2, deactivated_areas: 0 },
    } as never)
    const user = userEvent.setup()

    renderWithProviders(<MunicipalitiesPage />)
    await user.click(await screen.findByRole('button', { name: labels.delete }))
    await user.click(screen.getByRole('button', { name: labels.deleteConfirm }))

    await waitFor(() => expect(del).toHaveBeenCalledWith('/api/municipalities/3/'))
    expect(await screen.findByText(labels.deletedWithStaff(2))).toBeInTheDocument()
  })

  it('dice cuántas áreas operativas quedaron desactivadas', async () => {
    // La baja arrastra las dependencias del municipio, no solo a su personal:
    // es una consecuencia que ocurre en la pantalla de áreas.
    vi.spyOn(apiClient, 'delete').mockResolvedValue({
      data: { deactivated_users: 0, deactivated_areas: 3 },
    } as never)
    const user = userEvent.setup()

    renderWithProviders(<MunicipalitiesPage />)
    await user.click(await screen.findByRole('button', { name: labels.delete }))
    await user.click(screen.getByRole('button', { name: labels.deleteConfirm }))

    expect(await screen.findByText(labels.deletedWithAreas(3))).toBeInTheDocument()
  })

  it('nombra las dos consecuencias por separado cuando caen juntas', async () => {
    vi.spyOn(apiClient, 'delete').mockResolvedValue({
      data: { deactivated_users: 2, deactivated_areas: 1 },
    } as never)
    const user = userEvent.setup()

    renderWithProviders(<MunicipalitiesPage />)
    await user.click(await screen.findByRole('button', { name: labels.delete }))
    await user.click(screen.getByRole('button', { name: labels.deleteConfirm }))

    expect(
      await screen.findByText(labels.deletedWithStaffAndAreas(2, 1)),
    ).toBeInTheDocument()
  })

  it('sin nada que arrastrar, el aviso no inventa consecuencias', async () => {
    vi.spyOn(apiClient, 'delete').mockResolvedValue({
      data: { deactivated_users: 0, deactivated_areas: 0 },
    } as never)
    const user = userEvent.setup()

    renderWithProviders(<MunicipalitiesPage />)
    await user.click(await screen.findByRole('button', { name: labels.delete }))
    await user.click(screen.getByRole('button', { name: labels.deleteConfirm }))

    expect(await screen.findByText(labels.deleted)).toBeInTheDocument()
  })
})
