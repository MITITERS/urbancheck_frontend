import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * N-18: el nginx que sirve el panel en producción no corre como root. La
 * imagen sin privilegios escucha en 8080, porque un usuario común no puede
 * abrir puertos por debajo de 1024; Traefik apunta ahí.
 */
const read = (path: string) => readFileSync(resolve(__dirname, '../..', path), 'utf8')

describe('nginx del panel sin privilegios', () => {
  it('la etapa runtime usa nginx-unprivileged con versión fija', () => {
    const runtime = read('Dockerfile').match(/^FROM (\S+) AS runtime$/m)?.[1] ?? ''
    expect(runtime).toMatch(/^nginxinc\/nginx-unprivileged:\d+\.\d+\.\d+-alpine$/)
  })

  it('escucha en 8080 y lo declara', () => {
    expect(read('compose/nginx/default.conf.template')).toMatch(/^\s*listen 8080;$/m)
    expect(read('Dockerfile')).toMatch(/^EXPOSE 8080$/m)
  })
})
