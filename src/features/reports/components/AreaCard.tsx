import { useState } from 'react'
import { toast } from 'sonner'
import { isApiError } from '@/api/client'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { messages } from '@/config/messages'
import { useActiveAreas } from '@/features/areas/api/areas'
import { formatDateTime } from '@/lib/format'
import { useAssignArea } from '../api/reportDetail'
import { REPORT_STATUSES } from '../types'
import { AreaSelectField } from './AreaSelectField'
import type { PanelReportDetail } from '../types'

/**
 * El área responsable del reporte y su historia de asignaciones (US-028).
 *
 * La reasignación se ofrece **solo** en En proceso: antes no hay nada que
 * distribuir, y en un estado final o archivado el área que intervino es
 * historia y no se toca (escenarios 5 y 8). El bloque igual se dibuja en esos
 * estados, sin acciones, porque el área sigue siendo parte del expediente.
 */
export function AreaCard({ report }: { report: PanelReportDetail }) {
  const canReassign = report.status === REPORT_STATUSES.IN_PROGRESS
  const assignArea = useAssignArea(report.id)
  const areas = useActiveAreas({ enabled: canReassign })
  const [open, setOpen] = useState(false)
  const [areaId, setAreaId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    setOpen(false)
    setAreaId('')
    setError(null)
  }

  const confirm = async () => {
    if (areaId === '') {
      setError(messages.reportDetail.areaRequired)
      return
    }
    try {
      await assignArea.mutateAsync(Number(areaId))
      toast.success(messages.reportDetail.areaReassigned)
      close()
    } catch (submitError) {
      toast.error(
        isApiError(submitError) ? submitError.message : messages.errors.unexpected,
      )
    }
  }

  return (
    <div className="space-y-3">
      {report.operational_area ? (
        <div className="space-y-1.5">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {report.operational_area.name}
            {/* Escenario 9: el área pudo desactivarse después de la
                asignación, y el reporte conserva el vínculo igual. */}
            {!report.operational_area.is_active && (
              <Badge variant="secondary">{messages.areas.inactive}</Badge>
            )}
          </p>
          {report.area_assigned_at && (
            <p className="text-xs text-muted-foreground">
              {formatDateTime(report.area_assigned_at)}
            </p>
          )}
          {!report.operational_area.is_active && (
            <p className="text-xs text-muted-foreground">
              {messages.reportDetail.areaInactive}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {messages.reportDetail.areaEmpty}
        </p>
      )}

      {canReassign && (
        <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
          {messages.reportDetail.areaReassign}
        </Button>
      )}

      {report.area_assignments.length > 1 && (
        <ul className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
          {report.area_assignments.map((entry) => (
            <li key={entry.created_at}>
              {entry.previous_area
                ? messages.reportDetail.areaAssignedFrom(
                    entry.previous_area.name,
                    entry.area.name,
                  )
                : messages.reportDetail.areaAssignedInitial(entry.area.name)}
              {' · '}
              {formatDateTime(entry.created_at)}
              {entry.assigned_by && ` · ${entry.assigned_by.name}`}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={open}
        onOpenChange={(next) => !next && close()}
        title={messages.reportDetail.areaReassignTitle}
        description={messages.transitions.procesar.description}
        confirmLabel={messages.reportDetail.areaReassign}
        isPending={assignArea.isPending}
        onConfirm={() => void confirm()}
      >
        <AreaSelectField
          areas={areas.data ?? []}
          value={areaId}
          onChange={(value) => {
            setAreaId(value)
            setError(null)
          }}
          error={error}
        />
      </ConfirmDialog>
    </div>
  )
}
