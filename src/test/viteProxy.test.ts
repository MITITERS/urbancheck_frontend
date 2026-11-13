import { describe, expect, it } from 'vitest'
import type { ProxyOptions, UserConfig } from 'vite'
import viteConfig from '../../vite.config'

/**
 * El proxy del dev server tiene que **preservar el `Host` original**.
 *
 * DRF arma las URLs absolutas de los archivos subidos con
 * `build_absolute_uri()`, o sea a partir de ese header. Con `changeOrigin: true`
 * el backend recibe el Host del destino y responde
 * `http://django:8000/media/...`: un host que solo existe dentro de la red de
 * Docker, que el navegador no resuelve y que deja las fotos en gris.
 *
 * Es un fallo silencioso —no hay error en consola ni request fallida en la API,
 * solo una imagen que no carga—, y `changeOrigin: true` es lo que uno escribe
 * por reflejo al montar un proxy. De ahí este test.
 */
async function resolveProxy(): Promise<Record<string, string | ProxyOptions>> {
  const resolved = (await (typeof viteConfig === 'function'
    ? viteConfig({ command: 'serve', mode: 'development' })
    : viteConfig)) as UserConfig

  const proxy = resolved.server?.proxy
  if (!proxy) throw new Error('El dev server tiene que proxear la API.')
  return proxy
}

describe('proxy del dev server', () => {
  it('proxea la API, allauth, los archivos subidos y el enlace compartido', async () => {
    const proxy = await resolveProxy()

    expect(Object.keys(proxy).sort()).toEqual(['/_allauth', '/api', '/media', '^/r/'])
  })

  it('CP-030-P06 · el enlace compartido no se lleva las rutas del panel', () => {
    // Vite trata una clave con `^` como expresión regular. Como prefijo, `/r`
    // también capturaría `/reportes` y la mandaría al backend.
    const shared = new RegExp('^/r/')

    expect(shared.test('/r/da139cad-eb68-4d1a-bd2f-9ae4b21c7601')).toBe(true)
    expect(shared.test('/reportes')).toBe(false)
    expect(shared.test('/reportes/42')).toBe(false)
    expect(shared.test('/reporte/da139cad')).toBe(false)
  })

  it('no reescribe el Host: es de donde salen las URLs de las fotos', async () => {
    const proxy = await resolveProxy()

    for (const [prefix, options] of Object.entries(proxy)) {
      expect(
        typeof options === 'string' ? undefined : options.changeOrigin,
        `${prefix} no debe usar changeOrigin`,
      ).toBeFalsy()
    }
  })
})
