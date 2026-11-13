import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PersonAvatar } from '@/components/common/PersonAvatar'
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
import { OperatorFormDialog } from './OperatorFormDialog'
import { OperatorLink } from './OperatorLink'
import type { OperationalArea, Operator } from '../types'

interface OperatorsTableProps {
  operators: Operator[]
  /** Áreas activas a las que se lo puede trasladar (escenario 5). */
  areas: OperationalArea[]
  defaultAreaId: number
  actionLabel: string
  onAction: (operator: Operator) => void
}

/** La tabla de operarios de un área, igual en las dos pestañas. */
export function OperatorsTable({
  operators,
  areas,
  defaultAreaId,
  actionLabel,
  onAction,
}: OperatorsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{messages.operators.name}</TableHead>
          <TableHead>{messages.operators.email}</TableHead>
          <TableHead>{messages.operators.phone}</TableHead>
          <TableHead className="w-40">{messages.operators.state}</TableHead>
          <TableHead className="w-24 text-right">{messages.operators.closed}</TableHead>
          <TableHead className="w-48" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {operators.map((operator) => (
          <TableRow key={operator.id}>
            <TableCell className="font-medium">
              <span className="flex items-center gap-2.5">
                <PersonAvatar name={operator.name} src={operator.avatar} />
                {/* El nombre abre su perfil, igual que en el hilo de
                    resolución: la columna «Cierres» dice cuántos, y esto
                    dice cuáles. */}
                <OperatorLink operator={operator} />
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">{operator.email}</TableCell>
            <TableCell className="text-muted-foreground">{operator.phone}</TableCell>
            <TableCell>
              <Badge
                variant="secondary"
                className={
                  operator.is_active_operator
                    ? 'gap-1.5 bg-status-resolved/12 pl-1.5 text-status-resolved ring-1 ring-status-resolved/25 ring-inset'
                    : 'gap-1.5 pl-1.5'
                }
              >
                <span
                  aria-hidden
                  className={cn(
                    'size-1.5 rounded-full',
                    operator.is_active_operator
                      ? 'bg-status-resolved'
                      : 'bg-muted-foreground',
                  )}
                />
                {operator.is_active_operator
                  ? messages.operators.active
                  : messages.operators.inactive}
              </Badge>
              {operator.must_change_password && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {messages.operators.pendingPassword}
                </span>
              )}
            </TableCell>
            <TableCell className="text-right font-medium">
              {operator.closed_count}
            </TableCell>
            <TableCell className="text-right">
              <span className="flex justify-end gap-2">
                <OperatorFormDialog
                  areas={areas}
                  defaultAreaId={defaultAreaId}
                  operator={operator}
                  trigger={<Button variant="ghost">{messages.operators.edit}</Button>}
                />
                <Button variant="outline" onClick={() => onAction(operator)}>
                  {actionLabel}
                </Button>
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
