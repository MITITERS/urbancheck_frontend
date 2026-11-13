import { useState } from 'react'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/format'

const SIZE_CLASS = {
  sm: 'size-7 text-[0.625rem]',
  md: 'size-8 text-[0.6875rem]',
  lg: 'size-11 text-sm',
} as const

/**
 * La cara de una persona en el panel: su foto de perfil, o sus iniciales.
 *
 * Las iniciales no son un adorno ni un reemplazo pobre de la foto: son el caso
 * normal. Ninguna cuenta de trabajo arranca con avatar, así que la mayoría de
 * las filas de una tabla no van a tener uno nunca. Lo que hacen —haya foto o
 * no— es darle a cada fila un ancla en la que el ojo se apoya para bajar.
 *
 * La foto se dibuja **encima** de las iniciales, no en su lugar. Así no hay
 * hueco mientras carga, y si la URL falla —un archivo borrado del disco, el
 * `/media` sin proxear— el `onError` la saca y abajo ya estaban las iniciales.
 * El caso roto termina viéndose igual que el caso sin foto, que es lo correcto:
 * un ícono de imagen partida no le dice nada a quien está triando reportes.
 */
export function PersonAvatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string
  /** URL de la foto de perfil. Ausente o nula: quedan las iniciales. */
  src?: string | null
  size?: keyof typeof SIZE_CLASS
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  return (
    <span
      aria-hidden
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-semibold text-muted-foreground',
        SIZE_CLASS[size],
        className,
      )}
    >
      {initials(name)}
      {src && !failed && (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </span>
  )
}
