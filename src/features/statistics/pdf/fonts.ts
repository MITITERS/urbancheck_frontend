import { Font } from '@react-pdf/renderer'

/** La tipografía del panel, para que el PDF se lea como parte de él. */
export const PDF_FONT = 'Geist'

/** Los cuatro pesos que usa el documento, como URL o ruta a un `.woff`. */
export interface PdfFontSources {
  regular: string
  medium: string
  semibold: string
  bold: string
}

let registered = false

/**
 * Registra Geist en react-pdf. Las fuentes se pasan de afuera porque cambian
 * según dónde se genere: en el navegador son URLs que arma Vite, en los tests
 * son rutas del disco.
 *
 * Son los archivos estáticos de `@fontsource/geist` y no los del panel: el panel
 * usa la versión variable en `woff2`, y react-pdf no sabe elegir pesos de una
 * fuente variable.
 */
export function registerPdfFonts(sources: PdfFontSources): void {
  if (registered) return
  Font.register({
    family: PDF_FONT,
    fonts: [
      { src: sources.regular, fontWeight: 400 },
      { src: sources.medium, fontWeight: 500 },
      { src: sources.semibold, fontWeight: 600 },
      { src: sources.bold, fontWeight: 700 },
    ],
  })
  // Sin esto, react-pdf corta las palabras largas con guion
  // («confir-mación»). Las etiquetas son cortas: mejor que bajen enteras.
  Font.registerHyphenationCallback((word) => [word])
  registered = true
}
