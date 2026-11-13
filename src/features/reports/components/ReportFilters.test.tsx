import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { messages } from '@/config/messages'
import { toDateOnly } from '@/lib/format'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ReportFilters } from './ReportFilters'
import {
  REPORT_STATUSES,
  type ReportFilters as Filters,
  type ReportOrdering,
} from '../types'

/**
 * Barra de filtros del panel (US-012).
 *
 * Los filtros son de la vista y no del componente: éste solo emite el parche que
 * el hook de la URL aplica. Por eso todo se afirma sobre `onChange`.
 */

const labels = messages.reports.filters

const ORDERINGS: readonly ReportOrdering[] = [
  '-created_at',
  'created_at',
  '-like_count',
  'like_count',
]

const EMPTY: Filters = {
  statuses: [],
  categories: [],
  zone: '',
  createdFrom: '',
  createdTo: '',
  closureReview: false,
  ordering: '-created_at',
  page: 1,
  pageSize: 20,
}

/** Renderiza la barra y la abre, que arranca cerrada. */
function renderFilters(filters: Partial<Filters> = {}, isFiltered = false) {
  const result = renderClosed(filters, isFiltered)
  fireEvent.click(toggleButton())
  return result
}

/** El botón que abre la barra; con filtros aplicados su nombre suma «Activos». */
function toggleButton() {
  return screen.getByRole('button', { name: new RegExp(`^${labels.toggle}`) })
}

function renderClosed(filters: Partial<Filters> = {}, isFiltered = false) {
  const onChange = vi.fn()
  const onClear = vi.fn()
  renderWithProviders(
    <ReportFilters
      filters={{ ...EMPTY, ...filters }}
      orderings={ORDERINGS}
      isFiltered={isFiltered}
      onChange={onChange}
      onClear={onClear}
    />,
  )
  return { onChange, onClear, user: userEvent.setup() }
}

describe('ReportFilters, estado y categoría', () => {
  it('sin selección los desplegables dicen «todos»', () => {
    renderFilters()

    expect(screen.getByRole('button', { name: labels.status })).toHaveTextContent(
      labels.allStatuses,
    )
    expect(screen.getByRole('button', { name: labels.category })).toHaveTextContent(
      labels.allCategories,
    )
  })

  it('con un solo estado elegido muestra su nombre', () => {
    renderFilters({ statuses: [REPORT_STATUSES.IN_PROGRESS] })

    expect(screen.getByRole('button', { name: labels.status })).toHaveTextContent(
      messages.reports.status.en_proceso,
    )
  })

  it('con varios muestra el conteo', () => {
    // El nombre de tres estados no entra en el botón; el número sí.
    renderFilters({
      statuses: [REPORT_STATUSES.REPORTED, REPORT_STATUSES.IN_PROGRESS],
    })

    expect(screen.getByRole('button', { name: labels.status })).toHaveTextContent(
      labels.selected(2),
    )
  })

  it('marcar un estado lo agrega a los ya elegidos', async () => {
    // El OR dentro de un mismo filtro: elegir «En proceso» no descarta
    // «Reportado».
    const { onChange, user } = renderFilters({ statuses: [REPORT_STATUSES.REPORTED] })

    await user.click(screen.getByRole('button', { name: labels.status }))
    await user.click(
      await screen.findByRole('menuitemcheckbox', {
        name: messages.reports.status.en_proceso,
      }),
    )

    expect(onChange).toHaveBeenCalledWith({
      statuses: [REPORT_STATUSES.REPORTED, REPORT_STATUSES.IN_PROGRESS],
    })
  })

  it('desmarcar un estado lo saca de la lista', async () => {
    const { onChange, user } = renderFilters({
      statuses: [REPORT_STATUSES.REPORTED, REPORT_STATUSES.IN_PROGRESS],
    })

    await user.click(screen.getByRole('button', { name: labels.status }))
    await user.click(
      await screen.findByRole('menuitemcheckbox', {
        name: messages.reports.status.reportado,
      }),
    )

    expect(onChange).toHaveBeenCalledWith({ statuses: [REPORT_STATUSES.IN_PROGRESS] })
  })

  it('el menú queda abierto tras marcar, para elegir varios de una', async () => {
    const { user } = renderFilters()

    await user.click(screen.getByRole('button', { name: labels.category }))
    await user.click(
      await screen.findByRole('menuitemcheckbox', {
        name: messages.reports.category.bache,
      }),
    )

    expect(
      screen.getByRole('menuitemcheckbox', { name: messages.reports.category.basura }),
    ).toBeInTheDocument()
  })

  it('ofrece las seis categorías del sistema', async () => {
    const { user } = renderFilters()

    await user.click(screen.getByRole('button', { name: labels.category }))

    expect(await screen.findAllByRole('menuitemcheckbox')).toHaveLength(6)
  })
})

describe('ReportFilters, zona', () => {
  it('no dispara una consulta por tecla: espera al debounce', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { onChange, user } = renderFilters()

    await user.type(screen.getByLabelText(labels.zone), 'San Martín')

    expect(onChange).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(400)
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ zone: 'San Martín' }))
    expect(onChange).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('el borrador se reajusta cuando la zona cambia desde afuera', async () => {
    // El botón «limpiar» y el «atrás» del navegador cambian la URL sin tocar el
    // input: si el borrador no se resincroniza, el texto viejo queda en pantalla.
    const { rerender } = renderWithProviders(
      <ReportFilters
        filters={{ ...EMPTY, zone: 'San Martín' }}
        orderings={ORDERINGS}
        isFiltered
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(labels.zone)).toHaveValue('San Martín')

    rerender(
      <ReportFilters
        filters={EMPTY}
        orderings={ORDERINGS}
        isFiltered={false}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(labels.zone)).toHaveValue('')
  })
})

describe('ReportFilters, fechas y orden', () => {
  it('muestra la fecha como dd/mm/aaaa, no como la escribe la API', async () => {
    // El orden de los campos no puede depender del idioma del navegador: en un
    // filtro de rango, 09/02 y 02/09 son dos meses distintos.
    renderFilters({ createdFrom: '2026-08-01' })

    // El disparador toma su nombre accesible del `<label>`, así que se lo busca
    // por ahí y se afirma sobre lo que muestra.
    expect(screen.getByLabelText(labels.createdFrom)).toHaveTextContent('01/08/2026')
  })

  it('sin fecha elegida muestra el formato esperado', async () => {
    renderFilters()

    expect(screen.getByLabelText(labels.createdFrom)).toHaveTextContent('dd/mm/aaaa')
    expect(screen.getByLabelText(labels.createdTo)).toHaveTextContent('dd/mm/aaaa')
  })

  it('elegir un día en el calendario emite la fecha que espera la API', async () => {
    const { onChange, user } = renderFilters({ createdFrom: '2026-08-15' })

    await user.click(screen.getByLabelText(labels.createdFrom))
    // El día se busca por el `data-day` de su celda, que es la fecha en crudo:
    // el número solo no alcanza, porque el calendario muestra también los días
    // del mes siguiente y el "1" aparece dos veces. Lo clickeable es el botón
    // de adentro, no la celda.
    const cell = document.querySelector('[data-day="2026-08-01"]')
    await user.click(cell?.querySelector('button') as HTMLElement)

    expect(onChange).toHaveBeenLastCalledWith({ createdFrom: '2026-08-01' })
  })

  it('se puede quitar una punta del rango sin tocar el resto', async () => {
    const { onChange, user } = renderFilters({ createdTo: '2026-08-31' })

    await user.click(screen.getByRole('button', { name: labels.clearDate }))

    expect(onChange).toHaveBeenLastCalledWith({ createdTo: '' })
  })

  it('cambia el orden por el valor que acepta la API', async () => {
    const { onChange, user } = renderFilters()

    await user.click(screen.getByRole('combobox', { name: labels.ordering }))
    await user.click(
      await screen.findByRole('option', { name: messages.reports.ordering.mostLiked }),
    )

    expect(onChange).toHaveBeenCalledWith({ ordering: '-like_count' })
  })

  it('lista solo los órdenes que le pasan', async () => {
    // El listado por municipalidad no ofrece el orden por apoyos.
    const onChange = vi.fn()
    renderWithProviders(
      <ReportFilters
        filters={EMPTY}
        orderings={['-created_at', 'created_at']}
        isFiltered={false}
        onChange={onChange}
        onClear={vi.fn()}
      />,
    )
    const user = userEvent.setup()
    await user.click(toggleButton())
    await user.click(screen.getByRole('combobox', { name: labels.ordering }))

    expect(await screen.findAllByRole('option')).toHaveLength(2)
  })
})

describe('ReportFilters, limpiar', () => {
  it('sin filtros aplicados no ofrece limpiar', () => {
    renderFilters()

    expect(screen.queryByRole('button', { name: labels.clear })).not.toBeInTheDocument()
  })

  it('con filtros aplicados, limpiar los descarta todos de una', async () => {
    const { onClear, user } = renderFilters(
      { statuses: [REPORT_STATUSES.REPORTED], zone: 'Centro' },
      true,
    )

    await user.click(screen.getByRole('button', { name: labels.clear }))

    expect(onClear).toHaveBeenCalledOnce()
  })
})

describe('ReportFilters, cierres a revisar (US-015)', () => {
  it('CP-015-P07 (US-015 E3) · el botón activa el filtro', async () => {
    const { onChange, user } = renderFilters()

    await user.click(screen.getByRole('button', { name: labels.closureReview }))

    expect(onChange).toHaveBeenLastCalledWith({ closureReview: true })
  })

  it('activo, se muestra presionado y vuelve a apagarlo', async () => {
    const { onChange, user } = renderFilters({ closureReview: true })

    const toggle = screen.getByRole('button', { name: labels.closureReview })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await user.click(toggle)

    expect(onChange).toHaveBeenLastCalledWith({ closureReview: false })
  })
})

describe('ReportFilters, rango de fechas', () => {
  it.each(['created-from', 'created-to'])(
    'el calendario de %s no ofrece días futuros',
    async (id) => {
      const today = toDateOnly(new Date())
      const { user } = renderFilters({ createdFrom: today, createdTo: today })

      await user.click(document.getElementById(id)!)

      const days = document.querySelectorAll<HTMLElement>('td[data-day]')
      expect(days.length).toBeGreaterThan(0)
      for (const day of days) {
        const future = day.dataset.day! > today
        expect(day.hasAttribute('data-disabled'), day.dataset.day).toBe(future)
      }
    },
  )
})

describe('ReportFilters, barra plegable', () => {
  it('arranca cerrada y se abre con el botón', async () => {
    const { user } = renderClosed()

    const toggle = toggleButton()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: labels.status })).toBeNull()

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: labels.status })).toBeVisible()
  })

  it('cerrada avisa que hay filtros aplicados y deja limpiarlos', async () => {
    const { onClear, user } = renderClosed({ zone: 'Corrientes' }, true)

    expect(screen.getByText(labels.active)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: labels.clear }))
    expect(onClear).toHaveBeenCalled()
  })
})
