import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { messages } from '@/config/messages'
import { formatDuration, formatHours, toDateOnly } from '@/lib/format'
import { renderWithProviders } from '@/test/renderWithProviders'
import { rangeError } from './hooks/useStatisticsPeriod'
import { StatisticsView } from './StatisticsView'
import { exportStatisticsPdf } from './pdf/exportStatisticsPdf'
import type { Indicators, Statistics } from './types'

vi.mock('./pdf/exportStatisticsPdf', () => ({ exportStatisticsPdf: vi.fn() }))

const t = messages.statistics
type RequestConfig = Parameters<typeof apiClient.get>[1]

function statistics(overrides: Partial<Statistics> = {}): Statistics {
  return {
    period: { key: '30d', start: '2026-09-21', end: '2026-10-20' },
    total: 4,
    by_category: [
      { key: 'bache', label: 'Bache', count: 3, percentage: 75 },
      { key: 'alumbrado', label: 'Alumbrado', count: 1, percentage: 25 },
    ],
    by_status: [
      { key: 'reportado', label: 'Reportado', count: 4, percentage: 100 },
      { key: 'archivado', label: 'Archivado', count: 0, percentage: 0 },
    ],
    indicators: indicators(),
    ...overrides,
  }
}

function indicators(overrides: Partial<Indicators> = {}): Indicators {
  const none = { avg_seconds: null, sample_size: 0 }
  return {
    validation: {
      overall: { avg_seconds: 50 * 3600, sample_size: 3 },
      field: { avg_seconds: 6 * 3600, sample_size: 1 },
      collective: { avg_seconds: 72 * 3600, sample_size: 2 },
    },
    assignment: { avg_seconds: 8 * 3600, sample_size: 2 },
    resolution: none,
    open: [
      {
        status: 'en_proceso',
        label: 'En proceso',
        count: 2,
        oldest_since: '2026-09-25T09:00:00Z',
        oldest_age_seconds: 25 * 86400,
      },
    ],
    appealed_closures: {
      closures: 4,
      appealed: 1,
      percentage: 25,
      alert_threshold: 20,
      above_threshold: true,
    },
    cancellations: { field_rejection: 2, moderation: 1, municipal: 0 },
    archived_by_inactivity: 3,
    ...overrides,
  }
}

function stubApi(data: Statistics = statistics()) {
  return vi.spyOn(apiClient, 'get').mockImplementation(async () => ({ data }) as never)
}

function paramsOf(spy: ReturnType<typeof stubApi>, call = -1) {
  const calls = spy.mock.calls
  const [url, config] = calls.at(call) as [string, RequestConfig]
  return { url, params: config?.params as Record<string, string> }
}

beforeEach(() => {
  stubApi()
})

describe('StatisticsView', () => {
  it('CP-023-P01 (US-023 E5) · sin elegir nada pide los últimos 30 días y lo dice', async () => {
    const get = stubApi()
    renderWithProviders(<StatisticsView title="Estadísticas" />, {
      route: '/estadisticas',
    })

    expect(
      await screen.findByText(new RegExp(t.activeWindow('21/09/2026', '20/10/2026'))),
    ).toBeInTheDocument()
    expect(paramsOf(get)).toEqual({
      url: endpoints.statistics.panel,
      params: { period: '30d' },
    })
  })

  it('CP-023-P02 (US-023 E1, E2) · cada categoría y estado muestra el valor absoluto y el porcentaje', async () => {
    renderWithProviders(<StatisticsView title="Estadísticas" />, {
      route: '/estadisticas',
    })

    const categories = await screen.findByRole('group', { name: t.byCategory })
    const bache = within(categories).getByText('Bache').closest('li')!
    expect(within(bache).getByText('3')).toBeInTheDocument()
    expect(within(bache).getByText(t.percent(75))).toBeInTheDocument()
    const statuses = screen.getByRole('group', { name: t.byStatus })
    // Los siete estados, también los que están en cero.
    const archived = within(statuses).getByText('Archivado').closest('li')!
    expect(within(archived).getByText('0')).toBeInTheDocument()
    expect(within(statuses).getByText(t.groupOut)).toBeInTheDocument()
  })

  it('CP-023-P03 (US-023 E11) · la URL conserva el período elegido', async () => {
    const get = stubApi()
    renderWithProviders(<StatisticsView title="Estadísticas" />, {
      route: '/estadisticas?period=custom&start=2026-05-01&end=2026-05-31',
    })

    await waitFor(() =>
      expect(paramsOf(get).params).toEqual({
        period: 'custom',
        start: '2026-05-01',
        end: '2026-05-31',
      }),
    )
  })

  it('CP-023-P04 (US-023 E6) · un rango en la URL que es inválido cae al default', async () => {
    const get = stubApi()
    renderWithProviders(<StatisticsView title="Estadísticas" />, {
      route: '/estadisticas?period=custom&start=2026-06-10&end=2026-06-01',
    })

    await waitFor(() => expect(paramsOf(get).params).toEqual({ period: '30d' }))
  })

  it('CP-023-P05 (US-023 E7) · un período sin reportes muestra el vacío y ningún gráfico', async () => {
    stubApi(statistics({ total: 0 }))
    renderWithProviders(<StatisticsView title="Estadísticas" />, {
      route: '/estadisticas',
    })

    expect(await screen.findByText(t.empty)).toBeInTheDocument()
    expect(screen.queryByRole('figure')).toBeNull()
  })

  it('CP-023-P06 (US-023 E9) · el admin pregunta por la municipalidad de la ficha', async () => {
    const get = stubApi()
    renderWithProviders(<StatisticsView title="Estadísticas" municipalityId={3} />, {
      route: '/municipalidades/3/estadisticas?period=7d',
    })

    await waitFor(() =>
      expect(paramsOf(get)).toEqual({
        url: endpoints.municipalities.statistics(3),
        params: { period: '7d' },
      }),
    )
  })

  it('CP-023-P07 (US-023 E3, E4) · el selector ofrece los cuatro períodos y aplica uno fijo al elegirlo', async () => {
    const get = stubApi()
    const user = userEvent.setup()
    renderWithProviders(<StatisticsView title="Estadísticas" />, {
      route: '/estadisticas',
    })
    await screen.findByRole('group', { name: t.byCategory })

    await user.click(screen.getByRole('combobox', { name: t.periodLabel }))
    const options = screen.getAllByRole('option').map((option) => option.textContent)
    expect(options).toEqual([
      t.periods['7d'],
      t.periods['30d'],
      t.periods['12m'],
      t.periods.custom,
    ])
    await user.click(screen.getByRole('option', { name: t.periods['12m'] }))

    await waitFor(() => expect(paramsOf(get).params).toEqual({ period: '12m' }))
  })

  it('CP-023-P06 (US-023 E6) · el calendario del rango no ofrece días futuros', async () => {
    const user = userEvent.setup()
    const today = toDateOnly(new Date())
    renderWithProviders(<StatisticsView title="Estadísticas" />, {
      route: `/estadisticas?period=custom&start=${today}&end=${today}`,
    })

    await waitFor(() =>
      expect(document.getElementById('statistics-end')).not.toBeNull(),
    )
    await user.click(document.getElementById('statistics-end')!)
    const days = document.querySelectorAll<HTMLElement>('td[data-day]')
    expect(days.length).toBeGreaterThan(0)
    for (const day of days) {
      const future = day.dataset.day! > today
      expect(day.hasAttribute('data-disabled'), day.dataset.day).toBe(future)
    }
  })

  it('el botón exporta a PDF el período que se está viendo', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <StatisticsView title="Estadísticas" municipalityName="Villa María (Córdoba)" />,
      { route: '/estadisticas' },
    )

    const button = await screen.findByRole('button', { name: t.export })
    await waitFor(() => expect(button).toBeEnabled())
    await user.click(button)

    expect(exportStatisticsPdf).toHaveBeenCalledWith(
      statistics(),
      'Villa María (Córdoba)',
    )
  })

  it('cada tarjeta tiene una ayuda corta que se abre al tocar el ícono', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StatisticsView title="Estadísticas" />, {
      route: '/estadisticas',
    })

    const cards = [
      [t.stages, t.help.stages],
      [t.open, t.help.open],
      [t.appealed, t.help.appealed],
      [t.exits, t.help.exits],
      [t.byCategory, t.help.byCategory],
      [t.byStatus, t.help.byStatus],
    ]
    for (const [card, text] of cards) {
      await user.click(await screen.findByRole('button', { name: t.help.label(card) }))
      expect(await screen.findByText(text)).toBeInTheDocument()
      await user.keyboard('{Escape}')
    }
  })
})

describe('indicadores de gestión (US-050)', () => {
  it('CP-050-P01 (US-050 E1-E4, E11) · los tres tiempos, en orden, con su muestra', async () => {
    renderWithProviders(<StatisticsView title="Estadísticas" />, {
      route: '/estadisticas',
    })

    await screen.findByRole('group', { name: t.validation })
    const named = screen
      .getAllByRole('group')
      .map((group) => group.getAttribute('aria-label'))
      .filter(Boolean)
    expect(named.slice(0, 3)).toEqual([t.validation, t.assignment, t.resolution])
    const validation = screen.getByRole('group', { name: t.validation })
    expect(within(validation).getByText('50 hs')).toBeInTheDocument()
    expect(within(validation).getByText(t.sample(3))).toBeInTheDocument()
    const assignment = screen.getByRole('group', { name: t.assignment })
    expect(within(assignment).getByText('8 hs')).toBeInTheDocument()
  })

  it('CP-050-P02 (US-050 E10) · sin casos dice que no hay, no muestra cero', async () => {
    renderWithProviders(<StatisticsView title="Estadísticas" />, {
      route: '/estadisticas',
    })

    const resolution = await screen.findByRole('group', { name: t.resolution })
    expect(within(resolution).getByText(t.noCases)).toBeInTheDocument()
  })

  it('CP-050-P03 (US-050 E5) · los abiertos se muestran aparte, con el más viejo', async () => {
    renderWithProviders(<StatisticsView title="Estadísticas" />, {
      route: '/estadisticas',
    })

    const open = await screen.findByRole('group', { name: t.open })
    expect(within(open).getByText(t.oldest('25 días'))).toBeInTheDocument()
  })

  it('CP-050-P04 (US-050 E6) · los cierres apelados se destacan sobre el umbral', async () => {
    renderWithProviders(<StatisticsView title="Estadísticas" />, {
      route: '/estadisticas',
    })

    const appealed = await screen.findByRole('group', { name: t.appealed })
    expect(within(appealed).getByText('25 %')).toBeInTheDocument()
    expect(within(appealed).getByText(t.appealedAlert(20))).toBeInTheDocument()
  })

  it('CP-050-P05 (US-050 E7, E8) · cancelaciones por origen y archivados por separado', async () => {
    renderWithProviders(<StatisticsView title="Estadísticas" />, {
      route: '/estadisticas',
    })

    const exits = await screen.findByRole('group', { name: t.exits })
    const rowOf = (label: string) => within(exits).getByText(label).closest('div')!
    expect(
      within(rowOf(t.cancellationsFieldRejection)).getByText('2'),
    ).toBeInTheDocument()
    expect(within(rowOf(t.cancellationsModeration)).getByText('1')).toBeInTheDocument()
    // E8: los archivados tienen su propia fila, no se suman a las cancelaciones.
    expect(within(rowOf(t.archived)).getByText('3')).toBeInTheDocument()
  })

  it('CP-050-P06 (US-050 E9) · se muestran aunque el período no tenga reportes creados', async () => {
    stubApi(statistics({ total: 0 }))
    renderWithProviders(<StatisticsView title="Estadísticas" />, {
      route: '/estadisticas',
    })

    expect(await screen.findByRole('group', { name: t.assignment })).toBeInTheDocument()
    expect(screen.getByText(t.empty)).toBeInTheDocument()
  })
})

describe('formatHours (US-050 E11, decisión del usuario)', () => {
  it('los promedios siempre en horas', () => {
    expect(formatHours(30 * 60)).toBe('30 min')
    expect(formatHours(5.5 * 3600)).toBe('5,5 hs')
    expect(formatHours(72 * 3600)).toBe('72 hs')
    expect(formatHours(1234.4 * 3600)).toBe('1.234 hs')
  })
})

describe('formatDuration (US-050 E11)', () => {
  it('horas por debajo del día y días por encima', () => {
    expect(formatDuration(30 * 60)).toBe('30 min')
    expect(formatDuration(5.5 * 3600)).toBe('5,5 h')
    expect(formatDuration(86400)).toBe('1 día')
    expect(formatDuration(3 * 86400)).toBe('3 días')
  })
})

describe('rangeError (US-023 E6)', () => {
  const today = new Date(2026, 9, 20)

  it('CP-023-P08 · rechaza el inicio posterior al fin', () => {
    expect(rangeError('2026-06-10', '2026-06-01', today)).toBe(t.rangeInverted)
  })

  it('CP-023-P09 · rechaza las fechas futuras', () => {
    expect(rangeError('2026-10-01', '2026-10-21', today)).toBe(t.rangeFuture)
  })

  it('CP-023-P10 · pide las dos fechas', () => {
    expect(rangeError('2026-10-01', '', today)).toBe(t.rangeIncomplete)
  })

  it('acepta un rango válido que termina hoy', () => {
    expect(rangeError('2026-10-01', '2026-10-20', today)).toBeNull()
  })
})
