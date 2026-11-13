import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PersonAvatar } from './PersonAvatar'

/**
 * La cara de una persona en el panel.
 *
 * El avatar entero va con `aria-hidden`: es decorativo, el nombre está siempre
 * al lado o en el título del diálogo, y un lector de pantalla que anuncie
 * «Ana Gómez, imagen, AG, Ana Gómez» estorba más de lo que ayuda. Por eso la
 * foto se busca en el DOM y no por rol: de la accesibilidad ya está afuera, que
 * es justamente lo que se quiere.
 */

function image(container: HTMLElement) {
  return container.querySelector('img')
}

describe('PersonAvatar', () => {
  it('muestra la foto cuando la cuenta tiene una', () => {
    const { container } = render(
      <PersonAvatar name="Ana Gómez" src="/media/avatars/ana.jpg" />,
    )

    expect(image(container)).toHaveAttribute('src', '/media/avatars/ana.jpg')
  })

  it('sin foto quedan las iniciales', () => {
    const { container } = render(<PersonAvatar name="Ana Gómez" />)

    expect(screen.getByText('AG')).toBeInTheDocument()
    expect(image(container)).not.toBeInTheDocument()
  })

  it('una cuenta sin avatar llega con null, no con undefined', () => {
    // Es lo que manda la API: el campo viaja siempre, vacío o no.
    const { container } = render(<PersonAvatar name="Ana Gómez" src={null} />)

    expect(image(container)).not.toBeInTheDocument()
  })

  it('las iniciales están debajo de la foto, no en su lugar', () => {
    // Por eso no hay hueco mientras carga: lo de abajo ya está dibujado.
    render(<PersonAvatar name="Ana Gómez" src="/media/avatars/ana.jpg" />)

    expect(screen.getByText('AG')).toBeInTheDocument()
  })

  it('si la foto no carga, se cae a las iniciales en lugar de dejar el ícono roto', () => {
    const { container } = render(
      <PersonAvatar name="Ana Gómez" src="/media/avatars/borrada.jpg" />,
    )

    fireEvent.error(image(container) as HTMLImageElement)

    expect(image(container)).not.toBeInTheDocument()
    expect(screen.getByText('AG')).toBeInTheDocument()
  })
})
