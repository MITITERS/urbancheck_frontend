import { createElement } from 'react'
import regular from '@fontsource/geist/files/geist-latin-400-normal.woff?url'
import medium from '@fontsource/geist/files/geist-latin-500-normal.woff?url'
import semibold from '@fontsource/geist/files/geist-latin-600-normal.woff?url'
import bold from '@fontsource/geist/files/geist-latin-700-normal.woff?url'
import type { Statistics } from '../types'

/** `Villa María (Córdoba)` → `villa-maria-cordoba`, para el nombre del archivo. */
function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Arma el PDF de las estadísticas y lo descarga.
 *
 * La librería y el documento se cargan recién acá, al tocar el botón: pesan
 * bastante y la sección no los necesita para mostrarse. Las fuentes son URLs
 * de Vite, que también se bajan recién cuando react-pdf las pide.
 */
export async function exportStatisticsPdf(
  data: Statistics,
  municipality: string | null,
): Promise<void> {
  const [{ pdf }, { StatisticsDocument }, { registerPdfFonts }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./StatisticsDocument'),
    import('./fonts'),
  ])
  registerPdfFonts({ regular, medium, semibold, bold })
  const document = createElement(StatisticsDocument, {
    data,
    municipality,
    generatedAt: new Date(),
    logoSrc: `${window.location.origin}/urbancheck-mark.png`,
  })
  // `pdf()` espera su propio tipo de elemento; el componente devuelve un
  // `<Document>`, que es lo que pide.
  const blob = await pdf(document as Parameters<typeof pdf>[0]).toBlob()

  const name = [
    'estadisticas',
    municipality && slug(municipality),
    data.period.start,
    data.period.end,
  ]
    .filter(Boolean)
    .join('_')
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = `${name}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
