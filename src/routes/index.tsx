import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { CHANGE_PASSWORD_ROUTE, LOGIN_ROUTE } from '@/config/constants'
import { AgentsPage } from '@/features/platform-admin/AgentsPage'
import { MunicipalitiesPage } from '@/features/platform-admin/MunicipalitiesPage'
import { PublicReportPage } from '@/features/public-report/PublicReportPage'
import { ConfirmEmailPage } from '@/features/account-links/ConfirmEmailPage'
import { ResetPasswordPage } from '@/features/account-links/ResetPasswordPage'
import { ModerationAppealsPage } from '@/features/moderation/ModerationAppealsPage'
import { ModerationInboxPage } from '@/features/moderation/ModerationInboxPage'
import { AreaDetailPage } from '@/features/areas/AreaDetailPage'
import { AreasPage } from '@/features/areas/AreasPage'
import { ValidatorsPage } from '@/features/validators/ValidatorsPage'
import { ChangePasswordPage } from '@/routes/pages/ChangePasswordPage'
import { ForbiddenPage } from '@/routes/pages/ForbiddenPage'
import { LoginPage } from '@/routes/pages/LoginPage'
import { NotFoundPage } from '@/routes/pages/NotFoundPage'
import { ReportDetailPage } from '@/features/reports/ReportDetailPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { HomeRedirect } from '@/routes/HomeRedirect'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { ADMIN_ONLY } from '@/routes/routeAccess'
import { PANEL_ROLES } from '@/types/auth'

// Las estadísticas (US-023) traen Recharts, que pesa más que el resto del
// panel junto: se cargan recién cuando alguien abre la sección.
const StatisticsPage = lazy(() =>
  import('@/features/statistics/StatisticsPage').then((module) => ({
    default: module.StatisticsPage,
  })),
)

/**
 * Route tree. Paths are in Spanish because they are user visible; everything
 * else stays in English, per the repository convention.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path={LOGIN_ROUTE} element={<LoginPage />} />
      <Route path="/sin-permisos" element={<ForbiddenPage />} />
      {/* La versión web de un reporte compartido (US-030): la única ruta del
          panel que no pide sesión, para quien abre el enlace sin la app. El
          enlace que se comparte es `/r/<token>`: lo responde el backend, con la
          vista previa para las redes, y redirige acá. */}
      <Route path="/reporte/:token" element={<PublicReportPage />} />
      {/* Los enlaces de los correos (N-16), también sin sesión: allauth ya no
          tiene páginas HTML. A la de recuperación llega `/reset-password` del
          backend cuando la app no está instalada. */}
      <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
      <Route path="/confirmar-correo" element={<ConfirmEmailPage />} />

      {/* Authenticated but outside the shell: nothing else is reachable until
          the temporary password is replaced. */}
      <Route element={<ProtectedRoute />}>
        <Route path={CHANGE_PASSWORD_ROUTE} element={<ChangePasswordPage />} />
      </Route>

      {/* La raíz manda a la primera pantalla del rol, no a una fija. */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomeRedirect />} />
      </Route>

      {/* Los dos roles del panel. El agente ve su municipio; el admin, la
          municipalidad que eligió en el header (`MunicipalityScope`). */}
      <Route element={<ProtectedRoute allowedRoles={PANEL_ROLES} />}>
        <Route element={<AppShell />}>
          <Route path="/reportes" element={<ReportsPage />} />
          {/* Estadísticas (US-023 y US-050). */}
          <Route
            path="/estadisticas"
            element={
              <Suspense fallback={null}>
                <StatisticsPage />
              </Suspense>
            }
          />
          {/* La bandeja de denuncias por contenido (US-049): el admin la ve,
              resolver es del agente. */}
          <Route path="/denuncias" element={<ModerationInboxPage />} />
          <Route path="/reportes/:id" element={<ReportDetailPage />} />
          {/* Protección de datos se unió a Denuncias (21/10): un enlace viejo
              llega a las denuncias por dato personal. */}
          <Route
            path="/privacidad"
            element={<Navigate to="/denuncias?tipo=dato_personal" replace />}
          />
          {/* Apelaciones contra descartes por moderación (US-049): el agente
              ve las de su municipio y el admin, todas. */}
          <Route path="/apelaciones" element={<ModerationAppealsPage />} />
          <Route path="/validadores" element={<ValidatorsPage />} />
          {/* Las áreas operativas y sus operarios (US-039 y US-044). */}
          <Route path="/areas" element={<AreasPage />} />
          <Route path="/areas/:id" element={<AreaDetailPage />} />
        </Route>
      </Route>

      {/* Platform-admin-only area (US-017). */}
      <Route element={<ProtectedRoute allowedRoles={ADMIN_ONLY} />}>
        <Route element={<AppShell />}>
          <Route path="/municipalidades" element={<MunicipalitiesPage />} />
          <Route path="/agentes" element={<AgentsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
