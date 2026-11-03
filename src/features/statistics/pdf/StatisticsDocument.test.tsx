// @vitest-environment node
import { resolve } from 'node:path'
import { renderToBuffer } from '@react-pdf/renderer'
import { describe, expect, it } from 'vitest'
import type { ReportCategory, ReportStatus } from '@/features/reports/types'
import type { Statistics } from '../types'
import { registerPdfFonts } from './fonts'
import { StatisticsDocument } from './StatisticsDocument'

// Las mismas fuentes que en el navegador, leídas del disco: el conteo de
// páginas depende de cómo miden.
const font = (weight: number) =>
  resolve(
    __dirname,
    `../../../../node_modules/@fontsource/geist/files/geist-latin-${weight}-normal.woff`,
  )
registerPdfFonts({
  regular: font(400),
  medium: font(500),
  semibold: font(600),
  bold: font(700),
})

/**
 * El PDF de las estadísticas tiene que entrar siempre en una hoja. Se genera
 * de verdad, con el período más cargado que puede mostrar —todas las
 * categorías y estados con valores, notas de antigüedad en cada abierto y el
 * umbral de apelaciones superado—, y se cuentan las páginas del archivo.
 */

const CATEGORIES: [ReportCategory, string][] = [
  ['bache', 'Bache'],
  ['alumbrado', 'Alumbrado'],
  ['basura', 'Basura'],
  ['vereda', 'Vereda'],
  ['semaforo', 'Semáforo'],
  ['otro', 'Otro'],
]

const STATUSES: [ReportStatus, string][] = [
  ['pendiente_validacion', 'Pendiente de validación'],
  ['reportado', 'Reportado'],
  ['en_proceso', 'En proceso'],
  ['resuelto_pendiente_confirmacion', 'Resuelto pendiente de confirmación'],
  ['resuelto', 'Resuelto'],
  ['cancelado', 'Cancelado'],
  ['archivado', 'Archivado'],
]

function busy(): Statistics {
  const average = (hours: number) => ({ avg_seconds: hours * 3600, sample_size: 9999 })
  return {
    period: { key: '12m', start: '2025-11-04', end: '2026-11-03' },
    total: 99999,
    by_category: CATEGORIES.map(([key, label]) => ({
      key,
      label,
      count: 16666,
      percentage: 16.7,
    })),
    by_status: STATUSES.map(([key, label]) => ({
      key,
      label,
      count: 14285,
      percentage: 14.3,
    })),
    indicators: {
      validation: { overall: average(51), field: average(6), collective: average(72) },
      assignment: average(8),
      resolution: average(1207),
      open: STATUSES.slice(0, 3).map(([status, label]) => ({
        status,
        label,
        count: 9999,
        oldest_since: '2025-11-04T00:00:00Z',
        oldest_age_seconds: 364 * 86400,
      })),
      appealed_closures: {
        closures: 99999,
        appealed: 99999,
        percentage: 100,
        alert_threshold: 20,
        above_threshold: true,
      },
      cancellations: { field_rejection: 9999, moderation: 9999, municipal: 9999 },
      archived_by_inactivity: 9999,
    },
  }
}

async function pages(data: Statistics): Promise<number> {
  const buffer = await renderToBuffer(
    <StatisticsDocument
      data={data}
      municipality="Villa María (Córdoba)"
      generatedAt={new Date('2026-11-03T12:00:00Z')}
      logoSrc={resolve(__dirname, '../../../../public/urbancheck-mark.png')}
    />,
  )
  return (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length
}

describe('StatisticsDocument', () => {
  it('con el período más cargado entra en una sola hoja', async () => {
    expect(await pages(busy())).toBe(1)
  }, 30_000)

  it('un período vacío también es una hoja', async () => {
    const empty = busy()
    empty.total = 0
    empty.by_category = empty.by_category.map((row) => ({
      ...row,
      count: 0,
      percentage: null,
    }))
    expect(await pages(empty)).toBe(1)
  }, 30_000)
})
