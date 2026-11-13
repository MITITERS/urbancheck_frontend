import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { normalizeError } from '@/api/client'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { messages } from '@/config/messages'
import type { AccountState } from '@/types/auth'
import { useActiveAreas, useArea } from './api/areas'
import { useOperators, useSetOperatorActive } from './api/operators'
import { OperatorFormDialog } from './components/OperatorFormDialog'
import { OperatorsTable } from './components/OperatorsTable'
import type { Operator } from './types'

/**
 * US-044 — la gestión de operarios vive **dentro** de la ficha de su área.
 *
 * No es una sección independiente del panel a propósito: un operario siempre se
 * piensa en el contexto de la dependencia que integra, y sacarlo de ahí obliga
 * a elegir el área en cada alta sin ningún contexto alrededor.
 */
export function AreaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const areaId = Number(id)
  const area = useArea(areaId)
  // Las activas alimentan el traslado de área del escenario 5.
  const activeAreas = useActiveAreas()
  const [tab, setTab] = useState<AccountState>('active')
  const active = useOperators({ areaId, state: 'active' })
  const archived = useOperators({ areaId, state: 'inactive' })
  const setActive = useSetOperatorActive()
  const [pendingDeactivation, setPendingDeactivation] = useState<Operator | null>(null)

  const toggle = async (operator: Operator, activate: boolean) => {
    try {
      await setActive.mutateAsync({ id: operator.id, active: activate })
    } catch (error) {
      toast.error(normalizeError(error).message)
      return
    }
    toast.success(
      activate ? messages.operators.activated : messages.operators.deactivated,
    )
    setPendingDeactivation(null)
  }

  return (
    <div className="space-y-6">
      <Button
        asChild
        variant="ghost"
        size="lg"
        className="-ml-2.5 text-muted-foreground"
      >
        <Link to="/areas">
          <ArrowLeft className="size-4" aria-hidden />
          {messages.areas.backToList}
        </Link>
      </Button>

      <QueryState
        isPending={area.isPending}
        isError={area.isError}
        error={area.error}
        onRetry={() => void area.refetch()}
      >
        {area.data && (
          <>
            <PageHeader
              title={area.data.name}
              description={messages.areas.detailDescription}
              actions={
                <OperatorFormDialog
                  areas={activeAreas.data ?? []}
                  defaultAreaId={areaId}
                />
              }
            />

            <Card>
              <CardContent className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="size-3.5" aria-hidden />
                  {area.data.contact_email}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="size-3.5" aria-hidden />
                  {area.data.contact_phone}
                </span>
                <span className="text-muted-foreground">
                  {messages.areas.reports}: {area.data.report_count}
                </span>
              </CardContent>
            </Card>

            {/* Un área desactivada bloquea a todos sus operarios (escenario 9):
                se dice acá, que es donde se los está gestionando. */}
            {!area.data.is_active && (
              <p className="rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                {messages.areas.inactiveWarning}
              </p>
            )}

            <Tabs
              value={tab}
              onValueChange={(value) => setTab(value as AccountState)}
              className="gap-4"
            >
              <TabsList>
                <TabsTrigger value="active">
                  {messages.operators.tabActive}
                  {active.data && ` (${active.data.length})`}
                </TabsTrigger>
                <TabsTrigger value="inactive">
                  {messages.operators.tabArchived}
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
                      emptyMessage={messages.operators.empty}
                    >
                      <OperatorsTable
                        operators={active.data ?? []}
                        areas={activeAreas.data ?? []}
                        defaultAreaId={areaId}
                        actionLabel={messages.operators.deactivate}
                        onAction={setPendingDeactivation}
                      />
                    </QueryState>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inactive">
                <Card>
                  <CardContent>
                    <QueryState
                      isPending={archived.isPending}
                      isError={archived.isError}
                      error={archived.error}
                      onRetry={() => void archived.refetch()}
                      isEmpty={archived.data?.length === 0}
                      emptyMessage={messages.operators.emptyArchived}
                    >
                      <OperatorsTable
                        operators={archived.data ?? []}
                        areas={activeAreas.data ?? []}
                        defaultAreaId={areaId}
                        actionLabel={messages.operators.activate}
                        // Reactivar no le saca nada a nadie: sin confirmación.
                        onAction={(operator) => void toggle(operator, true)}
                      />
                    </QueryState>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </QueryState>

      {/* La baja pide confirmación explícita e informa cuánto trabajo tiene el
          área en curso: es lo que el operario deja de poder atender. */}
      <ConfirmDialog
        open={pendingDeactivation !== null}
        onOpenChange={(open) => !open && setPendingDeactivation(null)}
        title={messages.operators.deactivateTitle}
        description={messages.operators.deactivateDescription}
        confirmLabel={messages.operators.deactivateConfirm}
        variant="destructive"
        isPending={setActive.isPending}
        onConfirm={() => {
          if (pendingDeactivation) void toggle(pendingDeactivation, false)
        }}
      />
    </div>
  )
}
