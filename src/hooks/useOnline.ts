import { useSyncExternalStore } from 'react'
import { onlineManager } from '@tanstack/react-query'

/**
 * Si el navegador tiene red (N-19). Lee el `onlineManager` de TanStack Query,
 * que es el mismo que pausa las consultas sin conexión: el aviso y las
 * consultas no pueden contradecirse.
 */
export function useOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
    () => true,
  )
}
