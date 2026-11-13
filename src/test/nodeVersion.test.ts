import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * C-17: una sola versión de Node en todos lados. El CI usaba 22 y la imagen de
 * Docker 20, así que lo que pasaba en el CI no era lo que se construía.
 */
const read = (path: string) => readFileSync(resolve(__dirname, '../..', path), 'utf8')

const MAJOR = read('.nvmrc').trim()

describe('versión de Node', () => {
  it('.nvmrc fija una versión mayor', () => {
    expect(MAJOR).toMatch(/^\d+$/)
  })

  it('el CI usa la de .nvmrc', () => {
    expect(read('.github/workflows/ci.yml')).toContain("node-version-file: '.nvmrc'")
  })

  it('cada etapa de Node del Dockerfile usa la misma', () => {
    const images = read('Dockerfile').match(/^FROM node:\S+/gm) ?? []
    expect(images.length).toBeGreaterThan(0)
    for (const image of images) expect(image).toBe(`FROM node:${MAJOR}-alpine`)
  })

  it('package.json la declara en engines', () => {
    const engines = JSON.parse(read('package.json')).engines?.node ?? ''
    expect(engines).toMatch(
      new RegExp(`>=${MAJOR}\\.\\d+\\.\\d+ <${Number(MAJOR) + 1}`),
    )
  })
})
