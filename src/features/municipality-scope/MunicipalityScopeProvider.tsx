import { useMemo, useState, type ReactNode } from 'react'
import { useMunicipalities } from '@/features/platform-admin/api/municipalities'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/types/auth'
import { MunicipalityScopeContext, type MunicipalityScope } from './context'

/** Dónde se recuerda la última municipalidad elegida por el admin. */
const STORAGE_KEY = 'urbancheck.panel.municipality'

function readStored(): number | null {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY))
    return Number.isInteger(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

function store(id: number) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(id))
  } catch {
    // Sin almacenamiento (modo privado): la elección dura lo que la pestaña.
  }
}

/**
 * Resuelve la municipalidad que muestra el panel (ver `MunicipalityScope`).
 *
 * Para el admin siempre hay una elegida —no existe «todas»—: la última que
 * eligió, si sigue activa, o la primera de la lista. La elección se recuerda en
 * el navegador para que recargar no lo devuelva a otra ciudad.
 */
export function MunicipalityScopeProvider({ children }: { children: ReactNode }) {
  const { role, user } = useAuth()
  const isAdmin = role === ROLES.PLATFORM_ADMIN
  const municipalities = useMunicipalities({ enabled: isAdmin })
  const [chosen, setChosen] = useState<number | null>(readStored)

  const scope = useMemo<MunicipalityScope>(() => {
    if (!isAdmin) {
      const own = user?.municipality ?? null
      return {
        selectable: false,
        municipalities: own ? [own] : [],
        current: own,
        municipalityId: undefined,
        isLoading: false,
        select: () => {},
      }
    }
    const list = municipalities.data ?? []
    const current = list.find((item) => item.id === chosen) ?? list[0] ?? null
    return {
      selectable: true,
      municipalities: list,
      current,
      municipalityId: current?.id,
      isLoading: municipalities.isPending,
      select: (id: number) => {
        setChosen(id)
        store(id)
      },
    }
  }, [isAdmin, user, municipalities.data, municipalities.isPending, chosen])

  return (
    <MunicipalityScopeContext.Provider value={scope}>
      {children}
    </MunicipalityScopeContext.Provider>
  )
}
