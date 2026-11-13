import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * El error de un formulario entero —credenciales inválidas, un rechazo del
 * servidor que no cae en ningún campo—.
 *
 * Antes era un párrafo rojo suelto entre los campos y el botón, del mismo
 * tamaño que el resto del texto: se perdía. Con el fondo y el ícono se lee como
 * lo que es, un alto en el camino, sin gritar más que el formulario.
 */
export function FormAlert({
  message,
  className,
}: {
  message: string
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive',
        className,
      )}
    >
      <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
      <span className="min-w-0">{message}</span>
    </div>
  )
}
