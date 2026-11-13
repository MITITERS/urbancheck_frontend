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
import type { Validator } from '../types'

interface ValidatorsTableProps {
  validators: Validator[]
  /** Para el agente la municipalidad es constante: no aporta una columna. */
  showMunicipality: boolean
  /** Etiqueta y acción del botón de la fila: desactivar, o reactivar. */
  actionLabel: string
  /**
   * Marca la pestaña de archivados. Solo ahí la fila se puede bloquear: la
   * municipalidad dada de baja impide reactivar, nunca desactivar.
   */
  isReactivation?: boolean
  onAction: (validator: Validator) => void
}

/**
 * Una cuenta archivada no se puede reactivar mientras su municipalidad esté
 * dada de baja. Solo aplica a esa acción: desactivar nunca queda trabado.
 */
function cannotBeReactivated(validator: Validator): boolean {
  return validator.municipality == null || validator.municipality.is_active === false
}

/**
 * La tabla de validadores, igual en las dos pestañas.
 *
 * Habilitados y archivados muestran lo mismo y se diferencian solo en qué hace
 * el botón de la fila.
 */
export function ValidatorsTable({
  validators,
  showMunicipality,
  actionLabel,
  isReactivation = false,
  onAction,
}: ValidatorsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{messages.validators.name}</TableHead>
          <TableHead>{messages.validators.email}</TableHead>
          {showMunicipality && (
            <TableHead>{messages.validators.municipality}</TableHead>
          )}
          <TableHead className="w-44">{messages.validators.state}</TableHead>
          <TableHead className="w-28 text-right">
            {messages.validators.validations}
          </TableHead>
          <TableHead className="w-32" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {validators.map((validator) => (
          <TableRow key={validator.id}>
            <TableCell className="font-medium">
              <span className="flex items-center gap-2.5">
                <PersonAvatar name={validator.name} src={validator.avatar} />
                {validator.name}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">{validator.email}</TableCell>
            {showMunicipality && (
              <TableCell>{validator.municipality?.city ?? '—'}</TableCell>
            )}
            <TableCell>
              <Badge
                variant="secondary"
                className={
                  validator.is_active_validator
                    ? 'gap-1.5 bg-status-resolved/12 pl-1.5 text-status-resolved ring-1 ring-status-resolved/25 ring-inset'
                    : 'gap-1.5 pl-1.5'
                }
              >
                <span
                  aria-hidden
                  className={cn(
                    'size-1.5 rounded-full',
                    validator.is_active_validator
                      ? 'bg-status-resolved'
                      : 'bg-muted-foreground',
                  )}
                />
                {validator.is_active_validator
                  ? messages.validators.active
                  : messages.validators.inactive}
              </Badge>
              {validator.must_change_password && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {messages.validators.pendingPassword}
                </span>
              )}
            </TableCell>
            <TableCell className="text-right font-medium">
              {validator.validation_count}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                // Reactivar a alguien cuya municipalidad está dada de baja
                // dejaría una cuenta operando sobre una jurisdicción cerrada.
                // El backend lo rechaza; acá se evita el intento y se explica.
                disabled={isReactivation && cannotBeReactivated(validator)}
                title={
                  isReactivation && cannotBeReactivated(validator)
                    ? messages.validators.cannotReactivate
                    : undefined
                }
                onClick={() => onAction(validator)}
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
