/** Formatting helpers for user-facing values. Locale is fixed to es-AR. */

const LOCALE = 'es-AR'

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

/** Solo la hora, «09:53 a. m.», para mostrarla debajo de la fecha. */
export function formatTime(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : timeFormatter.format(date)
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}

/**
 * Cuántos tramos de la dirección se muestran cuando hay que acortarla.
 *
 * Tres alcanzan para ubicar a alguien —«Banco Patagonia, 1145, Santa Fe»— y el
 * resto es lo que agrega el geocodificador: barrio, municipio, pedanía,
 * departamento, provincia, país y código postal. En una fila de tabla o en una
 * tarjeta, esa cola no informa y empuja el ancho.
 */
const ADDRESS_PARTS = 3

/**
 * La dirección, sin la cola administrativa del geocodificador.
 *
 * Nominatim devuelve la jerarquía completa separada por comas. Se conservan los
 * primeros tramos, que son los que identifican el lugar, y se corta el resto.
 * Si la dirección es corta o la escribió una persona a mano, vuelve igual.
 */
export function shortAddress(value: string | null | undefined): string {
  if (!value) return ''
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length <= ADDRESS_PARTS) return parts.join(', ')
  return parts.slice(0, ADDRESS_PARTS).join(', ')
}

/** Un número de puerta: «527», «1145b», «12-14». */
const HOUSE_NUMBER = /^\d+[a-z]?(-\d+)?$/i

/**
 * Solo calle y número —«Corrientes 527»—, para las filas de una tabla.
 *
 * El geocodificador arma la dirección al revés de como se lee —«527,
 * Corrientes, Centro, Villa María, …»— y a veces con un lugar adelante
 * —«Banco Patagonia, 1145, Santa Fe, …»—. Si hay un tramo que es un número de
 * puerta, se lo pone detrás de la calle que lo sigue. Si no lo hay, queda el
 * primer tramo, que es la calle o lo que haya escrito la persona.
 */
export function streetAddress(value: string | null | undefined): string {
  if (!value) return ''
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const number = parts.findIndex((part) => HOUSE_NUMBER.test(part))
  if (number !== -1 && number + 1 < parts.length) {
    return `${parts[number + 1]} ${parts[number]}`
  }
  return parts[0] ?? ''
}

/**
 * Iniciales de una persona, para el avatar de la topbar.
 *
 * Toma la primera letra del primer y del último tramo del nombre. Si lo que
 * llega es un correo —el nombre puede venir vacío—, se queda con la primera
 * letra de la parte local, que es lo único que identifica algo ahí.
 */
export function initials(value: string): string {
  const name = value.trim()
  if (name === '') return '?'
  if (name.includes('@')) return name[0].toUpperCase()

  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : ''
  return (first + last).toUpperCase()
}

/**
 * Una fecha sin hora, como la manda y la espera la API: ``aaaa-mm-dd``.
 *
 * No se parsea con ``new Date(value)``: esa forma interpreta ``2026-02-09``
 * como medianoche **UTC**, y en Argentina —tres horas atrás— eso cae el día
 * anterior. Un filtro «desde el 9» terminaba mostrándose como «08/02/2026».
 * Partir el string y construir la fecha en horario local evita el corrimiento.
 */
export function parseDateOnly(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined
  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return Number.isNaN(date.getTime()) ? undefined : date
}

/** La fecha en el formato que viaja a la API. */
export function toDateOnly(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * La fecha como se lee en pantalla: ``dd/mm/aaaa``, siempre.
 *
 * Se arma a mano y no con ``Intl``: el orden de los campos tiene que ser el
 * mismo en cualquier navegador y con cualquier idioma configurado, que es
 * justamente lo que no garantiza un ``input[type=date]`` nativo.
 */
export function formatDateOnly(value: string): string {
  const date = parseDateOnly(value)
  if (!date) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()}`
}

const HOUR_SECONDS = 3600
const DAY_SECONDS = 24 * HOUR_SECONDS

/**
 * Un tiempo en la unidad que se lee mejor: horas por debajo del día, días por
 * encima (US-050, escenario 11). Con un decimal y coma, como se escribe acá.
 * Por debajo de una hora se muestra en minutos para que no diga «0 h».
 */
export function formatDuration(seconds: number): string {
  const one = (value: number) =>
    value.toLocaleString('es-AR', { maximumFractionDigits: 1 })
  if (seconds < HOUR_SECONDS) return `${Math.max(1, Math.round(seconds / 60))} min`
  if (seconds < DAY_SECONDS) return `${one(seconds / HOUR_SECONDS)} h`
  // Desde diez días el decimal ya no informa nada: «350 días», no «349,8».
  const days = seconds / DAY_SECONDS
  const shown = days >= 10 ? String(Math.round(days)) : one(days)
  return `${shown} ${shown === '1' ? 'día' : 'días'}`
}

/**
 * Un tiempo promedio, siempre en horas (US-050). Decisión del usuario del
 * 21/10: los promedios se comparan entre sí, y con todos en la misma unidad se
 * ve de un vistazo cuál etapa tarda más. Con un decimal por debajo de diez
 * horas, enteras por encima —«207 h», no «206,8 h»—, y en minutos por debajo de
 * una hora para que no diga «0 hs».
 */
export function formatHours(seconds: number): string {
  if (seconds < HOUR_SECONDS) return `${Math.max(1, Math.round(seconds / 60))} min`
  const hours = seconds / HOUR_SECONDS
  const shown =
    hours >= 10
      ? Math.round(hours).toLocaleString('es-AR')
      : hours.toLocaleString('es-AR', { maximumFractionDigits: 1 })
  return `${shown} hs`
}
