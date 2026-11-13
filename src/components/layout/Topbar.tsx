import { useLocation } from 'react-router-dom'
import { Building2, ChevronDown, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BrandMark, BrandWordmark } from '@/components/common/Brand'
import { PersonAvatar } from '@/components/common/PersonAvatar'
import { messages } from '@/config/messages'
import { MunicipalitySelector } from '@/features/municipality-scope/MunicipalitySelector'
import { ROLES, type AuthUser } from '@/types/auth'

function isMunicipalitiesSection(pathname: string) {
  return pathname === '/municipalidades' || pathname.startsWith('/municipalidades/')
}

export function Topbar({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const city = user.municipality?.city
  const { pathname } = useLocation()
  // En Municipalidades se administran todas a la vez: elegir una no aplica, y
  // el selector solo confundiría sobre qué se está viendo.
  const showsSelector =
    user.role === ROLES.PLATFORM_ADMIN && !isMunicipalitiesSection(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/85 px-4 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {/* Por debajo de 768px no hay sidebar, así que la marca vive acá. */}
        <div className="flex items-center gap-2 md:hidden">
          <BrandMark size="sm" />
          <BrandWordmark className="text-base" />
        </div>

        {city ? (
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden
              className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground sm:flex"
            >
              <Building2 className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.625rem] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                {messages.app.municipalityLabel}
              </p>
              <p className="truncate text-sm font-medium">{city}</p>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden text-sm font-medium text-muted-foreground md:inline">
              {messages.app.subtitle}
            </span>
            {/* El admin elige acá qué municipalidad está viendo, y lo ven todas
                las pantallas (ver `MunicipalityScope`). */}
            {showsSelector && <MunicipalitySelector />}
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="lg" className="gap-2 pl-1.5">
            {/* Sin foto quedan las iniciales sobre el degradado de la marca:
                es lo único que identifica al usuario de un vistazo, porque el
                nombre se corta en pantallas angostas. */}
            <PersonAvatar
              name={user.name || user.email}
              src={user.avatar}
              size="sm"
              className="brand-gradient text-white"
            />
            <span className="hidden max-w-40 truncate sm:inline">
              {user.name || user.email}
            </span>
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <div className="px-2 py-1.5">
            {user.name && <p className="truncate text-sm font-medium">{user.name}</p>}
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onLogout}>
            <LogOut className="size-4" aria-hidden />
            {messages.nav.logout}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
