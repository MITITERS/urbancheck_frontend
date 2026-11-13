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
import type { AccountState } from '@/types/auth'
import { useMunicipalAgents, useSetAgentActive } from './api/agents'
import { useMunicipalityScope } from '@/features/municipality-scope/context'
import { AgentFormDialog } from './components/AgentFormDialog'
import { AgentsTable } from './components/AgentsTable'
import type { MunicipalAgent } from './types'

/**
 * US-017 — alta, listado y archivado de agentes municipales.
 *
 * Dos pestañas sobre la misma tabla: los habilitados, que es el trabajo de
 * todos los días, y los archivados, que son las cuentas dadas de baja. La
 * separación la resuelve el servidor con `?state=`: una cuenta archivada no
 * viaja siquiera en la respuesta del listado principal, así que no le ocupa el
 * paginado a las que sí trabajan.
 *
 * Las dos consultas se piden juntas y no solo la de la pestaña visible: es lo
 * que hace que el número del rótulo esté desde el primer render y que cambiar
 * de pestaña sea instantáneo. Son dos listas chicas.
 *
 * El filtro por municipalidad vale para las dos pestañas —son dos cortes de la
 * misma lista, no dos listas—, igual que en la pantalla de validadores.
 */
export function AgentsPage() {
  // El admin ve la municipalidad elegida en el header: hasta que esté resuelta
  // no se pide nada, para no traer por un instante los datos de todas.
  return (
    <RequireMunicipality>
      <AgentsPageContent />
    </RequireMunicipality>
  )
}

function AgentsPageContent() {
  const [tab, setTab] = useState<AccountState>('active')
  // Los agentes de la municipalidad elegida en el header.
  const { municipalityId, current } = useMunicipalityScope()
  const scope = municipalityId === undefined ? {} : { municipalityId }
  const active = useMunicipalAgents({ ...scope, state: 'active' })
  const archived = useMunicipalAgents({ ...scope, state: 'inactive' })
  const setActive = useSetAgentActive()
  const [pendingDeactivation, setPendingDeactivation] = useState<MunicipalAgent | null>(
    null,
  )

  const toggle = async (agent: MunicipalAgent, activate: boolean) => {
    try {
      await setActive.mutateAsync({ id: agent.id, active: activate })
    } catch (error) {
      // El backend rechaza reactivar una cuenta sin municipalidad activa. Sin
      // este catch el rechazo quedaba como promesa sin atrapar, o sea en la
      // consola en vez de en la pantalla.
      toast.error(normalizeError(error).message)
      return
    }
    toast.success(activate ? messages.agents.activated : messages.agents.deactivated)
    setPendingDeactivation(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.agents.title}
        description={
          current ? messages.agents.description : messages.agents.noMunicipalities
        }
        actions={<>{current && <AgentFormDialog municipality={current} />}</>}
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as AccountState)}
        className="gap-4"
      >
        <TabsList>
          <TabsTrigger value="active">
            {messages.agents.tabActive}
            {active.data && ` (${active.data.length})`}
          </TabsTrigger>
          <TabsTrigger value="inactive">
            {messages.agents.tabArchived}
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
                emptyMessage={messages.agents.emptyForMunicipality}
              >
                <AgentsTable
                  agents={active.data ?? []}
                  actionLabel={messages.agents.deactivate}
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
                {messages.agents.archivedHint}
              </p>
              <QueryState
                isPending={archived.isPending}
                isError={archived.isError}
                error={archived.error}
                onRetry={() => void archived.refetch()}
                isEmpty={archived.data?.length === 0}
                emptyMessage={messages.agents.emptyArchivedForMunicipality}
              >
                <AgentsTable
                  agents={archived.data ?? []}
                  actionLabel={messages.agents.activate}
                  isReactivation
                  // Reactivar no le saca nada a nadie: no pide confirmación.
                  onAction={(agent) => void toggle(agent, true)}
                />
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* La baja pide confirmación explícita y aclara que no borra la cuenta. */}
      <ConfirmDialog
        open={pendingDeactivation !== null}
        onOpenChange={(open) => !open && setPendingDeactivation(null)}
        title={messages.agents.deactivateTitle}
        description={messages.agents.deactivateDescription}
        confirmLabel={messages.agents.deactivateConfirm}
        variant="destructive"
        isPending={setActive.isPending}
        onConfirm={() => {
          if (pendingDeactivation) void toggle(pendingDeactivation, false)
        }}
      />
    </div>
  )
}
