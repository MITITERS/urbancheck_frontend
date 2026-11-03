import { messages } from '@/config/messages'
import { useMunicipalityScope } from '@/features/municipality-scope/context'
import { RequireMunicipality } from '@/features/municipality-scope/RequireMunicipality'
import { StatisticsView } from './StatisticsView'

/**
 * US-023 y US-050 — estadísticas. El agente ve las de su municipio, acotadas
 * por el servidor; el admin, las de la municipalidad elegida en el header.
 */
export function StatisticsPage() {
  const { municipalityId, current } = useMunicipalityScope()
  return (
    <RequireMunicipality>
      <StatisticsView
        title={messages.statistics.title}
        description={messages.statistics.description}
        municipalityId={municipalityId}
        municipalityName={current ? `${current.city} (${current.province})` : null}
      />
    </RequireMunicipality>
  )
}
