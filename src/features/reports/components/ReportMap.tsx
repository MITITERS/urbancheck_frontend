import { useMemo } from 'react'
import { divIcon } from 'leaflet'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { messages } from '@/config/messages'

const DEFAULT_ZOOM = 16

/**
 * Leaflet's default marker points at image files that a bundler cannot resolve
 * on its own; a `divIcon` avoids the asset dance entirely and picks up the
 * theme tokens like any other element.
 */
function useMarkerIcon() {
  return useMemo(
    () =>
      divIcon({
        className: '',
        // Punto sólido con un halo alrededor: sobre la textura del mapa, un
        // círculo plano de 16px se confunde con cualquier rotonda.
        html: `<span class="block size-4 rounded-full border-2 border-background bg-primary shadow-md ring-6 ring-primary/20"></span>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    [],
  )
}

export function ReportMap({
  latitude,
  longitude,
}: {
  latitude: string | null
  longitude: string | null
}) {
  const icon = useMarkerIcon()

  if (latitude === null || longitude === null) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        {messages.reportDetail.noLocation}
      </p>
    )
  }

  const position: [number, number] = [Number(latitude), Number(longitude)]

  return (
    <MapContainer
      center={position}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={false}
      className="h-72 w-full rounded-lg ring-1 ring-border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={icon} />
    </MapContainer>
  )
}
