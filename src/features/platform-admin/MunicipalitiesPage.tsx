import { useState } from 'react'
import { Spline, Users } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { messages } from '@/config/messages'
import { formatDate } from '@/lib/format'
import { useDeleteMunicipality, useMunicipalities } from './api/municipalities'
import {
  CreateMunicipalityDialog,
  MunicipalityFormDialog,
} from './components/MunicipalityFormDialog'
import type { MunicipalityDetail } from './types'

const labels = messages.municipalities

/** El aviso de la baja, según qué haya arrastrado. */
function describeDeletion(users: number, areas: number): string {
  if (users > 0 && areas > 0) return labels.deletedWithStaffAndAreas(users, areas)
  if (users > 0) return labels.deletedWithStaff(users)
  if (areas > 0) return labels.deletedWithAreas(areas)
  return labels.deleted
}

/** US-017 — alta, edición, baja y listado de municipalidades. */
export function MunicipalitiesPage() {
  const query = useMunicipalities()
  const deleteMunicipality = useDeleteMunicipality()
  const [pendingDeletion, setPendingDeletion] = useState<MunicipalityDetail | null>(
    null,
  )

  const confirmDeletion = async () => {
    if (!pendingDeletion) return
    const { deactivated_users: users, deactivated_areas: areas } =
      await deleteMunicipality.mutateAsync(pendingDeletion.id)
    // Qué cayó con el municipio lo cuenta el servidor: son consecuencias que
    // ocurren en otras pantallas —las cuentas de trabajo y las áreas
    // operativas—, así que se dicen acá.
    toast.success(describeDeletion(users, areas))
    setPendingDeletion(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={labels.title}
        description={labels.description}
        actions={<CreateMunicipalityDialog />}
      />

      <Card>
        <CardContent>
          <QueryState
            isPending={query.isPending}
            isError={query.isError}
            error={query.error}
            onRetry={() => void query.refetch()}
            isEmpty={query.data?.length === 0}
            emptyMessage={labels.empty}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{labels.city}</TableHead>
                  <TableHead>{labels.province}</TableHead>
                  <TableHead className="w-40">{labels.boundaryColumn}</TableHead>
                  <TableHead className="w-24 text-right">{labels.reports}</TableHead>
                  <TableHead className="w-24 text-right">{labels.users}</TableHead>
                  <TableHead className="w-32">{labels.createdAt}</TableHead>
                  <TableHead className="w-44 text-right">{labels.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data?.map((municipality) => (
                  <TableRow key={municipality.id} className="group">
                    <TableCell className="font-medium">
                      {/* Solo el nombre: los reportes de cada ciudad se ven en
                          Reportes, eligiéndola en el selector del header. */}
                      {municipality.city}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {municipality.province}
                    </TableCell>
                    <TableCell>
                      {municipality.boundary?.length ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Spline
                            className="size-3.5 text-muted-foreground"
                            aria-hidden
                          />
                          {labels.boundaryPointsShort(municipality.boundary.length)}
                        </span>
                      ) : (
                        // Sin límite no recibe reportes: no es un detalle
                        // cosmético y por eso se dice, no se deja en blanco.
                        <span className="text-muted-foreground">
                          {labels.noBoundary}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {municipality.report_count}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {municipality.user_count}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(municipality.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <MunicipalityFormDialog
                          municipality={municipality}
                          trigger={<Button variant="outline">{labels.edit}</Button>}
                        />
                        <Button
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setPendingDeletion(municipality)}
                        >
                          {labels.delete}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </QueryState>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingDeletion !== null}
        onOpenChange={(open) => !open && setPendingDeletion(null)}
        title={labels.deleteTitle}
        description={
          pendingDeletion
            ? `${labels.deleteDescription} ${labels.deleteWithData(
                pendingDeletion.report_count,
                pendingDeletion.user_count,
              )}`
            : labels.deleteDescription
        }
        confirmLabel={labels.deleteConfirm}
        variant="destructive"
        isPending={deleteMunicipality.isPending}
        onConfirm={() => void confirmDeletion()}
      >
        {/* La baja desactiva al personal del municipio: es una consecuencia en
            otra pantalla, así que se avisa antes de ejecutarla, no después. */}
        {pendingDeletion && pendingDeletion.user_count > 0 && (
          <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <Users className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{labels.deleteStaffWarning}</span>
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
