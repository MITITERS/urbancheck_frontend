import type { ReactNode } from 'react'
import { BrandMark } from '@/components/common/Brand'
import { cn } from '@/lib/utils'

/** Centered single-message screen: loading, empty and error states reuse it. */
export function FullScreenMessage({
  title,
  description,
  icon,
  tone = 'default',
  children,
}: {
  title: string
  description?: string
  /** Ícono del estado, dentro del disco de arriba. Sin él va el pin de marca. */
  icon?: ReactNode
  /** `destructive` para lo que le cierra la puerta al usuario. */
  tone?: 'default' | 'destructive'
  children?: ReactNode
}) {
  return (
    <div className="brand-canvas flex min-h-svh flex-col items-center justify-center gap-6 p-8 text-center">
      <span
        aria-hidden
        className={cn(
          'flex size-16 items-center justify-center rounded-2xl shadow-card',
          tone === 'destructive'
            ? 'bg-destructive/10 text-destructive'
            : 'bg-card text-muted-foreground',
        )}
      >
        {icon ?? <BrandMark size="md" />}
      </span>

      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {children}
    </div>
  )
}
