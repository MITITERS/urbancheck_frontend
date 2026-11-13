import { Link, useNavigate } from 'react-router-dom'
import { Lock, SignpostBig } from 'lucide-react'
import { FullScreenMessage } from '@/components/common/FullScreenMessage'
import { Button } from '@/components/ui/button'
import { LOGIN_ROUTE } from '@/config/constants'
import { messages } from '@/config/messages'
import { useAuth } from '@/hooks/useAuth'
import { homeRouteFor } from '@/routes/routeAccess'
import { isPanelRole } from '@/types/auth'

/**
 * Pantalla de permisos insuficientes, para dos situaciones distintas.
 *
 * 1. **La cuenta no opera el panel** —un ciudadano o un validador con sesión
 *    válida—. Ahí lo único que puede hacer es salir, y el mensaje lo manda a la
 *    app móvil, que es donde su cuenta sirve.
 * 2. **La cuenta sí opera el panel, pero esa sección no es suya**: un admin en
 *    el listado de reportes, por ejemplo, al que puede llegar por el historial
 *    del navegador. Decirle que use la app móvil sería falso, y ofrecerle solo
 *    cerrar sesión lo deja en un callejón sin salida: se le ofrece volver a su
 *    pantalla.
 */
export function ForbiddenPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isStaff = user !== null && isPanelRole(user.role)

  if (isStaff) {
    return (
      <FullScreenMessage
        title={messages.forbidden.sectionTitle}
        description={messages.forbidden.sectionDescription}
        icon={<SignpostBig className="size-6" />}
      >
        <Button asChild>
          <Link to={homeRouteFor(user.role)}>{messages.forbidden.goHome}</Link>
        </Button>
      </FullScreenMessage>
    )
  }

  return (
    <FullScreenMessage
      title={messages.forbidden.title}
      description={messages.forbidden.description}
      icon={<Lock className="size-6" />}
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
