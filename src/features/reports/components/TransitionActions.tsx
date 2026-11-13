import { useState } from 'react'
import { toast } from 'sonner'
import { isApiError } from '@/api/client'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { messages } from '@/config/messages'
import { useActiveAreas } from '@/features/areas/api/areas'
import { useReportTransition } from '../api/reportDetail'
import { AreaSelectField } from './AreaSelectField'
import type { AvailableTransition, TransitionOperation } from '../types'

const CONFLICT_STATUS = 409
const DESTRUCTIVE: readonly TransitionOperation[] = ['cancelar', 'archivar']

/**
 * Renders only the transitions the backend says are possible right now. The
 * panel never draws five buttons and disables four: the state machine lives in
 * one place and this reads from it.
 */
export function TransitionActions({
  reportId,
  transitions,
}: {
  reportId: number
  transitions: AvailableTransition[]
}) {
  const transition = useReportTransition(reportId)
  const [pending, setPending] = useState<AvailableTransition | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [areaId, setAreaId] = useState('')
  const [areaError, setAreaError] = useState<string | null>(null)
  // Las áreas se piden solo cuando hay una acción que las necesita: la
  // mayoría de las transiciones no tocan el área, y el detalle se abre muchas
  // más veces de las que se ejecuta una.
  const needsArea = transitions.some((item) => item.requires_area)
  const areas = useActiveAreas({ enabled: needsArea })

  if (transitions.length === 0) return null

  const close = () => {
    setPending(null)
    setReason('')
    setReasonError(null)
    setAreaId('')
    setAreaError(null)
  }

  const confirm = async () => {
    if (!pending) return
    if (pending.requires_reason && reason.trim() === '') {
      setReasonError('Indicá el motivo para poder continuar.')
      return
    }
    if (pending.requires_area && areaId === '') {
      setAreaError(messages.reportDetail.areaRequired)
      return
    }
    try {
      await transition.mutateAsync({
        operation: pending.operation,
        reason: pending.requires_reason ? reason.trim() : undefined,
        areaId: pending.requires_area ? Number(areaId) : undefined,
      })
      toast.success(messages.reportDetail.updated)
      close()
    } catch (error) {
      toast.error(
        isApiError(error) && error.status === CONFLICT_STATUS
          ? messages.reportDetail.conflict
          : isApiError(error)
            ? error.message
            : messages.errors.unexpected,
      )
      close()
    }
  }

  return (
    <>
      {/*
        En columna y a lo ancho: la tarjeta de acciones vive en la banda
        angosta de la derecha, donde una fila de botones se parte en pedazos de
        distinto tamaño. Apiladas, además, quedan en el orden en que el backend
        las devuelve, que es el del avance del reporte.
      */}
      <div className="grid gap-2">
        {transitions.map((item) => (
          <Button
            key={item.operation}
            size="lg"
            variant={DESTRUCTIVE.includes(item.operation) ? 'outline' : 'default'}
            // Escenario 4 de US-028: sin áreas registradas la acción se ofrece
            // deshabilitada, y el título dice qué falta para quien no llega al
            // hover ni abre el diálogo.
            disabled={item.requires_area && areas.data?.length === 0}
            title={
              item.requires_area && areas.data?.length === 0
                ? messages.reportDetail.noAreas
                : undefined
            }
            onClick={() => setPending(item)}
          >
            {messages.transitions[item.operation].label}
          </Button>
        ))}
      </div>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && close()}
        title={
          pending
            ? messages.reportDetail.confirmTitle(
                messages.transitions[pending.operation].label,
              )
            : ''
        }
        description={pending ? messages.transitions[pending.operation].description : ''}
        confirmLabel={pending ? messages.transitions[pending.operation].label : ''}
        variant={
          pending && DESTRUCTIVE.includes(pending.operation) ? 'destructive' : 'default'
        }
        isPending={transition.isPending}
        onConfirm={() => void confirm()}
      >
        {/* Procesar abre un diálogo con el selector de área: no son dos pasos
            separados en la interfaz, porque tampoco lo son en el dominio. */}
        {pending?.requires_area && (
          <AreaSelectField
            areas={areas.data ?? []}
            value={areaId}
            onChange={(value) => {
              setAreaId(value)
              setAreaError(null)
            }}
            error={areaError}
          />
        )}
        {pending?.requires_reason && (
          <Field data-invalid={reasonError !== null}>
            <FieldLabel htmlFor="transition-reason">
              {messages.reportDetail.reasonLabel}
            </FieldLabel>
            <Input
              id="transition-reason"
              value={reason}
              placeholder={messages.reportDetail.reasonPlaceholder}
              aria-invalid={reasonError !== null}
              onChange={(event) => {
                setReason(event.target.value)
                setReasonError(null)
              }}
            />
            {reasonError && <FieldError errors={[{ message: reasonError }]} />}
          </Field>
        )}
      </ConfirmDialog>
    </>
  )
}
