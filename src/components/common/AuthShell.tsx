import type { ReactNode } from 'react'
import { BrandLockup } from '@/components/common/Brand'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * El marco de las pantallas que se atraviesan sin sesión útil: login y cambio
 * de contraseña obligatorio.
 *
 * Las dos son idénticas salvo por el formulario, así que comparten el fondo, el
 * logo y la tarjeta. Es también el único lugar del panel donde la marca aparece
 * a tamaño grande: son las dos pantallas que se ven antes de tener idea de
 * dónde está uno parado.
 */
export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="brand-canvas flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <BrandLockup />

      <Card className="w-full max-w-sm shadow-hero">
        <CardHeader className="gap-1.5 text-center">
          <CardTitle className="text-lg">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}
