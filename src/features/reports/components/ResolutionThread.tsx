import { Camera, ShieldAlert, Wrench } from 'lucide-react'
import type { ReactNode } from 'react'
import { messages } from '@/config/messages'
import { OperatorLink } from '@/features/areas/components/OperatorLink'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type {
  PanelReportDetail,
  PhotoStatus,
  ResolutionAppeal,
  ResolutionEvidence,
} from '../types'
import { ProcessingPhoto } from './ProcessingPhoto'
import { RemovedPhoto } from './RemovedPhoto'
import { ResolutionComparisonCard } from './ResolutionComparisonCard'

/**
 * El historial de cierres y objeciones del reporte (US-046 y US-048).
 *
 * Se muestran **todos** los cierres, no el último: cuando hubo una apelación
 * quedan dos partes de trabajo y la gracia es poder compararlos, que es lo que
 * pide el escenario 9 de US-048. La objeción va intercalada entre el cierre que
 * objetó y el que vino después, en el orden en que ocurrió.
 *
 * En el panel se ve **quién** ejecutó cada cierre. Ante el ciudadano responde
 * el área operativa; la identidad del operario es para auditar, y esa es la
 * diferencia entre este componente y el de la app móvil.
 */
export function ResolutionThread({ report }: { report: PanelReportDetail }) {
  if (report.resolution_evidences.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {messages.reportDetail.resolutionEmpty}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {report.resolution_evidences.map((evidence, index) => (
        <div key={evidence.id} className="space-y-3">
          <EvidenceCard
            evidence={evidence}
            // Numerado solo cuando hay más de uno: "Cierre 1" sobre un cierre
            // único es una etiqueta que no distingue nada.
            attempt={report.resolution_evidences.length > 1 ? index + 1 : null}
          />
          {/* La comparación automática de **este** cierre (US-015). Cada
              cierre trae la suya, así que después de una objeción se ven los
              dos veredictos. Siempre contra la foto original del reporte. */}
          {evidence.comparison && (
            <ResolutionComparisonCard
              comparison={evidence.comparison}
              originalPhoto={report.photo}
              resolutionPhoto={evidence.photo}
            />
          )}
          {report.resolution_appeals
            .filter((appeal) => appeal.evidence?.id === evidence.id)
            .map((appeal) => (
              <AppealCard key={appeal.id} appeal={appeal} />
            ))}
        </div>
      ))}
    </div>
  )
}

/**
 * El molde de las dos tarjetas del hilo.
 *
 * Son el mismo objeto con distinto tono: un evento con encabezado, texto, una
 * línea de datos y una foto. Estaban duplicadas y ya habían empezado a
 * divergir —la del cierre mostraba al operario y la de la objeción no—, así
 * que el molde es uno y lo que cambia viaja como props.
 *
 * **La foto va con el mismo margen que el texto**, no pegada a los bordes: con
 * la imagen a sangre, su borde izquierdo caía dos píxeles corrido respecto del
 * de la tarjeta —lo que sobresalía era el filete lateral— y las fotos de dos
 * eventos seguidos no arrancaban en la misma columna.
 */
function ThreadCard({
  tone,
  icon,
  title,
  body,
  meta,
  photo,
  photoRemoved = false,
  photoStatus = 'procesada',
}: {
  tone: 'resolved' | 'rejected'
  icon: ReactNode
  title: string
  body: string
  meta: ReactNode
  photo: string | null
  /** Se retiró por protección de datos (US-043, escenario 11). */
  photoRemoved?: boolean
  /** El difuminado de esta foto (US-042, escenario 8). */
  photoStatus?: PhotoStatus
}) {
  return (
    <article
      className={cn(
        // Un aro completo en lugar del filete izquierdo: el color ya lo dan el
        // ícono y el título, y el borde de un solo lado rompía la esquina
        // redondeada y desalineaba lo de adentro.
        'overflow-hidden rounded-xl ring-1 ring-inset',
        tone === 'resolved'
          ? 'bg-status-resolved/5 ring-status-resolved/20'
          : 'bg-status-rejected/5 ring-status-rejected/20',
      )}
    >
      <div className="space-y-1.5 p-3.5">
        <p
          className={cn(
            'flex flex-wrap items-center gap-1.5 text-xs font-semibold tracking-wide uppercase',
            tone === 'resolved' ? 'text-status-resolved' : 'text-status-rejected',
          )}
        >
          {icon}
          {title}
        </p>
        <p className="text-sm leading-relaxed whitespace-pre-line">{body}</p>
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          {meta}
        </p>
      </div>
      {photo && (
        <div className="px-3.5 pb-3.5">
          <img
            src={photo}
            alt=""
            // Mismo tratamiento que la foto del reporte, arriba en esta pantalla.
            className="max-h-64 w-full rounded-lg object-cover ring-1 ring-border"
          />
        </div>
      )}
      {/* Retirada gana sobre el difuminado: si la foto se sacó por protección
          de datos, en qué quedó el procesamiento ya no importa. */}
      {!photo && photoRemoved && (
        <div className="px-3.5 pb-3.5">
          <RemovedPhoto />
        </div>
      )}
      {!photo && !photoRemoved && photoStatus !== 'procesada' && (
        <div className="px-3.5 pb-3.5">
          <ProcessingPhoto failed={photoStatus === 'fallida'} />
        </div>
      )}
    </article>
  )
}

function EvidenceCard({
  evidence,
  attempt,
}: {
  evidence: ResolutionEvidence
  attempt: number | null
}) {
  return (
    <ThreadCard
      tone="resolved"
      icon={<Wrench className="size-3.5" aria-hidden />}
      title={
        attempt === null
          ? messages.reportDetail.resolution
          : messages.reportDetail.resolutionAttempt(attempt)
      }
      body={evidence.description}
      meta={
        <>
          <span>{formatDateTime(evidence.created_at)}</span>
          {evidence.operational_area && (
            <span>
              {'\u00b7 '}
              {messages.reportDetail.resolutionBy(evidence.operational_area.name)}
            </span>
          )}
          {/* Solo en el panel: ante el vecino responde el área (US-038). El
              nombre abre su perfil, igual que el del vecino y el del validador
              en esta misma pantalla. Va en la misma línea que la fecha en vez
              de en un renglón aparte, que lo hacía parecer otro dato. */}
          {evidence.operator && (
            <span>
              {'\u00b7 '}
              <OperatorLink operator={evidence.operator} />
            </span>
          )}
        </>
      }
      photo={evidence.photo}
      photoRemoved={evidence.photo_removed_at !== null}
      photoStatus={evidence.photo_status}
    />
  )
}

function AppealCard({ appeal }: { appeal: ResolutionAppeal }) {
  return (
    // Alineada con el cierre que objeta, no sangrada: son dos versiones del
    // mismo lugar y la gracia es poder comparar las fotos, cosa que con una
    // corrida respecto de la otra no se puede. Que responde a ese cierre lo
    // dicen el color, el ícono y el orden.
    <ThreadCard
      tone="rejected"
      icon={<ShieldAlert className="size-3.5" aria-hidden />}
      title={messages.reportDetail.appeal}
      body={appeal.reason}
      meta={
        <>
          <span>{formatDateTime(appeal.created_at)}</span>
          {appeal.author && <span>{`\u00b7 ${appeal.author.name}`}</span>}
        </>
      }
      photo={appeal.photo}
      photoRemoved={appeal.photo_removed_at !== null}
      photoStatus={appeal.photo_status}
    />
  )
}

/** El plazo que le queda al vecino para objetar, si es que corre alguno. */
export function ObjectionDeadline({ report }: { report: PanelReportDetail }) {
  if (report.objection_deadline === null) return null

  return (
    <p className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
      <Camera className="size-3.5 shrink-0" aria-hidden />
      {messages.reportDetail.objectionDeadline(
        formatDateTime(report.objection_deadline),
      )}
    </p>
  )
}
