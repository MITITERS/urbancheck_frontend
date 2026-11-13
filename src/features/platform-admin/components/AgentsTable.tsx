import { Badge } from '@/components/ui/badge'
import { PersonAvatar } from '@/components/common/PersonAvatar'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { messages } from '@/config/messages'
import { cn } from '@/lib/utils'
import type { MunicipalAgent } from '../types'

interface AgentsTableProps {
  agents: MunicipalAgent[]
  /** Etiqueta y acción del botón de la fila: desactivar, o reactivar. */
  actionLabel: string
  /**
   * Marca la pestaña de archivados. Solo ahí la fila se puede bloquear: la
   * municipalidad dada de baja impide reactivar, nunca desactivar.
   */
  isReactivation?: boolean
  onAction: (agent: MunicipalAgent) => void
}

/**
 * Una cuenta archivada no se puede reactivar mientras su municipalidad esté
 * dada de baja. Solo aplica a esa acción: desactivar nunca queda trabado.
 */
function cannotBeReactivated(agent: MunicipalAgent): boolean {
  return agent.municipality == null || agent.municipality.is_active === false
}

/**
 * La tabla de agentes, igual en las dos pestañas.
 *
 * Habilitados y archivados muestran lo mismo —quién es, dónde trabaja, cuánto
 * gestionó— y se diferencian solo en qué hace el botón de la fila. Escribir la
 * tabla dos veces era garantizar que una de las dos se quedara atrás.
 */
export function AgentsTable({
  agents,
  actionLabel,
  isReactivation = false,
  onAction,
}: AgentsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{messages.agents.name}</TableHead>
          <TableHead>{messages.agents.email}</TableHead>
          <TableHead>{messages.agents.municipality}</TableHead>
          <TableHead className="w-44">{messages.agents.state}</TableHead>
          <TableHead className="w-28 text-right">{messages.agents.managed}</TableHead>
          <TableHead className="w-32" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => (
          <TableRow key={agent.id}>
            <TableCell className="font-medium">
              <span className="flex items-center gap-2.5">
                <PersonAvatar name={agent.name} src={agent.avatar} />
                {agent.name}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">{agent.email}</TableCell>
            <TableCell>{agent.municipality?.city ?? '—'}</TableCell>
            <TableCell>
              <Badge
                variant="secondary"
                className={
                  agent.is_active_agent
                    ? 'gap-1.5 bg-status-resolved/12 pl-1.5 text-status-resolved ring-1 ring-status-resolved/25 ring-inset'
                    : 'gap-1.5 pl-1.5'
                }
              >
                <span
                  aria-hidden
                  className={cn(
                    'size-1.5 rounded-full',
                    agent.is_active_agent
                      ? 'bg-status-resolved'
                      : 'bg-muted-foreground',
                  )}
                />
                {agent.is_active_agent
                  ? messages.agents.active
                  : messages.agents.inactive}
              </Badge>
              {agent.must_change_password && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {messages.agents.pendingPassword}
                </span>
              )}
            </TableCell>
            <TableCell className="text-right font-medium">
              {agent.management_count}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                // Reactivar a alguien cuya municipalidad está dada de baja
                // dejaría una cuenta operando sobre una jurisdicción cerrada.
                // El backend lo rechaza; acá se evita el intento y se explica.
                disabled={isReactivation && cannotBeReactivated(agent)}
                title={
                  isReactivation && cannotBeReactivated(agent)
                    ? messages.agents.cannotReactivate
                    : undefined
                }
                onClick={() => onAction(agent)}
              >
                {actionLabel}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
