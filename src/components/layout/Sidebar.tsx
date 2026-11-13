import { NavLink } from 'react-router-dom'
import {
  Building2,
  ChartBar,
  FileText,
  Flag,
  Gavel,
  Hammer,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandMark, BrandWordmark } from '@/components/common/Brand'
import { messages } from '@/config/messages'
import { useModerationCount } from '@/features/moderation/api/moderation'
import { useMunicipalityScope } from '@/features/municipality-scope/context'
import { usePrivacyRequests } from '@/features/privacy/api/privacyRequests'
import { canAccessPath } from '@/routes/routeAccess'
import { ROLES, type Role } from '@/types/auth'

interface NavItem {
  to: string
  label: string
  icon: typeof FileText
}

/**
 * Orden del menú, pensado para los dos roles a la vez.
 *
 * El admin ve municipalidades → agentes → validadores: de lo más general a lo
 * más específico, que es como se dan de alta. El agente ve reportes →
 * validadores, con su pantalla de trabajo primero. Reportes va en el medio para
 * que las dos lecturas salgan bien de una sola lista: el filtro por rol lo saca
 * del menú del admin, que los mira por municipalidad.
 */
const NAV_ITEMS: readonly NavItem[] = [
  { to: '/municipalidades', label: messages.nav.municipalities, icon: Building2 },
  { to: '/agentes', label: messages.nav.agents, icon: ShieldCheck },
  { to: '/reportes', label: messages.nav.reports, icon: FileText },
  // Junto a reportes: es la otra mitad de la pantalla de trabajo del agente,
  // el mismo universo visto en conjunto (US-023).
  { to: '/estadisticas', label: messages.nav.statistics, icon: ChartBar },
  { to: '/validadores', label: messages.nav.validators, icon: Users },
  // Al final y después de validadores: es la sección de gestión interna del
  // municipio, la que menos se abre en el día a día del agente.
  { to: '/areas', label: messages.nav.areas, icon: Hammer },
  // La moderación de contenido (US-049): la bandeja es solo del agente; las
  // apelaciones las ven los dos, cada uno con su alcance.
  { to: '/denuncias', label: messages.nav.moderation, icon: Flag },
  { to: '/apelaciones', label: messages.nav.moderationAppeals, icon: Gavel },
]

export function Sidebar({ role }: { role: Role }) {
  // Se filtra con la misma tabla que guarda las rutas: así el sidebar no puede
  // ofrecer un destino que después rebota con «permisos insuficientes».
  const items = NAV_ITEMS.filter((item) => canAccessPath(role, item.to))
  // El contador de pendientes de la bandeja (US-049): solo el agente lo pide,
  // porque es el único que la atiende.
  const { municipalityId, current } = useMunicipalityScope()
  const moderation = useModerationCount({
    enabled: role === ROLES.MUNICIPAL_AGENT || current !== null,
    municipalityId,
  })
  // Denuncias junta las de contenido y las de dato personal (21/10).
  const privacy = usePrivacyRequests('pending', municipalityId, {
    enabled: role === ROLES.MUNICIPAL_AGENT || current !== null,
  })
  const badges: Partial<Record<string, number>> = {
    '/denuncias':
      moderation.data === undefined && privacy.data === undefined
        ? undefined
        : (moderation.data ?? 0) + (privacy.data?.length ?? 0),
  }

  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b px-5">
        <BrandMark size="sm" />
        <BrandWordmark className="text-lg" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                {/*
                  La barrita de la izquierda es lo que hace que la sección
                  actual se vea de un vistazo: el relleno solo, tan tenue,
                  obligaba a leer las cuatro etiquetas para ubicarse.
                */}
                <span
                  aria-hidden
                  className={cn(
                    'brand-gradient absolute inset-y-2 left-0 w-[3px] rounded-r-full transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <Icon
                  className={cn(
                    'size-4 shrink-0 transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground/70 group-hover:text-foreground',
                  )}
                  aria-hidden
                />
                {label}
                {!!badges[to] && (
                  <span
                    className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-[0.6875rem] leading-none font-semibold text-white tabular-nums"
                    aria-label={messages.nav.pendingCount(badges[to] ?? 0)}
                  >
                    {badges[to]}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 p-3">
        <div className="rounded-lg bg-muted/60 px-3 py-2.5">
          <p className="text-xs font-medium text-foreground">{messages.app.subtitle}</p>
          <p className="text-[0.6875rem] tracking-wide text-muted-foreground">
            {messages.app.tagline}
          </p>
        </div>
      </div>
    </aside>
  )
}
