import { Cell, Label, Pie, PieChart } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { messages } from '@/config/messages'
import type { ReportCategory } from '@/features/reports/types'
import type { DistributionBucket } from '../types'
import { CATEGORY_COLOR } from './colors'

const t = messages.statistics

/**
 * La distribución por categoría como dona (US-023, escenario 1).
 *
 * El total va en el centro y la leyenda al costado lleva, por categoría, el
 * valor absoluto **y** el porcentaje: un porcentaje sobre un total chico
 * induce a error si no se ve el total. Las categorías en cero no dibujan
 * porción, pero siguen en la leyenda, así la forma no cambia entre períodos.
 */
export function CategoryDonut({
  rows,
  total,
}: {
  rows: DistributionBucket<ReportCategory>[]
  total: number
}) {
  const config = Object.fromEntries(
    rows.map((row) => [row.key, { label: row.label, color: CATEGORY_COLOR[row.key] }]),
  ) satisfies ChartConfig
  const slices = rows.filter((row) => row.count > 0)

  return (
    <div
      role="group"
      aria-label={t.byCategory}
      className="grid w-full items-center gap-8 sm:grid-cols-[260px_minmax(0,1fr)]"
    >
      <ChartContainer
        config={config}
        className="mx-auto aspect-square w-full max-w-[260px]"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent nameKey="key" hideLabel />}
          />
          <Pie
            data={slices}
            dataKey="count"
            nameKey="key"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={slices.length > 1 ? 2 : 0}
            cornerRadius={6}
            strokeWidth={0}
            isAnimationActive={false}
          >
            {slices.map((row) => (
              <Cell key={row.key} fill={CATEGORY_COLOR[row.key]} />
            ))}
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !('cx' in viewBox)) return null
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground font-heading text-3xl font-semibold"
                    >
                      {total}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 22}
                      className="fill-muted-foreground text-xs"
                    >
                      {t.reports(total)}
                    </tspan>
                  </text>
                )
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/60"
          >
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: CATEGORY_COLOR[row.key] }}
            />
            <span className="flex-1 truncate">{row.label}</span>
            <span className="font-semibold tabular-nums">{row.count}</span>
            <span className="w-14 text-right text-xs text-muted-foreground tabular-nums">
              {t.percent(row.percentage)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
