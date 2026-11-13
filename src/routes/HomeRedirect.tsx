import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { homeRouteFor } from './routeAccess'

/** Manda a cada rol a su primera pantalla en lugar de a una ruta fija. */
export function HomeRedirect() {
  const { role } = useAuth()
  return <Navigate to={homeRouteFor(role)} replace />
}
