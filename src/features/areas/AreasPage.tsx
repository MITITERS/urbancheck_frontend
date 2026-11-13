import { useState } from 'react'
import { toast } from 'sonner'
import { normalizeError } from '@/api/client'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { messages } from '@/config/messages'
import { RequireMunicipality } from '@/features/municipality-scope/RequireMunicipality'
import { useMunicipalityScope } from '@/features/municipality-scope/context'
import { useAuth } from '@/hooks/useAuth'
import { ROLES, type AccountState } from '@/types/auth'
import { useAreas, useSetAreaActive } from './api/areas'
import { AreaFormDialog } from './components/AreaFormDialog'
import { AreasTable } from './components/AreasTable'
import type { OperationalArea } from './types'

/**
 * US-039 — alta, edición, listado y baja lógica de áreas operativas.
 *
 * Mismo patrón que la gestión de validadores de US-035, a propósito: es el
 * mismo tablero y quien ya usó aquella pantalla no tiene nada nuevo que
 * aprender acá. Dos pestañas sobre la misma tabla, y la separación la resuelve
 * el servidor con `?state=`.
 */
export function AreasPage() {
  // El admin ve la municipalidad elegida en el header: hasta que esté resuelta
  // no se pide nada, para no traer por un instante los datos de todas.
  return (
    <RequireMunicipality>
      <AreasPageContent />
    </RequireMunicipality>
  )
}

function AreasPageContent() {
  const { role } = useAuth()
  const isAdmin = role === ROLES.PLATFORM_ADMIN
  const [tab, setTab] = useState<AccountState>('active')

  // El admin ve la municipalidad elegida en el header; el agente, la suya.
  const { municipalityId, current } = useMunicipalityScope()
  const scope = municipalityId === undefined ? {} : { municipalityId }
  const active = useAreas({ ...scope, state: 'active' })
  const archived = useAreas({ ...scope, state: 'inactive' })
  const setActive = useSetAreaActive()
  const [pendingDeactivation, setPendingDeactivation] =
    useState<OperationalArea | null>(null)

  const toggle = async (area: OperationalArea, activate: boolean) => {
    try {
      await setActive.mutateAsync({ id: area.id, active: activate })
    } catch (error) {
      toast.error(normalizeError(error).message)
      return
    }
    toast.success(activate ? messages.areas.activated : messages.areas.deactivated)
    setPendingDeactivation(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.areas.title}
        description={
          isAdmin ? messages.areas.adminDescription : messages.areas.description
        }
        actions={
          <>
            {(!isAdmin || current) && (
              <AreaFormDialog
                municipality={isAdmin ? (current ?? undefined) : undefined}
              />
            )}
          </>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as AccountState)}
        className="gap-4"
      >
        <TabsList>
          <TabsTrigger value="active">
            {messages.areas.tabActive}
            {active.data && ` (${active.data.length})`}
          </TabsTrigger>
          <TabsTrigger value="inactive">
            {messages.areas.tabArchived}
            {archived.data && ` (${archived.data.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardContent>
              <QueryState
                isPending={active.isPending}
                isError={active.isError}
                error={active.error}
                onRetry={() => void active.refetch()}
                isEmpty={active.data?.length === 0}
                emptyMessage={messages.areas.emptyForMunicipality}
              >
                <AreasTable
                  areas={active.data ?? []}
                  // Toda la lista es de la misma municipalidad, la del header.
                  showMunicipality={false}
                  actionLabel={messages.areas.deactivate}
                  onAction={setPendingDeactivation}
                />
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive">
          <Card>
            <CardContent className="space-y-3">
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                {messages.areas.archivedHint}
              </p>
              <QueryState
                isPending={archived.isPending}
                isError={archived.isError}
                error={archived.error}
                onRetry={() => void archived.refetch()}
                isEmpty={archived.data?.length === 0}
                emptyMessage={messages.areas.emptyArchived}
              >
                <AreasTable
                  areas={archived.data ?? []}
                  // Toda la lista es de la misma municipalidad, la del header.
                  showMunicipality={false}
                  actionLabel={messages.areas.activate}
                  // Reactivar no le saca nada a nadie: no pide confirmación.
                  onAction={(area) => void toggle(area, true)}
                />
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* La baja pide confirmación explícita y dice cuántos reportes quedan
          vinculados: es la consecuencia que no se ve desde esta pantalla. */}
      <ConfirmDialog
        open={pendingDeactivation !== null}
        onOpenChange={(open) => !open && setPendingDeactivation(null)}
        title={messages.areas.deactivateTitle}
        description={
          pendingDeactivation
            ? `${messages.areas.deactivateDescription} ${messages.areas.deactivateReports(
                pendingDeactivation.report_count,
              )}`
            : messages.areas.deactivateDescription
        }
        confirmLabel={messages.areas.deactivateConfirm}
        variant="destructive"
        isPending={setActive.isPending}
        onConfirm={() => {
          if (pendingDeactivation) void toggle(pendingDeactivation, false)
        }}
      />
    </div>
  )
}
