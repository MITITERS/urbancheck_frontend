import { useState } from 'react'
import { Landmark } from 'lucide-react'
import { toast } from 'sonner'
import { isApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { messages } from '@/config/messages'
import { formatDateTime } from '@/lib/format'
import { usePublishOfficialResponse } from '../api/reportDetail'
import type { PanelReportDetail } from '../types'

/**
 * El hilo institucional del reporte y el formulario para sumarle una respuesta
 * (US-024).
 *
 * Vive dentro del detalle existente y no en una pantalla nueva. El hilo es
 * inmutable: no hay acciones de editar ni de eliminar sobre ninguna respuesta
 * publicada, y una corrección se publica como una respuesta nueva.
 *
 * Cuándo se ofrece publicar lo dice el servidor con
 * `can_publish_official_response`: el panel no replica la lista de estados
 * habilitados.
 */
export function OfficialResponses({ report }: { report: PanelReportDetail }) {
  const publish = usePublishOfficialResponse(report.id)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (text.trim() === '') {
      setError(messages.reportDetail.officialResponseRequired)
      return
    }
    try {
      await publish.mutateAsync(text.trim())
      toast.success(messages.reportDetail.officialResponsePublished)
      setText('')
    } catch (submitError) {
      toast.error(
        isApiError(submitError) ? submitError.message : messages.errors.unexpected,
      )
    }
  }

  return (
    <div className="space-y-5">
      {report.official_responses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {messages.reportDetail.officialResponsesEmpty}
        </p>
      ) : (
        <ul className="space-y-3">
          {report.official_responses.map((response) => (
            /* Tratamiento visual propio: un compromiso institucional no se
               puede confundir con un comentario de un vecino ni con el parte
               de trabajo del operario (escenario 10).

               Un aro completo y no el filete izquierdo que tenía, igual que las
               tarjetas del hilo de resolución: el borde de un solo lado rompe
               la esquina redondeada por la que pasa y corre el contenido
               respecto del margen opuesto. Lo institucional ya lo dicen el
               ícono, el color y el nombre del municipio. */
            <li
              key={response.id}
              className="rounded-xl bg-primary/5 p-3.5 ring-1 ring-primary/20 ring-inset"
            >
              <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
                <Landmark className="size-3.5" aria-hidden />
                {response.municipality?.city ?? messages.reportDetail.officialResponses}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line">
                {response.text}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {formatDateTime(response.created_at)}
                {/* La identidad del agente se ve únicamente acá, en el panel
                    (escenario 12): al vecino le responde la municipalidad. */}
                {response.author && ` · ${response.author.name}`}
              </p>
            </li>
          ))}
        </ul>
      )}

      {report.can_publish_official_response && (
        <div className="space-y-3 border-t pt-4">
          <Field data-invalid={error !== null}>
            <FieldLabel htmlFor="official-response">
              {messages.reportDetail.officialResponseLabel}
            </FieldLabel>
            <Textarea
              id="official-response"
              rows={4}
              value={text}
              placeholder={messages.reportDetail.officialResponsePlaceholder}
              aria-invalid={error !== null}
              onChange={(event) => {
                setText(event.target.value)
                setError(null)
              }}
            />
            {error ? (
              <FieldError errors={[{ message: error }]} />
            ) : (
              <FieldDescription>
                {messages.reportDetail.officialResponseHint}
              </FieldDescription>
            )}
          </Field>
          <Button disabled={publish.isPending} onClick={() => void submit()}>
            {messages.reportDetail.officialResponsePublish}
          </Button>
        </div>
      )}
    </div>
  )
}
