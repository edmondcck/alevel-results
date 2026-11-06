import { ExternalLink, RotateCcw } from "lucide-react"
import { useMemo, useState } from "react"
import { IndicatorPicker } from "@/components/ColumnSelect"
import { FaithSelect } from "@/components/FaithSelect"
import { Field } from "@/components/Field"
import { LaMultiSelect, NearMeButton } from "@/components/LaMultiSelect"
import { MetricLineChart } from "@/components/MetricLineChart"
import { PageHero } from "@/components/PageHero"
import { PupilGroupSelect } from "@/components/PupilGroupSelect"
import { SchoolTypeSelect } from "@/components/SchoolTypeSelect"
import { EmptyState, ErrorPanel } from "@/components/StatePanels"
import { Skeleton } from "@/components/ui/skeleton"
import { useMeta, useSchoolData } from "@/hooks/useEesData"
import { RELEASE_URL } from "@/lib/ees"
import {
  CUSTOM_CHART_DEFAULT_LABEL,
  INDICATOR_NOTES,
  indicatorTitle,
  NON_NUMERIC_INDICATOR_LABELS,
  periodLabel,
} from "@/lib/indicators"
import { ALL_PUPILS_KEY } from "@/lib/pupilGroups"
import { toSeries } from "@/lib/transform"
import { useFilters } from "@/providers/FiltersProvider"

const MAX_LINES = 20

export default function Dashboard() {
  const meta = useMeta()
  const {
    laIds,
    setLaIds,
    groupKeys,
    setGroupKeys,
    schoolTypes,
    setSchoolTypes,
    faiths,
    setFaiths,
    resetFilters,
    isFiltered,
  } = useFilters()
  const lookups = meta.data?.lookups
  const groups = useMemo(() => meta.data?.groups ?? [], [meta.data])

  const groupKey = groupKeys[0] ?? ALL_PUPILS_KEY
  const setGroupKey = (k: string) => setGroupKeys([k])
  const [customState, setCustom] = useState<string | null>(null)

  const headlineIds = useMemo(() => lookups?.defaultIndicatorIds ?? [], [lookups])
  const chartableIndicators = useMemo(
    () => (lookups?.indicators ?? []).filter((i) => !NON_NUMERIC_INDICATOR_LABELS.has(i.label)),
    [lookups],
  )
  const customId =
    customState ?? lookups?.indicatorByLabel.get(CUSTOM_CHART_DEFAULT_LABEL)?.id ?? headlineIds[0] ?? ""

  // Headline and custom data are fetched separately so changing the custom
  // indicator doesn't refetch the six headline charts.
  const headline = useSchoolData(laIds, headlineIds)
  const custom = useSchoolData(laIds, customId ? [customId] : [])

  const group = groups.find((g) => g.key === groupKey) ?? groups[0]

  const headlineSeries = useMemo(() => {
    if (!lookups || !headline.data || !group) return new Map()
    return new Map(
      headlineIds.map((id) => [
        id,
        toSeries(headline.data!, lookups, id, group, MAX_LINES, schoolTypes, faiths),
      ]),
    )
  }, [lookups, headline.data, group, headlineIds, schoolTypes, faiths])

  const customSeries = useMemo(
    () =>
      lookups && custom.data && group && customId
        ? toSeries(custom.data, lookups, customId, group, MAX_LINES, schoolTypes, faiths)
        : undefined,
    [lookups, custom.data, group, customId, schoolTypes, faiths],
  )

  const firstYear = lookups?.periods[0]?.period
  const lastYear = lookups?.periods.at(-1)?.period

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        eyebrow="16 to 19 · Trends"
        title={
          <>
            The <em className="text-primary italic">dashboard</em>
          </>
        }
        lede={
          firstYear && lastYear
            ? `How schools and colleges have performed from ${periodLabel(firstYear)} to ${periodLabel(lastYear)}. Each chart shows up to ${MAX_LINES} institutions, ranked best to worst on the latest year with published data.`
            : "Year-on-year trends in headline A-Level and 16 to 19 measures."
        }
      />

      {meta.isError ? (
        <ErrorPanel message={(meta.error as Error)?.message} onRetry={() => meta.refetch()} />
      ) : (
        <>
          <section
            aria-label="Dashboard filters"
            className="glass flex flex-col gap-3 rounded-3xl p-4 animate-rise [animation-delay:80ms] sm:p-5"
          >
            <div className="flex items-center justify-between">
              <span className="eyebrow text-muted-foreground">Filters</span>
              {isFiltered && (
                <button
                  type="button"
                  id="dashboard-reset-filters-btn"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" />
                  Reset filters
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {lookups ? (
                <>
                  <Field
                    label="Local authorities"
                    htmlFor="dashboard-la-select"
                    action={
                      <NearMeButton
                        id="dashboard-near-me-btn"
                        options={lookups.las}
                        onSelect={(id) => setLaIds([id])}
                      />
                    }
                  >
                    <LaMultiSelect id="dashboard-la-select" options={lookups.las} value={laIds} onChange={setLaIds} />
                  </Field>
                  <Field label="Pupil group / cohort" htmlFor="dashboard-group-select">
                    <PupilGroupSelect
                      id="dashboard-group-select"
                      groups={groups}
                      value={groupKey}
                      onChange={setGroupKey}
                    />
                  </Field>
                  <Field label="School type" htmlFor="dashboard-school-type-select">
                    <SchoolTypeSelect
                      id="dashboard-school-type-select"
                      value={schoolTypes}
                      onChange={setSchoolTypes}
                    />
                  </Field>
                  <Field label="Religious character" htmlFor="dashboard-faith-select">
                    <FaithSelect
                      id="dashboard-faith-select"
                      value={faiths}
                      onChange={setFaiths}
                    />
                  </Field>
                </>
              ) : (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-24 bg-foreground/5" />
                    <Skeleton className="h-10 w-full rounded-xl bg-foreground/5" />
                  </div>
                ))
              )}
            </div>
          </section>

          {laIds.length === 0 && lookups ? (
            <div className="glass rounded-3xl">
              <EmptyState>Choose at least one local authority to see charts.</EmptyState>
            </div>
          ) : headline.isError ? (
            <ErrorPanel message={(headline.error as Error)?.message} onRetry={() => headline.refetch()} />
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {(headlineIds.length ? headlineIds : ["a", "b", "c", "d", "e", "f"]).map((id, i) => {
                const ind = lookups?.indicatorById.get(id)
                return (
                  <MetricLineChart
                    key={id}
                    id={`chart-${i + 1}`}
                    style={{ animationDelay: `${120 + i * 60}ms` }}
                    title={lookups ? indicatorTitle(lookups, id) : ""}
                    subtitle={ind?.label}
                    indicator={ind}
                    series={headlineSeries.get(id)}
                    loading={!lookups || headline.isFetching}
                    note={ind ? INDICATOR_NOTES[ind.label] : undefined}
                  />
                )
              })}

              <MetricLineChart
                id="chart-custom"
                className="xl:col-span-2"
                style={{ animationDelay: "480ms" }}
                title="Explore any indicator"
                subtitle="Pick any numeric measure published in the dataset."
                indicator={lookups?.indicatorById.get(customId)}
                series={customSeries}
                loading={!lookups || custom.isFetching}
                note={
                  lookups?.indicatorById.get(customId)
                    ? INDICATOR_NOTES[lookups.indicatorById.get(customId)!.label]
                    : undefined
                }
                headerSlot={
                  lookups && (
                    <div className="max-w-xl">
                      <IndicatorPicker
                        id="custom-indicator-select"
                        indicators={chartableIndicators}
                        value={customId}
                        onChange={setCustom}
                      />
                    </div>
                  )
                }
              />
            </div>
          )}

          <footer className="flex justify-end px-1 text-xs text-muted-foreground">
            <a
              href={RELEASE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 underline-offset-2 hover:text-foreground hover:underline"
            >
              Source: DfE, 16 to 19 performance <ExternalLink className="size-3" />
            </a>
          </footer>
        </>
      )}
    </div>
  )
}
