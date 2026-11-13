import { Outlet, useNavigate } from 'react-router-dom'
import { RouteErrorBoundary } from '@/components/common/ErrorBoundary'
import { LOGIN_ROUTE } from '@/config/constants'
import { useAuth } from '@/hooks/useAuth'
import { MunicipalityScopeProvider } from '@/features/municipality-scope/MunicipalityScopeProvider'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

/** Chrome shared by every authenticated screen. */
export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const handleLogout = () => {
    void logout().then(() => navigate(LOGIN_ROUTE, { replace: true }))
  }

  return (
    // La municipalidad que se está viendo la eligen el header y la leen todas
    // las pantallas: el proveedor envuelve a las dos.
    <MunicipalityScopeProvider>
      <div className="flex min-h-svh bg-background">
        <Sidebar role={user.role} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={user} onLogout={handleLogout} />
          {/*
          El contenido tiene un ancho máximo: una tabla de siete columnas
          estirada a lo ancho de un monitor de 27" deja el ojo saltando entre la
          primera y la última celda.
        */}
          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[100rem]">
              {/* Una pantalla que falla no se lleva el menú (N-19). */}
              <RouteErrorBoundary>
                <Outlet />
              </RouteErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </MunicipalityScopeProvider>
  )
}
