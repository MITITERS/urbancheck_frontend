import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * C-16: Dependabot abre sus PR contra `develop`. `main` recibe solo releases;
 * un PR de dependencias contra `main` se saltea `develop` y su CI.
 */
const config = readFileSync(resolve(__dirname, '../../.github/dependabot.yml'), 'utf8')

describe('dependabot', () => {
  it('cada ecosistema apunta a develop', () => {
    const ecosystems = config.match(/- package-ecosystem:/g) ?? []
    const targets = config.match(/^\s+target-branch: 'develop'$/gm) ?? []

    expect(ecosystems.length).toBeGreaterThan(0)
    expect(targets).toHaveLength(ecosystems.length)
  })
})
