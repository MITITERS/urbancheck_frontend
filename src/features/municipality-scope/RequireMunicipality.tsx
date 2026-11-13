import type { ReactNode } from 'react'
import { Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { messages } from '@/config/messages'
import { useMunicipalityScope } from './context'

/**
 * Las pantallas que muestran datos de una municipalidad necesitan una elegida.
 * El agente siempre la tiene; el admin, salvo que no haya ninguna dada de alta:
 * en ese caso se le dice, en vez de pedirle a la API los datos de todas.
 */
export function RequireMunicipality({ children }: { children: ReactNode }) {
  const { selectable, current, isLoading } = useMunicipalityScope()
  if (!selectable || current) return <>{children}</>
  if (isLoading) return null
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <Building2 className="size-8 text-muted-foreground" aria-hidden />
        <p className="max-w-sm text-sm text-muted-foreground">
          {messages.municipalityScope.required}
        </p>
      </CardContent>
    </Card>
  )
}
