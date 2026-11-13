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
import { useSetValidatorActive, useValidators } from './api/validators'
import { ValidatorFormDialog } from './components/ValidatorFormDialog'
import { ValidatorsTable } from './components/ValidatorsTable'
import type { Validator } from './types'

/**
 * US-035 — alta, listado y baja lógica de validadores.
 *
 * La misma pantalla para los dos roles del panel, porque hacen lo mismo; lo
 * único que cambia es el alcance. El agente ve los de su municipalidad y las
 * altas caen ahí sin que pueda elegir. El admin no está acotado a ninguna: ve
 * los de todas, puede filtrar, y elige la municipalidad en cada alta.
 *
 * Dos pestañas sobre la misma tabla: los habilitados y los archivados —las
 * cuentas dadas de baja—. La separación la resuelve el servidor con `?state=`,
 * así que un validador archivado no ocupa el paginado del listado principal.
 * El filtro por municipalidad vale para las dos pestañas: son dos cortes
 * distintos de la misma lista, no dos listas.
 */
export function ValidatorsPage() {
  // El admin ve la municipalidad elegida en el header: hasta que esté resuelta
  // no se pide nada, para no traer por un instante los datos de todas.
  return (
    <RequireMunicipality>
      <ValidatorsPageContent />
    </RequireMunicipality>
  )
}

function ValidatorsPageContent() {
  const { role } = useAuth()
  const isAdmin = role === ROLES.PLATFORM_ADMIN
  const [tab, setTab] = useState<AccountState>('active')

  // El admin ve la municipalidad elegida en el header; el agente, la suya, que
  // acota el servidor sin que el panel mande nada.
  const { municipalityId, current } = useMunicipalityScope()
  const scope = municipalityId === undefined ? {} : { municipalityId }
  // Las dos se piden juntas: es lo que pone el número en el rótulo desde el
  // primer render y hace instantáneo el cambio de pestaña.
  const active = useValidators({ ...scope, state: 'active' })
  const archived = useValidators({ ...scope, state: 'inactive' })
  const setActive = useSetValidatorActive()
  const [pendingDeactivation, setPendingDeactivation] = useState<Validator | null>(null)

  const toggle = async (validator: Validator, activate: boolean) => {
    try {
      await setActive.mutateAsync({ id: validator.id, active: activate })
    } catch (error) {
      // El backend rechaza reactivar una cuenta sin municipalidad activa. Sin
      // este catch el rechazo quedaba como promesa sin atrapar, o sea en la
      // consola en vez de en la pantalla.
      toast.error(normalizeError(error).message)
      return
    }
    toast.success(
      activate ? messages.validators.activated : messages.validators.deactivated,
    )
    setPendingDeactivation(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.validators.title}
        description={
          isAdmin
            ? messages.validators.adminDescription
            : messages.validators.description
        }
        actions={
          <>
            {(!isAdmin || current) && (
              <ValidatorFormDialog
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
            {messages.validators.tabActive}
            {active.data && ` (${active.data.length})`}
          </TabsTrigger>
          <TabsTrigger value="inactive">
            {messages.validators.tabArchived}
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
                emptyMessage={messages.validators.emptyForMunicipality}
              >
                <ValidatorsTable
                  validators={active.data ?? []}
                  // Toda la lista es de la misma municipalidad, la del header.
                  showMunicipality={false}
                  actionLabel={messages.validators.deactivate}
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
                {messages.validators.archivedHint}
              </p>
              <QueryState
                isPending={archived.isPending}
                isError={archived.isError}
                error={archived.error}
                onRetry={() => void archived.refetch()}
                isEmpty={archived.data?.length === 0}
                emptyMessage={messages.validators.emptyArchivedForMunicipality}
              >
                <ValidatorsTable
                  validators={archived.data ?? []}
                  // Toda la lista es de la misma municipalidad, la del header.
                  showMunicipality={false}
                  actionLabel={messages.validators.activate}
                  isReactivation
                  // Reactivar no le saca nada a nadie: no pide confirmación.
                  onAction={(validator) => void toggle(validator, true)}
                />
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* La baja pide confirmación explícita y aclara que no es una expulsión. */}
      <ConfirmDialog
        open={pendingDeactivation !== null}
        onOpenChange={(open) => !open && setPendingDeactivation(null)}
        title={messages.validators.deactivateTitle}
        description={messages.validators.deactivateDescription}
        confirmLabel={messages.validators.deactivateConfirm}
        variant="destructive"
        isPending={setActive.isPending}
        onConfirm={() => {
          if (pendingDeactivation) void toggle(pendingDeactivation, false)
        }}
      />
    </div>
  )
}
