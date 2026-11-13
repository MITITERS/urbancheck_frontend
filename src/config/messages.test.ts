import { describe, expect, it } from 'vitest'
import { messages } from './messages'

describe('textos del panel (C-18)', () => {
  it('no le promete al validador dado de baja que sigue como vecino', () => {
    // Una cuenta de trabajo no participa como ciudadano, activa o no
    // (`User.participates_as_citizen` en el backend).
    const text = messages.validators.deactivateDescription

    expect(text).not.toMatch(/ciudadano común/)
    expect(text).toMatch(/no puede usarla como vecino/)
  })

  it('no fija el plazo de dato personal, que es configurable', () => {
    // PERSONAL_DATA_REVIEW_MINUTES en el backend; cada fila muestra su plazo.
    expect(messages.moderation.description).not.toMatch(/\d+\s*horas/)
  })
})
