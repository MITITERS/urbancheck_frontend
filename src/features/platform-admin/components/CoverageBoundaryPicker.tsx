import { useEffect } from 'react'
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { divIcon, type LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Undo2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { messages } from '@/config/messages'
import type { BoundaryPoint } from '../types'

const DEFAULT_ZOOM = 13
/** Mínimo para encerrar área. El backend valida lo mismo. */
const MIN_POINTS = 3

/** Centro de Córdoba: punto de partida razonable cuando no hay nada elegido. */
const FALLBACK_CENTER: LatLngExpression = [-31.4201, -64.1888]

const vertexIcon = divIcon({
  className: '',
  html: '<span class="block size-2.5 rounded-full border-2 border-background bg-primary shadow"></span>',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
})

function Recenter({ center }: { center: LatLngExpression | null }) {
  const map = useMap()

  // `center` de MapContainer solo aplica al montarlo: para seguir a la ciudad
  // que se está eligiendo hay que mover la vista a mano.
  useEffect(() => {
    if (center) map.setView(center, map.getZoom())
  }, [center, map])

  return null
}

function ClickHandler({ onAdd }: { onAdd: (point: BoundaryPoint) => void }) {
  useMapEvents({
    click: (event) => onAdd([event.latlng.lat, event.latlng.lng]),
  })
  return null
}

interface CoverageBoundaryPickerProps {
  /** Centro de la ciudad elegida. Solo encuadra el mapa; no delimita nada. */
  center: BoundaryPoint | null
  boundary: BoundaryPoint[]
  onChange: (boundary: BoundaryPoint[]) => void
}

/**
 * Mapa para trazar el límite de un municipio, punto por punto.
 *
 * Antes esto era un círculo con un centro y un radio. No alcanzaba: dos ciudades
 * pegadas separadas por un río no se pueden distinguir con círculos, porque
 * cualquiera lo bastante grande para cubrir una entera se come parte de la otra.
 *
 * Se traza haciendo clic. Mientras hay menos de tres puntos se dibuja la línea
 * abierta —todavía no encierra nada— y a partir del tercero se cierra sola en un
 * polígono: la forma que se ve es exactamente la que se guarda.
 */
export function CoverageBoundaryPicker({
  center,
  boundary,
  onChange,
}: CoverageBoundaryPickerProps) {
  const positions = boundary.map(([lat, lng]) => [lat, lng] as LatLngExpression)
  const isClosed = boundary.length >= MIN_POINTS
  const mapCenter: LatLngExpression = center
    ? [center[0], center[1]]
    : (positions[0] ?? FALLBACK_CENTER)

  return (
    <div className="space-y-2">
      <MapContainer
        center={mapCenter}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        // Trazar es hacer clic muchas veces seguidas, y dos clics rápidos son
        // un doble clic: con el zoom activado, marcar dos vértices contiguos
        // saltaba de escala y descolocaba el trazado.
        doubleClickZoom={false}
        className="h-72 w-full rounded-lg ring-1 ring-border"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onAdd={(point) => onChange([...boundary, point])} />
        {/* Solo sigue a la ciudad mientras no haya nada trazado: una vez que el
            polígono existe, mover la vista sacaría de pantalla lo que se está
            dibujando. */}
        <Recenter center={boundary.length === 0 && center ? mapCenter : null} />

        {isClosed ? (
          <Polygon
            positions={positions}
            pathOptions={{
              color: 'var(--color-primary)',
              weight: 2,
              fillColor: 'var(--color-primary)',
              fillOpacity: 0.1,
            }}
          />
        ) : (
          positions.length > 1 && (
            <Polyline
              positions={positions}
              pathOptions={{
                color: 'var(--color-primary)',
                weight: 2,
                dashArray: '4 4',
              }}
            />
          )
        )}

        {/* Un marcador por vértice: sin ellos no se ve dónde quedó cada clic ni
            se puede juzgar si el trazado sigue el límite real. */}
        {positions.map((position, index) => (
          <Marker key={index} position={position} icon={vertexIcon} />
        ))}
      </MapContainer>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="tabular text-xs text-muted-foreground">
          {boundary.length === 0
            ? messages.municipalities.boundaryEmpty
            : isClosed
              ? messages.municipalities.boundaryPoints(boundary.length)
              : messages.municipalities.boundaryTooFew(MIN_POINTS - boundary.length)}
        </p>
        {boundary.length > 0 && (
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(boundary.slice(0, -1))}
            >
              <Undo2 className="size-3.5" aria-hidden />
              {messages.municipalities.boundaryUndo}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => onChange([])}
            >
              <X className="size-3.5" aria-hidden />
              {messages.municipalities.boundaryClear}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
