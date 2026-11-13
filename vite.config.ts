import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // The dev server proxies the API so the browser always talks to a single
  // origin: no CORS setup is needed and the same relative paths work in dev,
  // in Docker (target = the backend service on the Compose network) and in
  // production (nginx does the same proxying).
  const proxyTarget = env.VITE_API_PROXY_TARGET ?? 'http://localhost:8000'

  // El `Host` original se preserva a propósito (`changeOrigin` queda en false,
  // que es el default). DRF arma las URLs absolutas de los archivos subidos con
  // `build_absolute_uri()`, o sea a partir de ese header: reescribirlo al
  // destino hacía que el detalle de un reporte devolviera
  // `http://django:8000/media/...`, un host que solo existe dentro de la red de
  // Docker. El navegador no lo resuelve y la foto quedaba en gris.
  //
  // Preservarlo es además lo que hace verdadera la frase de arriba: un solo
  // origen de punta a punta. Requiere que el `Host` del navegador esté en el
  // `ALLOWED_HOSTS` de Django — en local es `DJANGO_ALLOWED_HOSTS`, que ya
  // existe para el mismo tipo de caso (probar desde un dispositivo en la LAN).

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      restoreMocks: true,
    },
    server: {
      host: true,
      port: 5173,
      // Bind mounts do not always deliver inotify events (macOS/Windows Docker);
      // set VITE_USE_POLLING=true there to keep hot reload working.
      watch:
        env.VITE_USE_POLLING === 'true'
          ? { usePolling: true, interval: 300 }
          : undefined,
      proxy: {
        '/api': { target: proxyTarget },
        '/_allauth': { target: proxyTarget },
        // Las fotos de los reportes: las sirve Django en desarrollo.
        '/media': { target: proxyTarget },
        // El enlace para compartir un reporte (US-030): lo responde Django con
        // la vista previa para las redes y redirige a `/reporte/<token>`. Con
        // `^` es una expresión regular: `'/r'` a secas, como prefijo, también
        // se llevaría `/reportes`.
        '^/r/': { target: proxyTarget },
      },
    },
  }
})
