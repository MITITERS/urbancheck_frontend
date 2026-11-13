import { describe, expect, it } from 'vitest'
import { shortAddress, streetAddress } from '../format'

describe('shortAddress', () => {
  it('corta la cola administrativa que agrega el geocodificador', () => {
    const full =
      'Banco Patagonia, 1145, Santa Fe, Centro, Villa María, Municipio de Villa María, Pedanía Villa María, Departamento General San Martín, Córdoba, X5900, Argentina'

    expect(shortAddress(full)).toBe('Banco Patagonia, 1145, Santa Fe')
  })

  it('deja intacta una dirección corta', () => {
    expect(shortAddress('buenos aires 1200 villa maría')).toBe(
      'buenos aires 1200 villa maría',
    )
  })

  it('normaliza los espacios entre tramos', () => {
    expect(shortAddress('Calle 1,  2 ,Barrio')).toBe('Calle 1, 2, Barrio')
  })

  it('sin dirección devuelve vacío', () => {
    expect(shortAddress(null)).toBe('')
    expect(shortAddress('')).toBe('')
  })
})

describe('streetAddress', () => {
  it('pone el número detrás de la calle', () => {
    expect(
      streetAddress(
        '527, Corrientes, Centro, Villa María, Municipio de Villa María, Córdoba, 5900, Argentina',
      ),
    ).toBe('Corrientes 527')
  })

  it('saltea el nombre del lugar que va adelante', () => {
    expect(
      streetAddress('Banco Patagonia, 1145, Santa Fe, Centro, Villa María, Argentina'),
    ).toBe('Santa Fe 1145')
  })

  it('sin número deja el primer tramo', () => {
    expect(streetAddress('Corrientes, Centro, Villa María')).toBe('Corrientes')
    expect(streetAddress('Frente a la plaza')).toBe('Frente a la plaza')
  })

  it('vacío devuelve vacío', () => {
    expect(streetAddress('')).toBe('')
    expect(streetAddress(null)).toBe('')
  })
})
