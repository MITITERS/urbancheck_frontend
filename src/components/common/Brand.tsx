import { cn } from '@/lib/utils'
import { messages } from '@/config/messages'

/**
 * La marca de UrbanCheck, en sus dos presentaciones.
 *
 * El pin es el mismo archivo que usa la app móvil, recortado y con el fondo en
 * transparente: el vecino que reporta desde el teléfono y el agente que lo
 * gestiona desde acá tienen que estar mirando el mismo logo.
 *
 * La palabra, en cambio, se compone con tipografía en vez de venir quemada en
 * el PNG. Así queda nítida en cualquier tamaño, se puede seleccionar y copiar,
 * y sigue al tema oscuro.
 */

const SIZE_CLASS = {
  sm: 'size-8',
  md: 'size-9',
  lg: 'size-20',
} as const

export function BrandMark({
  size = 'md',
  className,
}: {
  size?: keyof typeof SIZE_CLASS
  className?: string
}) {
  return (
    <img
      src="/urbancheck-mark.png"
      alt=""
      aria-hidden
      // `contain` y no `cover`: el pin es más alto que ancho y recortarlo le
      // comería la punta.
      className={cn('shrink-0 object-contain', SIZE_CLASS[size], className)}
    />
  )
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-heading leading-none font-semibold', className)}>
      <span className="text-foreground">Urban</span>
      <span className="text-brand-emerald-ink">Check</span>
    </span>
  )
}

/**
 * Pin + palabra + bajada, para las pantallas que no tienen el shell y necesitan
 * decir dónde está parado el usuario: login, cambio de contraseña, errores.
 */
export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <BrandMark size="lg" />
      <div className="space-y-1 text-center">
        <BrandWordmark className="text-2xl" />
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {messages.app.tagline}
        </p>
      </div>
    </div>
  )
}
