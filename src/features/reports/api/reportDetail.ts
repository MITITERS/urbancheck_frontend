import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { reportKeys } from '@/lib/queryKeys'
import type { PanelReportDetail, TransitionOperation } from '../types'

/** Operation name (domain, Spanish) -> API path segment. */
const OPERATION_PATH: Record<TransitionOperation, string> = {
  procesar: 'process',
  // US-046 sacó `resolver`: el agente ya no declara resuelto un trabajo que no
  // ejecutó. Lo que queda es confirmar el cierre del operario.
  confirmar_resolucion_municipal: 'confirm-resolution',
  cancelar: 'cancel',
  archivar: 'archive',
  reactivar: 'reactivate',
}

export function useReportDetail(id: number) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<PanelReportDetail>(
        endpoints.panelReports.detail(id),
      )
      return data
    },
  })
}

export function useReportTransition(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      operation,
      reason,
      areaId,
    }: {
      operation: TransitionOperation
      reason?: string
      /**
       * Obligatorio en `procesar` (US-028): asignar el área **es** empezar la
       * gestión, así que viaja en la misma petición que la transición.
       */
      areaId?: number
    }) => {
      const { data } = await apiClient.post<PanelReportDetail>(
        endpoints.panelReports.transition(id, OPERATION_PATH[operation]),
        {
          ...(reason ? { reason } : {}),
          ...(areaId ? { area_id: areaId } : {}),
        },
      )
      return data
    },
    onSuccess: (detail) => {
      queryClient.setQueryData(reportKeys.detail(id), detail)
      // Se invalida por prefijo para que el listado refleje el cambio sin
      // importar qué filtros tenga aplicados el agente.
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
    onError: () => {
      // Un 409 significa que la vista estaba desactualizada: releerla es la
      // forma de que el agente vea el estado real y las acciones correctas.
      void queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) })
    },
  })
}

/**
 * Reasignación del área de un reporte que ya está En proceso (US-028).
 *
 * Endpoint aparte de las transiciones porque no mueve el estado: el reporte
 * permanece En proceso y lo único que cambia es quién se hace cargo.
 */
export function useAssignArea(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (areaId: number) => {
      const { data } = await apiClient.post<PanelReportDetail>(
        endpoints.panelReports.assignArea(id),
        { area_id: areaId },
      )
      return data
    },
    onSuccess: (detail) => {
      queryClient.setQueryData(reportKeys.detail(id), detail)
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}

/**
 * Publicación de una respuesta oficial (US-024).
 *
 * Solo alta: el hilo es inmutable y no hay endpoints de edición ni de borrado
 * que enganchar. Una corrección se publica como una respuesta nueva.
 */
export function usePublishOfficialResponse(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (text: string) => {
      const { data } = await apiClient.post<PanelReportDetail>(
        endpoints.panelReports.officialResponses(id),
        { text },
      )
      return data
    },
    onSuccess: (detail) => {
      queryClient.setQueryData(reportKeys.detail(id), detail)
      // El listado muestra el indicador de "sin respuesta oficial": se invalida
      // por prefijo para que se actualice con cualquier filtro aplicado.
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}
