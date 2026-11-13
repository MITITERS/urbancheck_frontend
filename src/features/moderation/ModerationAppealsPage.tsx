import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ImageOff, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { normalizeError } from '@/api/client'
import { PageHeader } from '@/components/common/PageHeader'
import { PersonAvatar } from '@/components/common/PersonAvatar'
import { QueryState } from '@/components/common/QueryState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { messages } from '@/config/messages'
import { RequireMunicipality } from '@/features/municipality-scope/RequireMunicipality'
import { useMunicipalityScope } from '@/features/municipality-scope/context'
import { ReportCategoryLabel } from '@/features/reports/components/ReportCategory'
import type { ReportAuthor } from '@/features/reports/types'
import { AuthorLink } from '@/features/users/components/AuthorLink'
import { formatDateTime, shortAddress } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useModerationAppeals, useResolveModerationAppeal } from './api/moderation'
import { ComplaintList } from './components/ComplaintList'
import { ReasonDialog } from './components/ReasonDialog'
import type { ModerationAppeal, ModerationAppealState } from './types'

const HTTP_CONFLICT = 409
const t = messages.moderationAppeals

/** Un bloque rotulado de la tarjeta. */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </h3>
      {children}
    </section>
  )
}

/**
 * Lo que dijo una persona, con su avatar, su nombre —que abre su perfil— y la
 * fecha. Lo usan el vecino que apela y el agente que descartó, para que las dos
 * voces se lean igual una al lado de la otra.
 */
function Voice({
  person,
  date,
  text,
  tone = 'default',
}: {
  person: ReportAuthor | null
  date: string
  text: string
  tone?: 'default' | 'author'
}) {
  return (
    <div className="flex gap-3">
      <PersonAvatar
        name={person?.name ?? '—'}
        src={person?.avatar ?? null}
        size="sm"
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm">
          {person ? (
            <AuthorLink id={person.id} name={person.name} />
          ) : (
            <span className="text-muted-foreground">
              {/* Sin autor solo queda el vecino que borró su cuenta (N-09). */}
              {tone === 'author' ? messages.common.deletedUser : '—'}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {' '}
            · {formatDateTime(date)}
          </span>
        </p>
        <p
          className={cn(
            'rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-line',
            tone === 'author'
              ? 'bg-primary/5 ring-1 ring-primary/15 ring-inset'
              : 'bg-muted/60',
          )}
        >
          {text}
        </p>
      </div>
    </div>
  )
}

function AppealCard({
  appeal,
  onDecide,
}: {
  appeal: ModerationAppeal
  onDecide?: (appeal: ModerationAppeal, accept: boolean) => void
}) {
  const { report, decision } = appeal
  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
        {/* El reporte apelado, que es lo que se está juzgando: foto,
            descripción y dónde está, sin tener que abrirlo. */}
        <div className="space-y-3">
          {report.photo ? (
            <img
              src={report.photo}
              alt={t.photoAlt(report.number ?? report.id)}
              className="aspect-[4/3] w-full rounded-lg object-cover ring-1 ring-border"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ImageOff className="size-6" aria-hidden />
            </div>
          )}
          <div className="space-y-1.5">
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
              <Link
                to={`/reportes/${report.id}`}
                className="tabular text-primary underline-offset-4 hover:underline"
              >
                #{report.number ?? report.id}
              </Link>
              <ReportCategoryLabel category={report.category} />
            </p>
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {report.description}
            </p>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                {shortAddress(report.address) || '—'} · {report.municipality.city}
              </span>
            </p>
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {t.appealedAt(formatDateTime(appeal.created_at))}
            </p>
            <Badge variant="outline">{t.status[appeal.status]}</Badge>
          </div>

          <Section label={t.authorReason}>
            <Voice
              person={appeal.author}
              date={appeal.created_at}
              text={appeal.reason}
              tone="author"
            />
          </Section>

          <Section label={t.agentReason}>
            <Voice
              person={decision.decided_by}
              date={decision.created_at}
              text={decision.reason}
            />
          </Section>

          {appeal.complaints.length > 0 && (
            <Section label={t.complaints}>
              <ComplaintList complaints={appeal.complaints} />
            </Section>
          )}

          {appeal.resolved_at && (
            <Section label={t.resolutionLabel}>
              <Voice
                person={appeal.resolved_by}
                date={appeal.resolved_at}
                text={appeal.resolution_reason}
              />
            </Section>
          )}

          {onDecide && (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button onClick={() => onDecide(appeal, true)}>{t.accept}</Button>
              <Button variant="outline" onClick={() => onDecide(appeal, false)}>
                {t.reject}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * US-049 — apelaciones contra descartes por moderación municipal.
 *
 * Las resuelve el administrador de la plataforma, nunca el municipio que
 * descartó: es el segundo contrapeso de esa facultad. Hacer lugar devuelve el
 * reporte al estado previo al descarte; rechazar lo deja cancelado para
 * siempre.
 */
export function ModerationAppealsPage() {
  // El admin ve la municipalidad elegida en el header: hasta que esté resuelta
  // no se pide nada, para no traer por un instante los datos de todas.
  return (
    <RequireMunicipality>
      <ModerationAppealsPageContent />
    </RequireMunicipality>
  )
}

function ModerationAppealsPageContent() {
  const [tab, setTab] = useState<ModerationAppealState>('pending')
  // Las de la municipalidad elegida en el header (el agente, las suyas).
  const { municipalityId } = useMunicipalityScope()
  const pending = useModerationAppeals('pending', municipalityId)
  const resolved = useModerationAppeals('resolved', municipalityId)
  const resolve = useResolveModerationAppeal()
  const [decision, setDecision] = useState<{
    appeal: ModerationAppeal
    accept: boolean
  } | null>(null)

  const confirm = async (reason: string) => {
    if (!decision) return
    try {
      await resolve.mutateAsync({
        id: decision.appeal.id,
        accept: decision.accept,
        reason,
      })
    } catch (error) {
      const apiError = normalizeError(error)
      toast.error(
        apiError.status === HTTP_CONFLICT ? t.alreadyResolved : apiError.message,
      )
      setDecision(null)
      return
    }
    toast.success(decision.accept ? t.accepted : t.rejected)
    setDecision(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t.title} description={t.description} />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as ModerationAppealState)}
        className="gap-4"
      >
        <TabsList>
          <TabsTrigger value="pending">
            {t.tabPending}
            {pending.data && ` (${pending.data.length})`}
          </TabsTrigger>
          <TabsTrigger value="resolved">{t.tabResolved}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <QueryState
            isPending={pending.isPending}
            isError={pending.isError}
            error={pending.error}
            onRetry={() => void pending.refetch()}
            isEmpty={pending.data?.length === 0}
            emptyMessage={t.emptyPending}
          >
            <div className="space-y-4">
              {(pending.data ?? []).map((appeal) => (
                <AppealCard
                  key={appeal.id}
                  appeal={appeal}
                  onDecide={(chosen, accept) => setDecision({ appeal: chosen, accept })}
                />
              ))}
            </div>
          </QueryState>
        </TabsContent>

        <TabsContent value="resolved">
          <QueryState
            isPending={resolved.isPending}
            isError={resolved.isError}
            error={resolved.error}
            onRetry={() => void resolved.refetch()}
            isEmpty={resolved.data?.length === 0}
            emptyMessage={t.emptyResolved}
          >
            <div className="space-y-4">
              {(resolved.data ?? []).map((appeal) => (
                <AppealCard key={appeal.id} appeal={appeal} />
              ))}
            </div>
          </QueryState>
        </TabsContent>
      </Tabs>

      <ReasonDialog
        key={decision ? `${decision.appeal.id}-${decision.accept}` : 'cerrado'}
        open={decision !== null}
        onOpenChange={(open) => !open && setDecision(null)}
        title={decision?.accept ? t.acceptTitle : t.rejectTitle}
        description={decision?.accept ? t.acceptDescription : t.rejectDescription}
        confirmLabel={decision?.accept ? t.accept : t.reject}
        variant={decision?.accept ? 'default' : 'destructive'}
        label={t.reasonLabel}
        isPending={resolve.isPending}
        onConfirm={(reason) => void confirm(reason)}
      />
    </div>
  )
}
