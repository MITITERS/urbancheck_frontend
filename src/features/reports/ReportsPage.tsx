import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { Card, CardContent } from '@/components/ui/card'
import { messages } from '@/config/messages'
import { useMunicipalityScope } from '@/features/municipality-scope/context'
import { RequireMunicipality } from '@/features/municipality-scope/RequireMunicipality'
import { useReports } from './api/reports'
import { Pagination } from './components/Pagination'
import { ReportFilters } from './components/ReportFilters'
import { ReportsTable } from './components/ReportsTable'
import { useReportFilters } from './hooks/useReportFilters'

/**
 * US-012 — pantalla principal del panel: listado y filtros de reportes.
 *
 * El agente ve los de su jurisdicción; el administrador de la plataforma, los de
 * la municipalidad que eligió en el header.
 */
export function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.reports.title}
        description={messages.reports.description}
      />
      <RequireMunicipality>
        <ReportsList />
      </RequireMunicipality>
    </div>
  )
}

function ReportsList() {
  const { filters, update, clear, isFiltered, orderings } = useReportFilters()
  const { municipalityId } = useMunicipalityScope()
  const query = useReports(filters, municipalityId)

  return (
    <div className="space-y-6">
      <ReportFilters
        filters={filters}
        orderings={orderings}
        isFiltered={isFiltered}
        onChange={update}
        onClear={clear}
      />

      <Card>
        <CardContent>
          <QueryState
            isPending={query.isPending}
            isError={query.isError}
            error={query.error}
            onRetry={() => void query.refetch()}
            isEmpty={query.data?.results.length === 0}
            emptyMessage={messages.reports.empty}
          >
            <ReportsTable reports={query.data?.results ?? []} />
            <Pagination
              page={filters.page}
              pageSize={filters.pageSize}
              total={query.data?.count ?? 0}
              hasPrevious={Boolean(query.data?.previous)}
              hasNext={Boolean(query.data?.next)}
              onPageChange={(page) => update({ page })}
              onPageSizeChange={(pageSize) => update({ pageSize })}
            />
          </QueryState>
        </CardContent>
      </Card>
    </div>
  )
}
