import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * El nginx de producción del panel (`compose/nginx/default.conf.template`).
 *
 * Detrás de Traefik el TLS termina antes: nginx recibe `http`, y si le pasa a
 * Django `X-Forwarded-Proto: $scheme`, Django cree que la conexión no es segura
 * y, con `SECURE_SSL_REDIRECT`, redirige a https una y otra vez (C-04).
 */
const template = readFileSync(
  resolve(__dirname, '../../compose/nginx/default.conf.template'),
  'utf8',
)

function locations(): Record<string, string> {
  const blocks: Record<string, string> = {}
  for (const match of template.matchAll(/location\s+(=\s+)?(\S+)\s*\{([^}]*)\}/g)) {
    blocks[match[2]] = match[3]
  }
  return blocks
}

describe('nginx del panel', () => {
  it('reenvía a Django el esquema con el que llegó el pedido a Traefik', () => {
    for (const [path, body] of Object.entries(locations())) {
      if (!body.includes('X-Forwarded-Proto')) continue
      expect(body, path).not.toMatch(/X-Forwarded-Proto\s+\$scheme;/)
      expect(body, path).toMatch(/X-Forwarded-Proto\s+\$forwarded_proto;/)
    }
    expect(template).toMatch(/map\s+\$http_x_forwarded_proto\s+\$forwarded_proto/)
  })
})

/**
 * Cabeceras de seguridad (C-05). Viven en un fragmento aparte porque nginx no
 * hereda `add_header`: un `location` que agrega una cabecera propia (la caché de
 * `/assets/` y de `index.html`) pierde las del `server` si no lo incluye.
 */
const headers = readFileSync(
  resolve(__dirname, '../../compose/nginx/security-headers.conf'),
  'utf8',
)
const dockerfile = readFileSync(resolve(__dirname, '../../Dockerfile'), 'utf8')

function header(name: string): string | undefined {
  const match = headers.match(
    new RegExp(`add_header\\s+${name}\\s+"([^"]+)"\\s+always;`),
  )
  return match?.[1]
}

describe('cabeceras de seguridad del panel', () => {
  it('la imagen copia el fragmento y cada bloque con add_header lo incluye', () => {
    expect(dockerfile).toMatch(
      /COPY compose\/nginx\/security-headers\.conf \/etc\/nginx\/snippets\/security-headers\.conf/,
    )
    const include = /include \/etc\/nginx\/snippets\/security-headers\.conf;/
    const server = template.slice(template.indexOf('server {'))
    expect(server.split('location')[0]).toMatch(include)
    for (const [path, body] of Object.entries(locations())) {
      if (body.includes('add_header')) expect(body, path).toMatch(include)
    }
  })

  it('declara la política de contenido, por ahora solo para informar', () => {
    expect(header('Content-Security-Policy')).toBeUndefined()
    const csp = header('Content-Security-Policy-Report-Only')
    expect(csp).toBeDefined()
    expect(csp).not.toMatch(/script-src[^;]*unsafe/)
    for (const directive of [
      "default-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ]) {
      expect(csp).toContain(directive)
    }
  })

  it('no deja que el navegador adivine tipos ni filtre la URL completa', () => {
    expect(header('X-Content-Type-Options')).toBe('nosniff')
    expect(header('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  })

  it('apaga la ubicación, la cámara y el micrófono, que el panel no usa', () => {
    const policy = header('Permissions-Policy')
    expect(policy).toContain('geolocation=()')
    expect(policy).toContain('camera=()')
    expect(policy).toContain('microphone=()')
  })
})
