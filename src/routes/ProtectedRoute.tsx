import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Loader2, ShieldOff } from 'lucide-react'
import { FullScreenMessage } from '@/components/common/FullScreenMessage'
import { Button } from '@/components/ui/button'
import { ForbiddenPage } from '@/routes/pages/ForbiddenPage'
import { CHANGE_PASSWORD_ROUTE, LOGIN_ROUTE } from '@/config/constants'
import { messages } from '@/config/messages'
import { useAuth } from '@/hooks/useAuth'
import { isPanelRole, type Role } from '@/types/auth'

/** Cuenta de trabajo dada de baja: lo único que le queda es salir. */
function DeactivatedAccount() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <FullScreenMessage
      title={messages.forbidden.deactivatedTitle}
      description={messages.forbidden.deactivatedDescription}
      icon={<ShieldOff className="size-6" />}
      tone="destructive"
    >
      <Button
        variant="outline"
        onClick={() =>
          void logout().then(() => navigate(LOGIN_ROUTE, { replace: true }))
        }
      >
        {messages.forbidden.logout}
      </Button>
    </FullScreenMessage>
  )
}

interface ProtectedRouteProps {
  /**
   * Extra restriction on top of "must be municipal staff". Omit it to allow any
   * panel role.
   */
  allowedRoles?: readonly Role[]
}

/**
 * Guards authentication *and* role. A user with a valid session but a non
 * municipal role gets the "insufficient permissions" screen instead of a silent
 * redirect: bouncing them back to the login screen would look like a broken
 * password.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <FullScreenMessage
        title={messages.auth.checkingSession}
        icon={<Loader2 className="size-6 animate-spin text-primary" />}
      />
    )
  }

  if (status === 'anonymous' || !user) {
    return <Navigate to={LOGIN_ROUTE} replace state={{ from: location.pathname }} />
  }

  if (!isPanelRole(user.role)) {
    return <ForbiddenPage />
  }

  // La cuenta existe y la sesión es válida, pero el admin la dio de baja: el
  // backend le responde 403 a todo el panel. Se frena acá y se explica, en vez
  // de dejarla entrar a una pantalla donde cada consulta va a fallar.
  if (!user.isActive) {
    return <DeactivatedAccount />
  }

  // A temporary password locks the whole panel until it is replaced.
  if (user.mustChangePassword && location.pathname !== CHANGE_PASSWORD_ROUTE) {
    return <Navigate to={CHANGE_PASSWORD_ROUTE} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <ForbiddenPage />
  }

  return <Outlet />
}
