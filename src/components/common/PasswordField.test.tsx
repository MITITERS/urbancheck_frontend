import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { PasswordField } from './PasswordField'

const LABEL = 'Contraseña'

function Harness({ onSubmit }: { onSubmit?: (event: React.FormEvent) => void } = {}) {
  const form = useForm<{ password: string }>({ defaultValues: { password: '' } })

  return (
    <form onSubmit={onSubmit}>
      <PasswordField control={form.control} name="password" label={LABEL} />
    </form>
  )
}

describe('PasswordField', () => {
  it('empieza oculto: mostrar es una decisión explícita', () => {
    renderWithProviders(<Harness />)

    expect(screen.getByLabelText(LABEL)).toHaveAttribute('type', 'password')
    expect(
      screen.getByRole('button', { name: messages.auth.showPassword }),
    ).toBeInTheDocument()
  })

  it('muestra y vuelve a ocultar lo escrito', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    const input = screen.getByLabelText(LABEL)
    await user.type(input, 'secreta123')

    await user.click(screen.getByRole('button', { name: messages.auth.showPassword }))
    expect(screen.getByLabelText(LABEL)).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText(LABEL)).toHaveValue('secreta123')

    await user.click(screen.getByRole('button', { name: messages.auth.hidePassword }))
    expect(screen.getByLabelText(LABEL)).toHaveAttribute('type', 'password')
  })

  it('no envía el formulario al mostrar la contraseña', async () => {
    // Un botón sin `type` dentro de un form lo envía: sería un login a medias.
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    const user = userEvent.setup()

    renderWithProviders(<Harness onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: messages.auth.showPassword }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('anuncia su estado a un lector de pantalla', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    const toggle = screen.getByRole('button', { name: messages.auth.showPassword })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggle)
    expect(
      screen.getByRole('button', { name: messages.auth.hidePassword }),
    ).toHaveAttribute('aria-pressed', 'true')
  })
})
