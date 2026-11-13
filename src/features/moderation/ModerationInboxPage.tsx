import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { normalizeError } from '@/api/client'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { messages } from '@/config/messages'
import { RequireMunicipality } from '@/features/municipality-scope/RequireMunicipality'
import { useMunicipalityScope } from '@/features/municipality-scope/context'
import {
  type PrivacyDecision,
  usePrivacyRequests,
  useResolvePrivacyRequest,
} from '@/features/privacy/api/privacyRequests'
import { useNow } from '@/features/privacy/deadline'
import type { PrivacyRequest } from '@/features/privacy/types'
import {
  useModerationDecision,
  useModerationInbox,
  useResolvedModeration,
} from './api/moderation'
import {
  type PendingRow,
  PendingComplaintsTable,
  type ResolvedRow,
  ResolvedComplaintsTable,
} from './components/ComplaintsTable'
import { ReasonDialog } from './components/ReasonDialog'
import type { ModerationDecisionKind, ModerationInboxEntry } from './types'

const HTTP_CONFLICT = 409
const t = messages.moderation

/** El filtro por tipo, en la URL (`?tipo=`) para que se pueda compartir. */
const FILTERS = [
  'todas',
  'contenido_inapropiado',
  'reporte_falso',
  'dato_personal',
] as const
type Filter = (typeof FILTERS)[number]

function isFilter(value: string | null): value is Filter {
  return FILTERS.includes(value as Filter)
}

/** Qué se le confirma a quien eliminó una imagen por dato personal. */
const REMOVED_MESSAGE: Record<PrivacyRequest['image']['kind'], string> = {
  report: messages.privacy.removedReport,
  resolution_evidence: messages.privacy.removedEvidence,
  resolution_appeal: messages.privacy.removedAppeal,
}

/**
 * Denuncias: todas las del municipio en una sola tabla, con un filtro por tipo
 * (pedido del usuario del 21/10).
 *
 * Junta dos circuitos que se resuelven distinto:
 *
 * - **Contenido** (US-049): una fila por reporte, no por denuncia; varias
 *   denuncias sobre el mismo reporte se resuelven en una sola decisión, con un
 *   motivo. Descartar avisa que el motivo será público. Las resuelve solo el
 *   agente; el admin las ve sin botones.
 * - **Dato personal visible** (US-043): una fila por imagen, con plazo de 24
 *   horas. Las resuelven el agente de la municipalidad y el admin.
 *
 * El agente y el admin ven siempre la imagen denunciada, sea cual sea el
 * motivo.
 */
export function ModerationInboxPage() {
  // El admin ve la municipalidad elegida en el header: hasta que esté resuelta
  // no se pide nada, para no traer por un instante los datos de todas.
  return (
    <RequireMunicipality>
      <ModerationInboxPageContent />
    </RequireMunicipality>
  )
}

function ModerationInboxPageContent() {
  const { municipalityId, selectable: isAdmin } = useMunicipalityScope()
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('tipo')
  const filter: Filter = isFilter(raw) ? raw : 'todas'
  const contentReason =
    filter === 'todas' || filter === 'dato_personal' ? undefined : filter
  const showContent = filter !== 'dato_personal'
  const showPrivacy = filter === 'todas' || filter === 'dato_personal'

  const [tab, setTab] = useState<'pending' | 'resolved'>('pending')
  const now = useNow()

  const contentPending = useModerationInbox(municipalityId, contentReason, {
    enabled: showContent,
  })
  const privacyPending = usePrivacyRequests('pending', municipalityId, {
    enabled: showPrivacy,
  })
  const contentResolved = useResolvedModeration(municipalityId, contentReason, {
    enabled: showContent && tab === 'resolved',
  })
  const privacyResolved = usePrivacyRequests('resolved', municipalityId, {
    enabled: showPrivacy && tab === 'resolved',
  })

  const pendingRows: PendingRow[] = [
    ...(showContent ? (contentPending.data ?? []) : []).map((entry): PendingRow => ({
      kind: 'content',
      key: `contenido-${entry.id}`,
      receivedAt: entry.oldest_complaint_at,
      entry,
    })),
    ...(showPrivacy ? (privacyPending.data ?? []) : []).map((request): PendingRow => ({
      kind: 'privacy',
      key: `dato-${request.id}`,
      receivedAt: request.received_at,
      request,
    })),
    // La más vieja primero, como en cada bandeja por separado.
  ].sort((a, b) => a.receivedAt.localeCompare(b.receivedAt))

  const resolvedRows: ResolvedRow[] = [
    ...(showContent ? (contentResolved.data ?? []) : []).map(
      (decision): ResolvedRow => ({
        kind: 'content',
        key: `contenido-${decision.id}`,
        resolvedAt: decision.created_at,
        decision,
      }),
    ),
    ...(showPrivacy ? (privacyResolved.data ?? []) : []).map(
      (request): ResolvedRow => ({
        kind: 'privacy',
        key: `dato-${request.id}`,
        resolvedAt: request.resolved_at ?? request.received_at,
        request,
      }),
    ),
    // La decisión más reciente primero.
  ].sort((a, b) => b.resolvedAt.localeCompare(a.resolvedAt))

  const pendingQueries = [
    ...(showContent ? [contentPending] : []),
    ...(showPrivacy ? [privacyPending] : []),
  ]
  const resolvedQueries = [
    ...(showContent ? [contentResolved] : []),
    ...(showPrivacy ? [privacyResolved] : []),
  ]

  const changeFilter = (value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value === 'todas') next.delete('tipo')
    else next.set('tipo', value)
    setSearchParams(next, { replace: true })
  }

  // --- Decisiones por contenido: piden un motivo. ---
  const decideContent = useModerationDecision()
  const [contentDecision, setContentDecision] = useState<{
    entry: ModerationInboxEntry
    decision: ModerationDecisionKind
  } | null>(null)

  const confirmContent = async (written: string) => {
    if (!contentDecision) return
    try {
      await decideContent.mutateAsync({
        reportId: contentDecision.entry.id,
        decision: contentDecision.decision,
        reason: written,
      })
    } catch (error) {
      const apiError = normalizeError(error)
      toast.error(
        apiError.status === HTTP_CONFLICT ? t.alreadyResolved : apiError.message,
      )
      setContentDecision(null)
      return
    }
    toast.success(contentDecision.decision === 'discard' ? t.discarded : t.dismissed)
    setContentDecision(null)
  }

  // --- Decisiones por dato personal: piden confirmación. ---
  const resolvePrivacy = useResolvePrivacyRequest()
  const [privacyDecision, setPrivacyDecision] = useState<{
    request: PrivacyRequest
    decision: PrivacyDecision
  } | null>(null)

  const confirmPrivacy = async () => {
    if (!privacyDecision) return
    try {
      await resolvePrivacy.mutateAsync({
        id: privacyDecision.request.id,
        decision: privacyDecision.decision,
      })
    } catch (error) {
      const apiError = normalizeError(error)
      toast.error(
        apiError.status === HTTP_CONFLICT
          ? messages.privacy.alreadyResolved
          : apiError.message,
      )
      setPrivacyDecision(null)
      return
    }
    toast.success(
      privacyDecision.decision === 'dismiss'
        ? messages.privacy.dismissed
        : REMOVED_MESSAGE[privacyDecision.request.image.kind],
    )
    setPrivacyDecision(null)
  }

  const discarding = contentDecision?.decision === 'discard'
  const removing = privacyDecision?.decision === 'remove-image'

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.title}
        description={isAdmin ? t.adminDescription : t.description}
        actions={
          <Select value={filter} onValueChange={changeFilter}>
            <SelectTrigger size="sm" className="min-w-48" aria-label={t.filterLabel}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTERS.map((value) => (
                <SelectItem key={value} value={value}>
                  {t.filter[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as 'pending' | 'resolved')}
        className="gap-4"
      >
        <TabsList>
          <TabsTrigger value="pending">
            {t.tabPending}
            {pendingQueries.every((query) => query.data) && ` (${pendingRows.length})`}
          </TabsTrigger>
          <TabsTrigger value="resolved">{t.tabResolved}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardContent>
              <QueryState
                isPending={pendingQueries.some((query) => query.isPending)}
                isError={pendingQueries.some((query) => query.isError)}
                error={pendingQueries.find((query) => query.error)?.error ?? null}
                onRetry={() => pendingQueries.forEach((query) => void query.refetch())}
                isEmpty={pendingRows.length === 0}
                emptyMessage={t.empty}
              >
                <PendingComplaintsTable
                  rows={pendingRows}
                  now={now}
                  // Contenido: solo el agente (US-049). Dato personal: los dos.
                  onDecideContent={
                    isAdmin
                      ? undefined
                      : (entry, decision) => setContentDecision({ entry, decision })
                  }
                  onDecidePrivacy={(request, decision) =>
                    setPrivacyDecision({ request, decision })
                  }
                />
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved">
          <Card>
            <CardContent>
              <QueryState
                isPending={resolvedQueries.some((query) => query.isPending)}
                isError={resolvedQueries.some((query) => query.isError)}
                error={resolvedQueries.find((query) => query.error)?.error ?? null}
                onRetry={() => resolvedQueries.forEach((query) => void query.refetch())}
                isEmpty={resolvedRows.length === 0}
                emptyMessage={t.emptyResolved}
              >
                <ResolvedComplaintsTable rows={resolvedRows} />
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* La clave reinicia el motivo escrito entre una decisión y la siguiente. */}
      <ReasonDialog
        key={
          contentDecision
            ? `${contentDecision.entry.id}-${contentDecision.decision}`
            : 'cerrado'
        }
        open={contentDecision !== null}
        onOpenChange={(open) => !open && setContentDecision(null)}
        title={discarding ? t.discardTitle : t.dismissTitle}
        description={discarding ? t.discardDescription : t.dismissDescription}
        confirmLabel={discarding ? t.discardConfirm : t.dismissConfirm}
        variant={discarding ? 'destructive' : 'default'}
        warning={discarding ? t.publicWarning : undefined}
        isPending={decideContent.isPending}
        onConfirm={(written) => void confirmContent(written)}
      />

      <ConfirmDialog
        open={privacyDecision !== null}
        onOpenChange={(open) => !open && setPrivacyDecision(null)}
        title={removing ? messages.privacy.removeTitle : messages.privacy.dismissTitle}
        description={
          removing
            ? messages.privacy.removeDescription
            : messages.privacy.dismissDescription
        }
        confirmLabel={
          removing ? messages.privacy.removeConfirm : messages.privacy.dismissConfirm
        }
        variant={removing ? 'destructive' : 'default'}
        isPending={resolvePrivacy.isPending}
        onConfirm={() => void confirmPrivacy()}
      />
    </div>
  )
}
