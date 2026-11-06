import { Info } from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import type { IndicatorMeta } from "@/lib/ees"
import { formatNumber } from "@/lib/format"
import { periodLabel } from "@/lib/indicators"
import type { SeriesResult } from "@/lib/transform"
import { cn } from "@/lib/utils"
import { seriesColor } from "@/lib/colors"
import { useTheme } from "@/providers/ThemeProvider"

interface Props {
  id: string
  title: string
  subtitle?: string
  indicator?: IndicatorMeta
  series?: SeriesResult
  loading?: boolean
  note?: string
  headerSlot?: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function MetricLineChart({
  id,
  title,
  subtitle,
  indicator,
  series,
  loading,
  note,
  headerSlot,
  className,
  style,
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const { theme } = useTheme()
  const schools = useMemo(() => series?.schools ?? [], [series])
  const colors = useMemo(
    () => new Map(schools.map((s, i) => [s.key, seriesColor(i, theme)])),
    [schools, theme],
  )
  const config = useMemo<ChartConfig>(() => {
    const c: ChartConfig = {}
    schools.forEach((s) => {
      c[s.key] = { label: s.name, color: colors.get(s.key) }
    })
    return c
  }, [schools, colors])

  const fmt = (v: number) => formatNumber(v, indicator)
  const rankYear = series?.rankPeriod ? periodLabel(series.rankPeriod) : undefined
  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <section
      id={id}
      style={style}
      className={cn(
        "glass group/card flex min-w-0 animate-rise flex-col rounded-3xl p-5 transition-shadow duration-300 hover:shadow-xl sm:p-6",
        className,
      )}
    >
      <header className="mb-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-tight font-medium">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {series && series.schools.length > 0 && (
            <span className="eyebrow shrink-0 rounded-full border border-glass-border bg-background/40 px-2.5 py-1 text-[0.6rem] text-muted-foreground">
              Top {series.schools.length}
              {series.totalSchools > series.schools.length ? ` of ${series.totalSchools}` : ""}
              {rankYear ? ` · ${rankYear}` : ""}
            </span>
          )}
        </div>
        {headerSlot}
        {note && (
          <p className="flex items-start gap-1.5 rounded-xl bg-terracotta/10 px-3 py-2 text-xs leading-snug text-foreground/80">
            <Info className="mt-px size-3.5 shrink-0 text-terracotta" />
            {note}
          </p>
        )}
      </header>

      {loading && !series ? (
        <Skeleton className="h-[300px] w-full rounded-2xl bg-foreground/5" />
      ) : schools.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
          No published data for this selection.
        </div>
      ) : (
        <>
          <ChartContainer
            config={config}
            className={cn("aspect-auto h-[300px] w-full transition-opacity", loading && "opacity-50")}
          >
            <LineChart data={series!.data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 6" />
              <XAxis
                dataKey="year"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                padding={{ left: 24, right: 24 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={52}
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => fmt(v)}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: "4 4" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const items = payload
                    .filter((p) => typeof p.value === "number")
                    .sort((a, b) => (b.value as number) - (a.value as number))
                  if (!items.length) return null
                  return (
                    <div className="glass-strong max-h-80 min-w-56 overflow-hidden rounded-xl p-3 text-xs">
                      <div className="mb-2 font-display text-sm font-semibold">{label}</div>
                      <ol className="grid gap-1">
                        {items.slice(0, 12).map((p) => (
                          <li
                            key={String(p.dataKey)}
                            className={cn(
                              "flex items-center gap-2",
                              hovered && hovered !== p.dataKey && "opacity-50",
                            )}
                          >
                            <span className="size-2 shrink-0 rounded-full" style={{ background: p.color }} />
                            <span className="max-w-44 truncate text-muted-foreground">
                              {config[String(p.dataKey)]?.label}
                            </span>
                            <span className="tabular ml-auto pl-3 font-medium">{fmt(p.value as number)}</span>
                          </li>
                        ))}
                      </ol>
                      {items.length > 12 && (
                        <div className="mt-1.5 text-muted-foreground">+{items.length - 12} more</div>
                      )}
                    </div>
                  )
                }}
              />
              {schools.map((s) => {
                const dim = hovered !== null && hovered !== s.key
                return (
                  <Line
                    key={s.key}
                    dataKey={s.key}
                    name={s.name}
                    type="monotone"
                    hide={hidden.has(s.key)}
                    stroke={colors.get(s.key)}
                    strokeWidth={hovered === s.key ? 3.5 : 2}
                    strokeOpacity={dim ? 0.15 : 1}
                    dot={{ r: 3.5, fill: colors.get(s.key), strokeWidth: 0, fillOpacity: dim ? 0.2 : 1 }}
                    activeDot={{ r: 5.5, strokeWidth: 2, stroke: "var(--background)" }}
                    connectNulls
                    isAnimationActive
                    animationDuration={700}
                  />
                )
              })}
            </LineChart>
          </ChartContainer>

          <ol className="mt-4 grid grid-cols-1 gap-x-4 gap-y-0.5 text-xs sm:grid-cols-2" aria-label="Legend">
            {schools.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  onMouseEnter={() => setHovered(s.key)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(s.key)}
                  onBlur={() => setHovered(null)}
                  onClick={() => toggle(s.key)}
                  aria-pressed={!hidden.has(s.key)}
                  title={`${s.name}${s.laName ? ` (${s.laName})` : ""}. Click to show/hide.`}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-all hover:bg-foreground/5",
                    hidden.has(s.key) && "opacity-40",
                  )}
                >
                  <span className="tabular w-4 shrink-0 text-right text-muted-foreground">{s.rank}</span>
                  <span
                    className="h-0.5 w-3.5 shrink-0 rounded-full"
                    style={{ background: colors.get(s.key) }}
                  />
                  <span className={cn("truncate", hidden.has(s.key) && "line-through")}>{s.name}</span>
                  <span className="tabular ml-auto shrink-0 font-medium">{fmt(s.latestValue)}</span>
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
