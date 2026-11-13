import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { messages } from '@/config/messages'
import { Pagination } from './Pagination'

/** Paginado del listado del panel (US-012, escenario de volumen). */

const labels = messages.reports.pagination

function renderPagination(props: Partial<Parameters<typeof Pagination>[0]> = {}) {
  const onPageChange = vi.fn()
  const onPageSizeChange = vi.fn()
  render(
    <Pagination
      page={1}
      pageSize={20}
      total={45}
      hasPrevious={false}
      hasNext
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      {...props}
    />,
  )
  return { onPageChange, onPageSizeChange, user: userEvent.setup() }
}

describe('Pagination', () => {
  it('sin resultados no ocupa lugar en pantalla', () => {
    const { container } = render(
      <Pagination
        page={1}
        pageSize={20}
        total={0}
        hasPrevious={false}
        hasNext={false}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('dice qué tramo se está viendo del total', () => {
    renderPagination()

    expect(screen.getByText(labels.summary(1, 20, 45))).toBeInTheDocument()
  })

  it('en la última página el tramo termina en el total, no en el múltiplo', () => {
    // 45 resultados de a 20: la tercera página va del 41 al 45, no al 60.
    renderPagination({ page: 3, hasPrevious: true, hasNext: false })

    expect(screen.getByText(labels.summary(41, 45, 45))).toBeInTheDocument()
  })

  it('en la primera página no se puede retroceder', () => {
    renderPagination()

    expect(screen.getByRole('button', { name: labels.previous })).toBeDisabled()
    expect(screen.getByRole('button', { name: labels.next })).toBeEnabled()
  })

  it('en la última no se puede avanzar', () => {
    renderPagination({ page: 3, hasPrevious: true, hasNext: false })

    expect(screen.getByRole('button', { name: labels.next })).toBeDisabled()
  })

  it('avanzar pide la página siguiente', async () => {
    const { onPageChange, user } = renderPagination({ page: 2, hasPrevious: true })

    await user.click(screen.getByRole('button', { name: labels.next }))

    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('retroceder pide la anterior', async () => {
    const { onPageChange, user } = renderPagination({ page: 2, hasPrevious: true })

    await user.click(screen.getByRole('button', { name: labels.previous }))

    expect(onPageChange).toHaveBeenCalledWith(1)
  })
})

describe('Pagination, filas por página', () => {
  it('muestra cuántas filas se están trayendo', () => {
    renderPagination({ pageSize: 50 })

    expect(screen.getByLabelText(labels.pageSize)).toHaveTextContent(labels.perPage(50))
  })

  it('elegir otro tamaño lo emite', async () => {
    const { onPageSizeChange, user } = renderPagination()

    await user.click(screen.getByLabelText(labels.pageSize))
    await user.click(await screen.findByRole('option', { name: labels.perPage(50) }))

    expect(onPageSizeChange).toHaveBeenCalledWith(50)
  })

  it('el resumen cuenta con el tamaño elegido', () => {
    // «21–40 de 45» y no «21–45»: lo que se ve es una página, no el resto.
    renderPagination({ page: 2, pageSize: 20, total: 45 })

    expect(screen.getByText(labels.summary(21, 40, 45))).toBeInTheDocument()
  })
})
