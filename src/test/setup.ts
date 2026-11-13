import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { clearStoredToken } from '@/lib/session'

// Los tests que corren en Node (`@vitest-environment node`, como el del PDF de
// estadísticas) no tienen DOM: lo de abajo solo aplica con jsdom.
const hasDom = typeof window !== 'undefined'

afterEach(() => {
  if (hasDom) {
    cleanup()
    // `clearStoredToken` además del storage: el módulo de sesión cachea el
    // token en memoria, y sin esto una sesión se filtra de un test al siguiente.
    clearStoredToken()
    window.localStorage.clear()
  }
  vi.restoreAllMocks()
})

// `cmdk`, que es lo que mueve el combobox, observa el tamaño de su lista.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (hasDom) {
  // jsdom no implementa las APIs de captura de puntero ni `scrollIntoView`, y los
  // componentes de Radix (select, combobox) las usan al abrirse. Sin estos shims
  // el menú nunca llega a montarse en los tests.
  window.HTMLElement.prototype.hasPointerCapture ??= () => false
  window.HTMLElement.prototype.setPointerCapture ??= () => {}
  window.HTMLElement.prototype.releasePointerCapture ??= () => {}
  window.HTMLElement.prototype.scrollIntoView ??= () => {}

  // jsdom does not implement it and Radix-based components rely on it.
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}
