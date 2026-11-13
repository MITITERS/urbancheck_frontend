import { Link } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import { AreaFormDialog } from './AreaFormDialog'
import type { OperationalArea } from '../types'

interface AreasTableProps {
  areas: OperationalArea[]
  /** Para el agente la municipalidad es constante: no aporta una columna. */
  showMunicipality: boolean
  /** Etiqueta y acción del botón de estado: desactivar, o reactivar. */
  actionLabel: string
  onAction: (area: OperationalArea) => void
}

/**
 * La tabla de áreas operativas, igual en las dos pestañas.
 *
 * Activas y desactivadas muestran lo mismo y se diferencian solo en qué hace
 * el botón de la fila, con el mismo patrón que la tabla de validadores.
 */
export function AreasTable({
  areas,
  showMunicipality,
  actionLabel,
  onAction,
}: AreasTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{messages.areas.name}</TableHead>
          <TableHead>{messages.areas.contact}</TableHead>
          {showMunicipality && <TableHead>{messages.areas.municipality}</TableHead>}
          <TableHead className="w-32">{messages.areas.state}</TableHead>
          <TableHead className="w-24 text-right">{messages.areas.operators}</TableHead>
          <TableHead className="w-24 text-right">{messages.areas.reports}</TableHead>
          <TableHead className="w-64" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {areas.map((area) => (
          <TableRow key={area.id}>
            <TableCell className="font-medium">
              {/* La ficha del área es donde viven sus operarios (US-044). */}
              <Link
                to={`/areas/${area.id}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {area.name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5 shrink-0" aria-hidden />
                {area.contact_email}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5">
                <Phone className="size-3.5 shrink-0" aria-hidden />
                {area.contact_phone}
              </span>
            </TableCell>
            {showMunicipality && (
              <TableCell>{area.municipality?.city ?? '—'}</TableCell>
            )}
            <TableCell>
              <Badge
                variant="secondary"
                className={
                  area.is_active
                    ? 'gap-1.5 bg-status-resolved/12 pl-1.5 text-status-resolved ring-1 ring-status-resolved/25 ring-inset'
                    : 'gap-1.5 pl-1.5'
                }
              >
                <span
                  aria-hidden
                  className={cn(
                    'size-1.5 rounded-full',
                    area.is_active ? 'bg-status-resolved' : 'bg-muted-foreground',
                  )}
                />
                {area.is_active ? messages.areas.active : messages.areas.inactive}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-medium">
              {area.operator_count}
            </TableCell>
            <TableCell className="text-right font-medium">
              {area.report_count}
            </TableCell>
            <TableCell className="text-right">
              <span className="flex justify-end gap-2">
                <Button asChild variant="ghost">
                  <Link to={`/areas/${area.id}`}>{messages.areas.manage}</Link>
                </Button>
                <AreaFormDialog
                  area={area}
                  trigger={<Button variant="ghost">{messages.areas.edit}</Button>}
                />
                <Button variant="outline" onClick={() => onAction(area)}>
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
