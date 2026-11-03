import type { ReactNode } from 'react'
import {
  Document,
  G,
  Image,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer'
import { messages } from '@/config/messages'
import type { ReportCategory, ReportStatus } from '@/features/reports/types'
import { formatDateOnly, formatDuration, formatHours } from '@/lib/format'
import type { AverageTime, Statistics } from '../types'
import { PDF_FONT } from './fonts'

const t = messages.statistics
const p = messages.statistics.pdf

/**
 * Los colores del tema claro, en hex: el PDF no entiende variables de CSS ni
 * `oklch`. Son los mismos tonos que `components/colors.ts`, convertidos; los
 * intermedios que en pantalla van atenuados con `color-mix` acá ya vienen
 * mezclados con el blanco del papel.
 */
const INK = '#122539'
const MUTED = '#606d7c'
const BORDER = '#dfe6ed'
const SURFACE = '#f4f7fb'
const PRIMARY = '#0270ce'
const PRIMARY_SOFT = '#e6f0fa'
const DANGER = '#e7000b'
const ON_DARK_MUTED = '#9fb2c6'

const CATEGORY_HEX: Record<ReportCategory, string> = {
  bache: '#0270ce',
  alumbrado: '#08a8ae',
  basura: '#00cb95',
  vereda: '#30556d',
  semaforo: '#a4bec9',
  otro: MUTED,
}

const STATUS_HEX: Record<ReportStatus, string> = {
  pendiente_validacion: '#c97f14',
  reportado: '#67a9e2',
  en_proceso: '#0270ce',
  resuelto_pendiente_confirmacion: '#8cd0bb',
  resuelto: '#009869',
  cancelado: '#e7000b',
  archivado: MUTED,
}

/** Los mismos grupos que `StatusBreakdown`, en el mismo orden. */
const STATUS_GROUPS: readonly { label: string; statuses: readonly ReportStatus[] }[] = [
  {
    label: t.groupOpen,
    statuses: [
      'pendiente_validacion',
      'reportado',
      'en_proceso',
      'resuelto_pendiente_confirmacion',
    ],
  },
  { label: t.groupResolved, statuses: ['resuelto'] },
  { label: t.groupOut, statuses: ['cancelado', 'archivado'] },
]

const MARGIN = 40

const styles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT,
    fontSize: 9.5,
    color: INK,
    paddingBottom: 48,
  },

  // Encabezado: una banda oscura de lado a lado.
  band: {
    backgroundColor: INK,
    paddingHorizontal: MARGIN,
    paddingTop: 26,
    paddingBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoTile: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 18, height: 21, objectFit: 'contain' },
  brandName: { fontSize: 13, fontWeight: 600, color: '#ffffff' },
  title: { fontSize: 26, fontWeight: 700, color: '#ffffff', marginTop: 14 },
  subtitle: { fontSize: 11, color: ON_DARK_MUTED, marginTop: 2 },
  periodBox: { alignItems: 'flex-end' },
  overline: {
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  periodValue: { fontSize: 13, fontWeight: 600, color: '#ffffff', marginTop: 3 },
  accent: { flexDirection: 'row', height: 4 },

  body: { paddingHorizontal: MARGIN },
  row: { flexDirection: 'row', gap: 10, marginTop: 14 },

  // Indicadores principales.
  kpi: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderTopWidth: 3,
  },
  kpiLabel: { fontSize: 8.5, fontWeight: 500, color: MUTED },
  kpiValue: { fontSize: 25, fontWeight: 700, marginTop: 4, letterSpacing: -0.5 },
  kpiNote: { fontSize: 8, color: MUTED, marginTop: 1 },

  // Lo destacado.
  highlights: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: PRIMARY_SOFT,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    gap: 14,
  },
  highlight: { flex: 1 },
  highlightValue: { fontSize: 14, fontWeight: 700, color: PRIMARY },
  highlightText: { fontSize: 8.5, color: INK, marginTop: 2, lineHeight: 1.35 },

  // Tarjetas.
  card: { flex: 1, backgroundColor: SURFACE, borderRadius: 10, padding: 13 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  cardMark: { width: 3, height: 10, borderRadius: 2, backgroundColor: PRIMARY },
  cardTitle: { fontSize: 9, fontWeight: 600 },

  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4.5,
    borderBottomWidth: 0.6,
    borderBottomColor: BORDER,
  },
  lineLast: { borderBottomWidth: 0 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  value: { fontWeight: 600, marginLeft: 8 },
  small: { fontSize: 8, color: MUTED },
  group: {
    fontSize: 7,
    fontWeight: 600,
    color: MUTED,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 7,
    marginBottom: 2,
  },
  track: { height: 5, backgroundColor: BORDER, borderRadius: 3 },
  note: { fontSize: 8, color: MUTED, marginTop: 12, lineHeight: 1.4 },

  footer: {
    position: 'absolute',
    bottom: 20,
    left: MARGIN,
    right: MARGIN,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 7,
    borderTopWidth: 0.6,
    borderTopColor: BORDER,
    fontSize: 7.5,
    color: MUTED,
  },
})

function Card({
  title,
  color = PRIMARY,
  grow = 1,
  children,
}: {
  title: string
  color?: string
  /** Cuánto ancho toma frente a las otras tarjetas de la fila. */
  grow?: number
  children: ReactNode
}) {
  return (
    <View style={[styles.card, { flex: grow }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardMark, { backgroundColor: color }]} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  )
}

function Line({
  label,
  value,
  color,
  note,
  last,
}: {
  label: string
  value: string | number
  color?: string
  note?: string
  last?: boolean
}) {
  return (
    <View style={[styles.line, last ? styles.lineLast : {}]}>
      <View style={styles.label}>
        {color && <View style={[styles.dot, { backgroundColor: color }]} />}
        <View style={{ flex: 1 }}>
          <Text>{label}</Text>
          {note && <Text style={styles.small}>{note}</Text>}
        </View>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

function Bar({
  share,
  color,
  height = 5,
}: {
  share: number
  color: string
  height?: number
}) {
  return (
    <View style={[styles.track, { height }]}>
      <View
        style={{
          height,
          borderRadius: height / 2,
          width: `${Math.max(0, Math.min(share, 100))}%`,
          backgroundColor: color,
        }}
      />
    </View>
  )
}

function Stage({
  title,
  value,
  color,
}: {
  title: string
  value: AverageTime
  color: string
}) {
  return (
    <View style={[styles.kpi, { borderTopColor: color }]}>
      <Text style={styles.kpiLabel}>{title}</Text>
      {value.avg_seconds === null ? (
        <>
          <Text style={[styles.kpiValue, { color: MUTED }]}>—</Text>
          <Text style={styles.kpiNote}>{t.noCases}</Text>
        </>
      ) : (
        <>
          <Text style={styles.kpiValue}>{formatHours(value.avg_seconds)}</Text>
          <Text style={styles.kpiNote}>{p.average(t.sample(value.sample_size))}</Text>
        </>
      )}
    </View>
  )
}

/** Un arco de dona entre dos ángulos, en grados desde las 12 en punto. */
function arc(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  from: number,
  to: number,
) {
  const point = (radius: number, degrees: number) => {
    const radians = ((degrees - 90) * Math.PI) / 180
    return `${cx + radius * Math.cos(radians)} ${cy + radius * Math.sin(radians)}`
  }
  const large = to - from > 180 ? 1 : 0
  return [
    `M ${point(outer, from)}`,
    `A ${outer} ${outer} 0 ${large} 1 ${point(outer, to)}`,
    `L ${point(inner, to)}`,
    `A ${inner} ${inner} 0 ${large} 0 ${point(inner, from)}`,
    'Z',
  ].join(' ')
}

function Donut({ data }: { data: Statistics }) {
  const size = 96
  const center = size / 2
  const outer = size / 2 - 1
  const inner = outer * 0.66
  const slices = data.by_category.filter((row) => row.count > 0)
  let angle = 0
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          {slices.length === 1 ? (
            // Un arco de 360° no se dibuja: con una sola categoría va el anillo
            // entero como dos mitades.
            <>
              <Path
                d={arc(center, center, outer, inner, 0, 180)}
                fill={CATEGORY_HEX[slices[0].key]}
              />
              <Path
                d={arc(center, center, outer, inner, 180, 360)}
                fill={CATEGORY_HEX[slices[0].key]}
              />
            </>
          ) : (
            slices.map((row) => {
              const sweep = (row.count / data.total) * 360
              const from = angle
              angle += sweep
              return (
                <Path
                  key={row.key}
                  d={arc(center, center, outer, inner, from + 1, angle - 1)}
                  fill={CATEGORY_HEX[row.key]}
                />
              )
            })
          )}
        </G>
      </Svg>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: 700 }}>{data.total}</Text>
        <Text style={styles.small}>{t.reports(data.total)}</Text>
      </View>
    </View>
  )
}

/**
 * Las tres frases de «Lo destacado»: qué parte de lo creado ya está resuelto,
 * la categoría que más se reporta y la etapa que más tarda. Sale de los mismos
 * números de la hoja; si alguno no se puede calcular, esa frase no va.
 */
function highlightsOf(data: Statistics): { value: string; text: string }[] {
  if (data.total === 0) return []
  const items: { value: string; text: string }[] = []

  const resolved = data.by_status.find((row) => row.key === 'resuelto')
  if (resolved?.percentage != null) {
    items.push({ value: t.percent(resolved.percentage), text: p.resolvedShare })
  }

  const top = [...data.by_category].sort((a, b) => b.count - a.count)[0]
  if (top && top.count > 0) {
    items.push({ value: top.label, text: p.topCategory(t.percent(top.percentage)) })
  }

  const stages = [
    { name: t.validation, value: data.indicators.validation.overall },
    { name: t.assignment, value: data.indicators.assignment },
    { name: t.resolution, value: data.indicators.resolution },
  ].filter((stage) => stage.value.avg_seconds !== null)
  if (stages.length > 1) {
    const slowest = stages.reduce((a, b) =>
      (b.value.avg_seconds ?? 0) > (a.value.avg_seconds ?? 0) ? b : a,
    )
    items.push({
      value: slowest.name,
      text: p.slowestStage(formatHours(slowest.value.avg_seconds ?? 0)),
    })
  }
  return items
}

/**
 * Las estadísticas en una hoja A4, para descargar (US-023 y US-050).
 *
 * Es un documento propio y no una captura de la pantalla: así entra siempre en
 * una sola hoja, sin depender del ancho de la ventana ni del diálogo de
 * impresión del navegador. Muestra lo mismo que la sección y en el mismo orden
 * de lectura —el período, los tiempos por etapa, lo abierto, los cierres
 * apelados, las salidas y las dos distribuciones—, más una franja con lo
 * destacado arriba.
 *
 * Las fuentes las registra quien genera el PDF (`registerPdfFonts`).
 */
export function StatisticsDocument({
  data,
  municipality,
  generatedAt,
  logoSrc,
}: {
  data: Statistics
  municipality: string | null
  generatedAt: Date
  logoSrc: string
}) {
  const { indicators } = data
  const appealed = indicators.appealed_closures
  const byStatus = new Map(data.by_status.map((row) => [row.key, row]))
  const maxStatus = Math.max(1, ...data.by_status.map((row) => row.count))
  const highlights = highlightsOf(data)
  const period = t.activeWindow(
    formatDateOnly(data.period.start),
    formatDateOnly(data.period.end),
  )
  const generated = generatedAt.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Document
      title={p.documentTitle(municipality)}
      author="UrbanCheck"
      creator="UrbanCheck"
    >
      {/* `wrap={false}`: una sola hoja siempre. El contenido tiene una cantidad
          fija de filas, así que entra; esto es el seguro. */}
      <Page size="A4" style={styles.page} wrap={false}>
        <View style={styles.band}>
          <View>
            <View style={styles.brand}>
              <View style={styles.logoTile}>
                <Image src={logoSrc} style={styles.logo} />
              </View>
              <Text style={styles.brandName}>UrbanCheck</Text>
            </View>
            <Text style={styles.title}>{t.title}</Text>
            {municipality && <Text style={styles.subtitle}>{municipality}</Text>}
          </View>
          <View style={styles.periodBox}>
            <Text style={[styles.overline, { color: ON_DARK_MUTED }]}>
              {p.periodLabel}
            </Text>
            <Text style={styles.periodValue}>{period}</Text>
          </View>
        </View>
        {/* El filete de la marca: los colores de las categorías, en orden. */}
        <View style={styles.accent}>
          {Object.values(CATEGORY_HEX)
            .slice(0, 5)
            .map((color) => (
              <View key={color} style={{ flex: 1, backgroundColor: color }} />
            ))}
        </View>

        <View style={styles.body}>
          <View style={styles.row}>
            <View
              style={[
                styles.kpi,
                { backgroundColor: PRIMARY, borderTopColor: PRIMARY },
              ]}
            >
              <Text style={[styles.kpiLabel, { color: '#cfe3f7' }]}>{p.created}</Text>
              <Text style={[styles.kpiValue, { color: '#ffffff' }]}>{data.total}</Text>
              <Text style={[styles.kpiNote, { color: '#cfe3f7' }]}>{p.inPeriod}</Text>
            </View>
            <Stage
              title={t.validation}
              value={indicators.validation.overall}
              color={STATUS_HEX.pendiente_validacion}
            />
            <Stage
              title={t.assignment}
              value={indicators.assignment}
              color={STATUS_HEX.en_proceso}
            />
            <Stage
              title={t.resolution}
              value={indicators.resolution}
              color={STATUS_HEX.resuelto}
            />
          </View>

          {highlights.length > 0 && (
            <View style={styles.highlights}>
              {highlights.map((item) => (
                <View key={item.text} style={styles.highlight}>
                  <Text style={styles.highlightValue}>{item.value}</Text>
                  <Text style={styles.highlightText}>{item.text}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.row}>
            <Card title={t.open} color={STATUS_HEX.en_proceso}>
              {indicators.open.map((row, index) => (
                <Line
                  key={row.status}
                  color={STATUS_HEX[row.status]}
                  label={row.label}
                  note={
                    row.oldest_age_seconds !== null
                      ? t.oldest(formatDuration(row.oldest_age_seconds))
                      : undefined
                  }
                  value={row.count}
                  last={index === indicators.open.length - 1}
                />
              ))}
            </Card>

            <Card
              title={t.appealed}
              color={appealed.above_threshold ? DANGER : STATUS_HEX.resuelto}
            >
              {appealed.percentage === null ? (
                <Text style={styles.small}>{t.noCases}</Text>
              ) : (
                <View>
                  <Text
                    style={[
                      styles.kpiValue,
                      { marginTop: 0, color: appealed.above_threshold ? DANGER : INK },
                    ]}
                  >
                    {appealed.percentage.toLocaleString('es-AR')} %
                  </Text>
                  <Text style={[styles.small, { marginTop: 2 }]}>
                    {t.appealedDetail(appealed.appealed, appealed.closures)}
                  </Text>
                  {/* La barra contra el umbral, con la marca del límite. */}
                  <View style={{ marginTop: 10 }}>
                    <Bar
                      share={appealed.percentage}
                      color={appealed.above_threshold ? DANGER : STATUS_HEX.resuelto}
                      height={6}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        top: -3,
                        left: `${Math.min(appealed.alert_threshold, 100)}%`,
                        width: 1.5,
                        height: 12,
                        backgroundColor: INK,
                      }}
                    />
                  </View>
                  <Text
                    style={[
                      styles.small,
                      { marginTop: 8 },
                      appealed.above_threshold
                        ? { color: DANGER, fontWeight: 500 }
                        : {},
                    ]}
                  >
                    {appealed.above_threshold
                      ? t.appealedAlert(appealed.alert_threshold)
                      : t.threshold(appealed.alert_threshold)}
                  </Text>
                </View>
              )}
            </Card>

            <Card title={t.exits} color={STATUS_HEX.cancelado}>
              <Line
                color={STATUS_HEX.cancelado}
                label={t.cancellationsFieldRejection}
                value={indicators.cancellations.field_rejection}
              />
              <Line
                color={STATUS_HEX.cancelado}
                label={t.cancellationsModeration}
                value={indicators.cancellations.moderation}
              />
              <Line
                color={STATUS_HEX.cancelado}
                label={t.cancellationsMunicipal}
                value={indicators.cancellations.municipal}
              />
              <Line
                color={STATUS_HEX.archivado}
                label={t.archived}
                value={indicators.archived_by_inactivity}
                last
              />
            </Card>
          </View>

          <View style={styles.row}>
            {/* Un poco más ancha que «Por estado»: la leyenda va al lado de la
                dona y necesita lugar para los números. */}
            <Card title={t.byCategory} grow={1.18}>
              {data.total === 0 ? (
                <Text style={styles.small}>{t.empty}</Text>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Donut data={data} />
                  <View style={{ flex: 1 }}>
                    {data.by_category.map((row, index) => (
                      <View
                        key={row.key}
                        style={[
                          styles.line,
                          index === data.by_category.length - 1 ? styles.lineLast : {},
                        ]}
                      >
                        <View style={styles.label}>
                          <View
                            style={[
                              styles.dot,
                              { backgroundColor: CATEGORY_HEX[row.key] },
                            ]}
                          />
                          <Text style={{ flex: 1 }}>{row.label}</Text>
                        </View>
                        <Text style={[styles.value, { width: 30, textAlign: 'right' }]}>
                          {row.count}
                        </Text>
                        <Text style={[styles.small, { width: 36, textAlign: 'right' }]}>
                          {t.percent(row.percentage)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Card>

            <Card title={t.byStatus}>
              {data.total === 0 ? (
                <Text style={styles.small}>{t.empty}</Text>
              ) : (
                STATUS_GROUPS.map((group, groupIndex) => (
                  <View key={group.label}>
                    <Text
                      style={[styles.group, groupIndex === 0 ? { marginTop: 0 } : {}]}
                    >
                      {group.label}
                    </Text>
                    {group.statuses.map((status) => {
                      const row = byStatus.get(status)
                      if (!row) return null
                      return (
                        // La barra va debajo de la fila: en media hoja no
                        // entra al costado de la etiqueta.
                        <View key={status} style={{ paddingVertical: 2.5 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={styles.label}>
                              <View
                                style={[
                                  styles.dot,
                                  { backgroundColor: STATUS_HEX[status] },
                                ]}
                              />
                              <Text style={{ flex: 1 }}>{row.label}</Text>
                            </View>
                            <Text
                              style={[styles.value, { width: 26, textAlign: 'right' }]}
                            >
                              {row.count}
                            </Text>
                            <Text
                              style={[styles.small, { width: 38, textAlign: 'right' }]}
                            >
                              {t.percent(row.percentage)}
                            </Text>
                          </View>
                          <View style={{ marginTop: 3, marginLeft: 13 }}>
                            <Bar
                              share={(row.count / maxStatus) * 100}
                              color={STATUS_HEX[status]}
                              height={4}
                            />
                          </View>
                        </View>
                      )
                    })}
                  </View>
                ))
              )}
            </Card>
          </View>

          <Text style={styles.note}>{t.stagesNote}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>{p.footer}</Text>
          <Text>{p.generated(generated)}</Text>
        </View>
      </Page>
    </Document>
  )
}
