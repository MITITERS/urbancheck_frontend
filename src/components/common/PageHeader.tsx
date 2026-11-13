import type { ReactNode } from 'react'

/**
 * Encabezado de una pantalla del panel: qué es y qué se puede hacer acá.
 *
 * Vivía dentro de la tarjeta del listado, junto con los filtros y la tabla, y
 * eso dejaba una sola caja enorme con tres cosas de jerarquías distintas
 * adentro. Sacándolo afuera, la tarjeta vuelve a ser lo que es —los datos— y el
 * título pasa a ser el título de la página, con el peso que le corresponde.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: ReactNode
  /** Botones y filtros de alcance de la pantalla, alineados a la derecha. */
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
