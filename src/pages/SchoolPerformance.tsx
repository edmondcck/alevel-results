import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Info, RotateCcw } from "lucide-react"
import { useMemo } from "react"
import { ColumnSelect } from "@/components/ColumnSelect"
import { FaithSelect } from "@/components/FaithSelect"
import { Field } from "@/components/Field"
import { LaMultiSelect, NearMeButton } from "@/components/LaMultiSelect"
import { PageHero } from "@/components/PageHero"
import { PupilGroupMultiSelect } from "@/components/PupilGroupSelect"
import { SchoolTypeSelect } from "@/components/SchoolTypeSelect"
import { EmptyState, ErrorPanel, LoadingBar } from "@/components/StatePanels"
import { YearSelect } from "@/components/YearSelect"
import { Skeleton } from "@/components/ui/skeleton"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useMeta, useSchoolData } from "@/hooks/useEesData"
import { RELEASE_URL } from "@/lib/ees"
import { formatCell, SPECIAL_VALUE_INFO } from "@/lib/format"
import {
  APS_PER_ENTRY_LABEL,
  COMPANION_GRADE_LABELS,
  INDICATOR_NOTES,
  indicatorTitle,
  periodLabel,
} from "@/lib/indicators"
import { ALL_PUPILS_KEY } from "@/lib/pupilGroups"
import { matchesFaith, matchesSchoolType } from "@/lib/schoolInfo"
import { toTableRows, type SortState } from "@/lib/transform"
import { cn } from "@/lib/utils"
import { useFilters } from "@/providers/FiltersProvider"

export default function SchoolPerformance() {
  const meta = useMeta()
  const {
    laIds,
    setLaIds,
    schoolTypes,
    setSchoolTypes,
    faiths,
    setFaiths,
    groupKeys,
    setGroupKeys,
    periodState,
    setPeriod,
    columnsState,
    setColumns,
    sortState,
    setSort,
    resetFilters,
    resetColumns,
    isColumnsModified,
    isFiltered,
  } = useFilters()
  const lookups = meta.data?.lookups
  const groups = useMemo(() => meta.data?.groups ?? [], [meta.data])

  const period = periodState ?? lookups?.periods.at(-1)?.period ?? ""
  const columns = useMemo(
    () => columnsState ?? lookups?.defaultIndicatorIds ?? [],
    [columnsState, lookups],
  )
  const apsId = lookups?.indicatorByLabel.get(APS_PER_ENTRY_LABEL)?.id ?? columns[0]
  const sort = useMemo<SortState>(
    () => sortState ?? { indicatorId: apsId, dir: "desc" },
    [sortState, apsId],
  )

  // Fetch companion grade columns (e.g. APS per entry (grade)) alongside numeric APS scores
  const companionIds = useMemo(() => {
    if (!lookups) return []
    const ids: string[] = []
    for (const colId of columns) {
      const ind = lookups.indicatorById.get(colId)
      const gradeLabel = ind ? COMPANION_GRADE_LABELS[ind.label] : undefined
      const gradeInd = gradeLabel ? lookups.indicatorByLabel.get(gradeLabel) : undefined
      if (gradeInd) ids.push(gradeInd.id)
    }
    return ids
  }, [columns, lookups])

  // Always fetch the sort column and companion grade columns too
  const fetchIds = useMemo(
    () => [...new Set([...columns, sort.indicatorId, ...companionIds].filter(Boolean))],
    [columns, sort.indicatorId, companionIds],
  )
  const data = useSchoolData(laIds, fetchIds, period || undefined)

  const selectedGroups = useMemo(
    () => groupKeys.map((k) => groups.find((g) => g.key === k)).filter((g) => !!g),
    [groupKeys, groups],
  )

  const rows = useMemo(
    () =>
      lookups && data.data
        ? toTableRows(data.data, lookups, selectedGroups, fetchIds, sort)
        : [],
    [lookups, data.data, selectedGroups, fetchIds, sort],
  )

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (!matchesSchoolType(r.schoolType, schoolTypes)) return false
      if (!matchesFaith(r.religion, r.isFaithSchool, faiths)) return false
      return true
    })
  }, [rows, schoolTypes, faiths])

  const schoolCount = filteredRows.filter((r) => r.isFirstOfSchool).length
  const ranks = useMemo(() => {
    let n = 0
    return filteredRows.map((r) => (r.isFirstOfSchool ? ++n : null))
  }, [filteredRows])
  const multiGroup = selectedGroups.length > 1

  const onSort = (indicatorId: string) =>
    setSort((prev) => {
      const cur = prev ?? sort
      return cur.indicatorId === indicatorId
        ? { indicatorId, dir: cur.dir === "desc" ? "asc" : "desc" }
        : { indicatorId, dir: "desc" }
    })

  const laNames = laIds.map((id) => lookups?.laById.get(id)?.label).filter(Boolean)

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        eyebrow="16 to 19 · Performance tables"
        title={
          <>
            School <em className="text-primary italic">performance</em>
          </>
        }
        lede={
          lookups && period
            ? `Headline A-Level and 16 to 18 measures for ${schoolCount || "—"} schools & colleges in ${
                laNames.length ? listFormat(laNames as string[]) : "no selected area"
              }, ${periodLabel(period)}.`
            : "Headline A-Level and 16 to 18 measures for schools and colleges in England."
        }
      />

      {meta.isError ? (
        <ErrorPanel message={(meta.error as Error)?.message} onRetry={() => meta.refetch()} />
      ) : (
        <>
          {/* Controls */}
          <section
            aria-label="Table filters"
            className="glass flex flex-col gap-3 rounded-3xl p-4 animate-rise [animation-delay:80ms] sm:p-5"
          >
            <div className="flex items-center justify-between">
              <span className="eyebrow text-muted-foreground">Filters</span>
              <div className="flex items-center gap-2">
                {isFiltered && (
                  <button
                    type="button"
                    id="reset-filters-btn"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                  >
                    <RotateCcw className="size-3.5" />
                    Reset filters
                  </button>
                )}
                {isColumnsModified && (
                  <button
                    type="button"
                    id="reset-columns-btn"
                    onClick={resetColumns}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                  >
                    <RotateCcw className="size-3.5" />
                    Reset columns
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {lookups ? (
                <>
                  <Field label="Year" htmlFor="year-select">
                    <YearSelect id="year-select" periods={lookups.periods} value={period} onChange={setPeriod} />
                  </Field>
                  <Field
                    label="Local authorities"
                    htmlFor="la-select"
                    action={
                      <NearMeButton
                        id="la-near-me-btn"
                        options={lookups.las}
                        onSelect={(id) => setLaIds([id])}
                      />
                    }
                  >
                    <LaMultiSelect id="la-select" options={lookups.las} value={laIds} onChange={setLaIds} />
                  </Field>
                  <Field label="Pupil groups & cohorts" htmlFor="group-select">
                    <PupilGroupMultiSelect
                      id="group-select"
                      groups={groups}
                      value={groupKeys}
                      onChange={setGroupKeys}
                    />
                  </Field>
                  <Field label="School type" htmlFor="school-type-select">
                    <SchoolTypeSelect id="school-type-select" value={schoolTypes} onChange={setSchoolTypes} />
                  </Field>
                  <Field label="Religious character" htmlFor="faith-select">
                    <FaithSelect id="faith-select" value={faiths} onChange={setFaiths} />
                  </Field>
                  <Field label="Columns" htmlFor="column-select">
                    <ColumnSelect
                      id="column-select"
                      indicators={lookups.indicators}
                      shortLabel={lookups.shortLabel}
                      value={columns}
                      defaults={lookups.defaultIndicatorIds}
                      onChange={setColumns}
                    />
                  </Field>
                </>
              ) : (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-20 bg-foreground/5" />
                    <Skeleton className="h-10 w-full rounded-xl bg-foreground/5" />
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Table */}
          <section
            aria-label="School performance table"
            className="glass relative animate-rise overflow-hidden rounded-3xl [animation-delay:160ms]"
          >
            <LoadingBar active={data.isFetching} />

            {data.isError ? (
              <ErrorPanel message={(data.error as Error)?.message} onRetry={() => data.refetch()} inline />
            ) : laIds.length === 0 && lookups ? (
              <EmptyState>Choose at least one local authority to see schools and colleges.</EmptyState>
            ) : (
              <div className="max-h-[calc(100dvh-11rem)] overflow-auto overscroll-contain" id="results-table">
                <table className="w-full caption-bottom border-separate border-spacing-0 text-sm">
                  <caption className="sr-only">
                    Schools ordered by {lookups ? indicatorTitle(lookups, sort.indicatorId) : "APS per entry"}
                  </caption>
                  <TableHeader className="[&_tr]:border-b-0">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="sticky top-0 left-0 z-20 w-12 border-b bg-[var(--glass-strong)] px-4 text-right backdrop-blur-xl">
                        <span className="eyebrow text-muted-foreground">#</span>
                      </TableHead>
                      <TableHead className="sticky top-0 left-12 z-20 min-w-64 border-b border-r border-border/50 bg-[var(--glass-strong)] px-3 backdrop-blur-xl">
                        <span className="eyebrow text-muted-foreground">School / College</span>
                      </TableHead>
                      {lookups &&
                        columns.map((id) => {
                          const ind = lookups.indicatorById.get(id)
                          const isShort = lookups.shortLabel.has(id)
                          const note = ind ? INDICATOR_NOTES[ind.label] : undefined
                          const active = sort.indicatorId === id
                          return (
                            <TableHead
                              key={id}
                              aria-sort={active ? (sort.dir === "desc" ? "descending" : "ascending") : "none"}
                              className="sticky top-0 z-10 h-auto border-b bg-[var(--glass-strong)] px-3 py-2.5 text-right align-bottom backdrop-blur-xl"
                            >
                              <div className="flex items-end justify-end gap-1">
                                {note && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button type="button" aria-label="About this measure" className="mb-0.5 text-terracotta">
                                        <Info className="size-3.5" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-72">{note}</TooltipContent>
                                  </Tooltip>
                                )}
                                <button
                                  type="button"
                                  id={`sort-${id}`}
                                  onClick={() => onSort(id)}
                                  title={ind?.label}
                                  className={cn(
                                    "group/sort flex items-end gap-1 text-right transition-colors",
                                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "font-semibold",
                                      isShort
                                        ? "text-[0.8rem] whitespace-nowrap"
                                        : "line-clamp-3 max-w-40 text-[0.7rem] leading-tight whitespace-normal",
                                    )}
                                  >
                                    {indicatorTitle(lookups, id)}
                                  </span>
                                  {active ? (
                                    sort.dir === "desc" ? (
                                      <ArrowDown className="mb-0.5 size-3.5 shrink-0 text-primary" />
                                    ) : (
                                      <ArrowUp className="mb-0.5 size-3.5 shrink-0 text-primary" />
                                    )
                                  ) : (
                                    <ArrowUpDown className="mb-0.5 size-3.5 shrink-0 opacity-0 transition-opacity group-hover/sort:opacity-60" />
                                  )}
                                </button>
                              </div>
                            </TableHead>
                          )
                        })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!data.data || !lookups
                      ? Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={i} className="hover:bg-transparent">
                            <TableCell className="px-4">
                              <Skeleton className="ml-auto h-4 w-5 bg-foreground/5" />
                            </TableCell>
                            <TableCell className="px-3 py-3">
                              <Skeleton className="h-4 w-56 bg-foreground/5" />
                              <Skeleton className="mt-1.5 h-3 w-28 bg-foreground/5" />
                            </TableCell>
                            {(columns.length ? columns : [1, 2, 3, 4, 5, 6]).map((c) => (
                              <TableCell key={String(c)} className="px-3">
                                <Skeleton className="ml-auto h-4 w-12 bg-foreground/5" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      : filteredRows.map((row, i) => {
                          const lastOfSchool = !filteredRows[i + 1] || filteredRows[i + 1].isFirstOfSchool
                          return (
                            <TableRow
                              key={row.key}
                              className={cn(
                                "group/row border-0 transition-colors hover:bg-primary/[0.06]",
                                lastOfSchool && "[&>td]:border-b [&>td]:border-border/70",
                              )}
                            >
                              <TableCell className="tabular sticky left-0 z-[5] bg-background px-4 text-right align-top text-xs text-muted-foreground transition-colors group-hover/row:bg-muted/60 group-hover/row:text-foreground">
                                {ranks[i] ?? ""}
                              </TableCell>
                              <TableCell className="sticky left-12 z-[5] max-w-80 border-r border-border/50 bg-background px-3 py-2.5 whitespace-normal transition-colors group-hover/row:bg-muted/60">
                                {row.isFirstOfSchool && (
                                  <div className="font-display text-[0.95rem] leading-snug font-medium">
                                    {row.schoolName}
                                  </div>
                                )}
                                {row.isFirstOfSchool && (
                                  <div className="mt-0.5 text-[0.7rem] text-muted-foreground">
                                    {row.laName}
                                    {row.urn && <span className="tabular"> · URN {row.urn}</span>}
                                  </div>
                                )}
                                {row.isFirstOfSchool && (
                                  <div className="mt-1 flex flex-wrap items-center gap-1">
                                    <span className="inline-flex items-center rounded-md bg-secondary/80 px-1.5 py-0.5 text-[0.625rem] font-medium text-secondary-foreground">
                                      {row.schoolType}
                                    </span>
                                    {row.isFaithSchool && (
                                      <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[0.625rem] font-medium text-primary">
                                        {row.religion}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {multiGroup && (
                                  <span
                                    className={cn(
                                      "mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-medium",
                                      row.groupKey === ALL_PUPILS_KEY
                                        ? "bg-primary/12 text-primary"
                                        : "bg-terracotta/12 text-terracotta",
                                    )}
                                  >
                                    {row.groupLabel}
                                  </span>
                                )}
                              </TableCell>
                              {columns.map((id) => {
                                const ind = lookups.indicatorById.get(id)
                                const v = row.values[id]
                                const { text, title } = formatCell(v ?? null, ind)
                                const companionLabel = ind ? COMPANION_GRADE_LABELS[ind.label] : undefined
                                const companionId = companionLabel
                                  ? lookups.indicatorByLabel.get(companionLabel)?.id
                                  : undefined
                                const rawGrade =
                                  companionId && !columns.includes(companionId) ? row.values[companionId] : null
                                const gradeBadge =
                                  typeof v === "number" &&
                                  typeof rawGrade === "string" &&
                                  !(rawGrade in SPECIAL_VALUE_INFO)
                                    ? rawGrade
                                    : null
                                const isMuted =
                                  typeof v !== "number" && (!v || String(v) in SPECIAL_VALUE_INFO)
                                return (
                                  <TableCell
                                    key={id}
                                    title={gradeBadge ? `${text} (${companionLabel}: ${gradeBadge})` : title}
                                    className={cn(
                                      "tabular px-3 text-right align-top text-[0.9rem]",
                                      row.isFirstOfSchool ? "pt-3" : "pt-2.5",
                                      isMuted && "text-muted-foreground/70",
                                      sort.indicatorId === id && "bg-primary/[0.04] font-semibold",
                                    )}
                                  >
                                    {gradeBadge ? (
                                      <span className="inline-flex items-baseline justify-end gap-1.5">
                                        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-sans text-[0.68rem] leading-none font-semibold text-primary">
                                          {gradeBadge}
                                        </span>
                                        <span>{text}</span>
                                      </span>
                                    ) : (
                                      text
                                    )}
                                  </TableCell>
                                )
                              })}
                            </TableRow>
                          )
                        })}
                  </TableBody>
                </table>
                {data.data && filteredRows.length === 0 && (
                  <EmptyState>No published results for this selection.</EmptyState>
                )}
              </div>
            )}
          </section>

          <footer className="flex flex-col gap-2 px-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              <span className="font-medium text-foreground">c</span> suppressed for confidentiality ·{" "}
              <span className="font-medium text-foreground">–</span> not applicable or not published
            </p>
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

function listFormat(items: string[]) {
  return new Intl.ListFormat("en-GB", { style: "long", type: "conjunction" }).format(items)
}
