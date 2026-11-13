import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient, createApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { MunicipalityFormDialog } from './MunicipalityFormDialog'
import type { MunicipalityDetail } from '../types'

const labels = messages.municipalities

const PROVINCES = [
  { id: '06', name: 'Buenos Aires' },
  { id: '14', name: 'Córdoba' },
]

const CORDOBA_LOCALITIES = [
  { id: '1', name: 'Alta Gracia', latitude: -31.6539, longitude: -64.4281 },
  { id: '2', name: 'Bell Ville', latitude: -32.6303, longitude: -62.6888 },
  { id: '3', name: 'Villa María', latitude: -32.4106, longitude: -63.2436 },
]

const EXISTING: MunicipalityDetail = {
  id: 4,
  city: 'Villa María',
  province: 'Córdoba',
  latitude: '-32.410600',
  longitude: '-63.243600',
  boundary: [
    [-32.39, -63.26],
    [-32.39, -63.22],
    [-32.43, -63.22],
    [-32.43, -63.26],
  ] as [number, number][],
  is_active: true,
  report_count: 2,
  user_count: 1,
  created_at: '2026-08-01T10:00:00Z',
}

/** Georef contesta con el catálogo, salvo que el test diga otra cosa. */
function mockCatalog({ localities = CORDOBA_LOCALITIES } = {}) {
  vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
    if (url.endsWith('/localities/')) return { data: { results: localities } }
    if (url.includes('/geo/provinces/')) return { data: { results: PROVINCES } }
    return { data: { results: [] } }
  })
}

function trigger(label: string) {
  return <Button>{label}</Button>
}

async function openDialog(label: string) {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: label }))
  return user
}

/** Elige provincia y ciudad, que es el camino normal del formulario. */
async function pickCordobaAnd(city: string, user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('combobox', { name: labels.province }))
  await user.click(await screen.findByRole('option', { name: 'Córdoba' }))
  await user.click(await screen.findByRole('combobox', { name: labels.city }))
  await user.click(await screen.findByRole('option', { name: city }))
}

beforeEach(() => {
  mockCatalog()
})

/**
 * Traza un polígono haciendo clic sobre el mapa.
 *
 * Leaflet escucha el clic sobre su contenedor, así que se lo dispara ahí. En
 * jsdom no hay layout: todos los clics resuelven a la misma coordenada, y da
 * igual — lo que se prueba es cuántos vértices quedaron, no dónde.
 *
 * Va con `fireEvent` y no con `userEvent`: éste simula el puntero completo, y
 * dos clics seguidos sobre el mismo elemento le hacen sintetizar un doble clic
 * que Leaflet intenta convertir en coordenadas. Sin layout eso da `NaN` y
 * revienta dentro de la librería.
 */
function drawBoundary(points = 3) {
  const map = document.querySelector('.leaflet-container') as HTMLElement
  for (let index = 0; index < points; index += 1) {
    fireEvent.click(map)
  }
}

describe('MunicipalityFormDialog', () => {
  it('pide provincia y ciudad, no nombre y localidad', async () => {
    renderWithProviders(<MunicipalityFormDialog trigger={trigger('Abrir')} />)
    await openDialog('Abrir')

    expect(
      await screen.findByRole('combobox', { name: labels.province }),
    ).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: labels.city })).toBeInTheDocument()
  })

  it('no deja elegir ciudad hasta que haya provincia', async () => {
    renderWithProviders(<MunicipalityFormDialog trigger={trigger('Abrir')} />)
    await openDialog('Abrir')

    expect(await screen.findByRole('combobox', { name: labels.city })).toBeDisabled()
    expect(screen.getByText(labels.cityNeedsProvince)).toBeInTheDocument()
  })

  it('lista las ciudades de la provincia elegida', async () => {
    renderWithProviders(<MunicipalityFormDialog trigger={trigger('Abrir')} />)
    const user = await openDialog('Abrir')

    await user.click(await screen.findByRole('combobox', { name: labels.province }))
    await user.click(await screen.findByRole('option', { name: 'Córdoba' }))
    await user.click(await screen.findByRole('combobox', { name: labels.city }))

    for (const locality of CORDOBA_LOCALITIES) {
      expect(
        await screen.findByRole('option', { name: locality.name }),
      ).toBeInTheDocument()
    }
  })

  it('filtra la lista a medida que se escribe el nombre', async () => {
    renderWithProviders(<MunicipalityFormDialog trigger={trigger('Abrir')} />)
    const user = await openDialog('Abrir')

    await user.click(await screen.findByRole('combobox', { name: labels.province }))
    await user.click(await screen.findByRole('option', { name: 'Córdoba' }))
    await user.click(await screen.findByRole('combobox', { name: labels.city }))
    await user.type(screen.getByPlaceholderText(labels.citySearch), 'bell')

    expect(
      await screen.findByRole('option', { name: 'Bell Ville' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('option', { name: 'Alta Gracia' }),
    ).not.toBeInTheDocument()
  })

  it('elegir la ciudad deja puesto el centro del área de cobertura', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: EXISTING })

    renderWithProviders(<MunicipalityFormDialog trigger={trigger('Abrir')} />)
    const user = await openDialog('Abrir')
    await pickCordobaAnd('Bell Ville', user)
    drawBoundary()
    await user.click(screen.getByRole('button', { name: messages.common.save }))

    // El centroide oficial llega solo: solo hay que trazar el límite.
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        '/api/municipalities/',
        expect.objectContaining({
          city: 'Bell Ville',
          province: 'Córdoba',
          latitude: -32.6303,
          longitude: -62.6888,
        }),
      ),
    )
  })

  it('cambiar de provincia limpia la ciudad elegida', async () => {
    renderWithProviders(<MunicipalityFormDialog trigger={trigger('Abrir')} />)
    const user = await openDialog('Abrir')
    await pickCordobaAnd('Bell Ville', user)

    await user.click(screen.getByRole('combobox', { name: labels.province }))
    await user.click(await screen.findByRole('option', { name: 'Buenos Aires' }))

    // Dejarla sería crear un municipio con la ciudad de otra provincia.
    expect(screen.getByRole('combobox', { name: labels.city })).toHaveTextContent(
      labels.cityPlaceholder,
    )
  })

  it('exige elegir la ciudad antes de guardar', async () => {
    const post = vi.spyOn(apiClient, 'post')

    renderWithProviders(<MunicipalityFormDialog trigger={trigger('Abrir')} />)
    const user = await openDialog('Abrir')
    await user.click(await screen.findByRole('combobox', { name: labels.province }))
    await user.click(await screen.findByRole('option', { name: 'Córdoba' }))
    await user.click(screen.getByRole('button', { name: messages.common.save }))

    expect(await screen.findByText('Elegí la ciudad.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('no se puede guardar sin haber trazado el límite', async () => {
    const post = vi.spyOn(apiClient, 'post')

    renderWithProviders(<MunicipalityFormDialog trigger={trigger('Abrir')} />)
    const user = await openDialog('Abrir')
    await pickCordobaAnd('Bell Ville', user)
    await user.click(screen.getByRole('button', { name: messages.common.save }))

    expect(
      await screen.findByText('Trazá el límite: hacen falta al menos tres puntos.'),
    ).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('dos puntos tampoco alcanzan: no encierran área', async () => {
    const post = vi.spyOn(apiClient, 'post')

    renderWithProviders(<MunicipalityFormDialog trigger={trigger('Abrir')} />)
    const user = await openDialog('Abrir')
    await pickCordobaAnd('Bell Ville', user)
    drawBoundary(2)
    await user.click(screen.getByRole('button', { name: messages.common.save }))

    expect(
      await screen.findByText('Trazá el límite: hacen falta al menos tres puntos.'),
    ).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('deshacer saca el último punto marcado', async () => {
    renderWithProviders(<MunicipalityFormDialog trigger={trigger('Abrir')} />)
    const user = await openDialog('Abrir')
    await pickCordobaAnd('Bell Ville', user)
    drawBoundary(3)
    expect(await screen.findByText(labels.boundaryPoints(3))).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: labels.boundaryUndo }))

    expect(await screen.findByText(labels.boundaryTooFew(1))).toBeInTheDocument()
  })

  it('borrar todo deja el límite vacío', async () => {
    renderWithProviders(<MunicipalityFormDialog trigger={trigger('Abrir')} />)
    const user = await openDialog('Abrir')
    await pickCordobaAnd('Bell Ville', user)
    drawBoundary(3)

    await user.click(screen.getByRole('button', { name: labels.boundaryClear }))

    expect(await screen.findByText(labels.boundaryEmpty)).toBeInTheDocument()
  })

  it('cae a escribir el nombre a mano si Georef no responde', async () => {
    mockCatalog({ localities: [] })

    renderWithProviders(<MunicipalityFormDialog trigger={trigger('Abrir')} />)
    const user = await openDialog('Abrir')
    await user.click(await screen.findByRole('combobox', { name: labels.province }))
    await user.click(await screen.findByRole('option', { name: 'Córdoba' }))

    // El formulario sigue siendo usable: nombre a mano y centro en el mapa.
    expect(await screen.findByLabelText(labels.city)).toBeInTheDocument()
    expect(screen.getByText(labels.cityUnavailable)).toBeInTheDocument()
  })

  it('muestra el rechazo por duplicado debajo del campo de ciudad', async () => {
    const message = 'Ya existe una municipalidad con esa ciudad y provincia.'
    vi.spyOn(apiClient, 'patch').mockRejectedValue(
      createApiError(400, message, { city: [message] }),
    )

    renderWithProviders(
      <MunicipalityFormDialog municipality={EXISTING} trigger={trigger('Editar')} />,
    )
    const user = await openDialog('Editar')
    await user.click(await screen.findByRole('button', { name: messages.common.save }))

    expect(await screen.findByText(message)).toBeInTheDocument()
  })

  it('al editar llega con el límite que ya tenía trazado', async () => {
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: EXISTING })

    renderWithProviders(
      <MunicipalityFormDialog municipality={EXISTING} trigger={trigger('Editar')} />,
    )
    const user = await openDialog('Editar')
    // Los cuatro vértices guardados ya están puestos: editar no obliga a
    // volver a trazar desde cero.
    expect(await screen.findByText(labels.boundaryPoints(4))).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: messages.common.save }))

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/api/municipalities/4/', {
        city: 'Villa María',
        province: 'Córdoba',
        boundary: EXISTING.boundary,
        latitude: Number(EXISTING.latitude),
        longitude: Number(EXISTING.longitude),
      }),
    )
  })
})
