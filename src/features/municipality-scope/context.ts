import { createContext, useContext } from 'react'
import type { Municipality } from '@/types/auth'

/**
 * La municipalidad cuyos datos muestra el panel.
 *
 * - Para el **agente** es la suya, fija: el servidor ya acota todo a su
 *   jurisdicción y el panel no manda ningún id.
 * - Para el **admin de la plataforma** es la que eligió en el selector del
 *   header. Todas las pantallas leen de acá en vez de tener su propio filtro: se
 *   elige una vez y se ve toda la información de esa municipalidad.
 */
export interface MunicipalityScope {
  /** Si el que mira elige la municipalidad (el admin). */
  selectable: boolean
  /** Las municipalidades entre las que elegir. Vacío para el agente. */
  municipalities: Municipality[]
  /** La municipalidad que se está viendo. Nula mientras carga o si no hay. */
  current: Municipality | null
  /**
   * El id que hay que mandarle a la API, o `undefined` si no hay que mandar
   * nada: el agente nunca manda municipio, el servidor ya lo acota.
   */
  municipalityId: number | undefined
  isLoading: boolean
  select: (id: number) => void
}

export const MunicipalityScopeContext = createContext<MunicipalityScope | null>(null)

export function useMunicipalityScope(): MunicipalityScope {
  const scope = useContext(MunicipalityScopeContext)
  if (!scope) {
    throw new Error('useMunicipalityScope necesita un MunicipalityScopeProvider.')
  }
  return scope
}
