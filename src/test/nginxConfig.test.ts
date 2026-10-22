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
