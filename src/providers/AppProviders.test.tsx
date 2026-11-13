import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { onlineManager } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { messages } from '@/config/messages'
import { AppProviders } from './AppProviders'

/**
 * N-19 — un error de renderizado o la falta de red dejaban el panel en blanco
 * y sin explicación.
 */
const t = messages.errorBoundary

afterEach(() => {
  act(() => onlineManager.setOnline(true))
  vi.restoreAllMocks()
})

const state = { broken: true }

function Fragile() {
  if (state.broken) throw new Error('falla de render')
  return <p>Pantalla recuperada</p>
}

describe('errores de renderizado', () => {
  it('muestran un mensaje y un botón para reintentar, no una pantalla en blanco', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    state.broken = true
    render(
      <AppProviders>
        <Fragile />
      </AppProviders>,
    )

    expect(await screen.findByText(t.title)).toBeInTheDocument()

    state.broken = false
    await userEvent.click(screen.getByRole('button', { name: t.retry }))

    expect(await screen.findByText('Pantalla recuperada')).toBeInTheDocument()
  })
})

describe('sin conexión', () => {
  it('avisa mientras no hay red y deja de avisar cuando vuelve', async () => {
    render(
      <AppProviders>
        <p>Panel</p>
      </AppProviders>,
    )
    expect(screen.queryByText(messages.offline.banner)).toBeNull()

    act(() => onlineManager.setOnline(false))
    expect(await screen.findByText(messages.offline.banner)).toBeInTheDocument()

    act(() => onlineManager.setOnline(true))
    expect(screen.queryByText(messages.offline.banner)).toBeNull()
  })
})
