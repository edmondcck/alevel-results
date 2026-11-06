import type { DataSetMeta, IndicatorMeta, LocationOption, TimePeriodMeta } from "./ees"

/** Default headline columns, matched by label so they survive id changes. */
export const DEFAULT_COLUMNS = [
  { label: "APS per entry", short: "APS per entry" },
  { label: "APS per 'Best 3' entries", short: "Best 3 A levels" },
  {
    label: "% achieving ≥ AAB for a minimum of 2 facilitating subjects",
    short: "% AAB+ (facilitating)",
  },
  { label: "Value added", short: "Value added" },
  { label: "% retained", short: "% Retained" },
  {
    label: "Number of students at end of 16-18 study",
    short: "16–18 students",
  },
] as const

export const APS_PER_ENTRY_LABEL = DEFAULT_COLUMNS[0].label

/** Companion qualitative grade columns displayed alongside numeric APS scores in the table. */
export const COMPANION_GRADE_LABELS: Record<string, string> = {
  "APS per entry": "APS per entry (grade)",
  "APS per 'Best 3' entries": "APS per 'Best 3' entries (grade)",
}

/** Qualitative text indicators that cannot be plotted on a numeric Y-axis in the Dashboard. */
export const NON_NUMERIC_INDICATOR_LABELS = new Set([
  "APS per entry (grade)",
  "APS per 'Best 3' entries (grade)",
  "Progress banding",
])

/** Default for the Dashboard's free-choice chart. */
export const CUSTOM_CHART_DEFAULT_LABEL = "Number of students in APS measure"

/** Notes shown next to headline metrics with known data gaps. */
export const INDICATOR_NOTES: Record<string, string> = {
  "Value added":
    "Value added is published from 2023-24 onwards. DfE did not publish 16-to-18 value added in 2021-22 and 2022-23 because those cohorts received centre/teacher-assessed GCSE grades in 2020 and 2021.",
  "APS per 'Best 3' entries":
    "Best 3 A levels average point score is available at institution level from 2023-24 onwards (2023-24 values are merged from the 2023-24 DfE EES institution-level release; 2021-22 and 2022-23 EES releases did not publish school-level datasets).",
  "% achieving ≥ AAB for a minimum of 2 facilitating subjects":
    "Percentage achieving AAB or higher in at least 2 facilitating subjects is available at institution level from 2023-24 onwards (2023-24 values are merged from the 2023-24 DfE EES institution-level release; 2021-22 and 2022-23 EES releases did not publish school-level datasets).",
}

export const DEFAULT_LA_NAMES = ["Bolton", "Salford"]

export interface Lookups {
  indicators: IndicatorMeta[]
  indicatorById: Map<string, IndicatorMeta>
  indicatorByLabel: Map<string, IndicatorMeta>
  shortLabel: Map<string, string>
  las: LocationOption[]
  laById: Map<string, LocationOption>
  schoolById: Map<string, LocationOption>
  /** Time periods sorted oldest → newest */
  periods: TimePeriodMeta[]
  defaultIndicatorIds: string[]
}

export function buildLookups(meta: DataSetMeta): Lookups {
  const indicatorById = new Map(meta.indicators.map((i) => [i.id, i]))
  const indicatorByLabel = new Map(meta.indicators.map((i) => [i.label, i]))
  const shortLabel = new Map<string, string>()
  const defaultIndicatorIds: string[] = []
  for (const col of DEFAULT_COLUMNS) {
    const ind = indicatorByLabel.get(col.label)
    if (ind) {
      shortLabel.set(ind.id, col.short)
      defaultIndicatorIds.push(ind.id)
    }
  }

  const byLevel = (code: string) =>
    meta.locations.find((l) => l.level.code === code)?.options ?? []

  const las = [...byLevel("LA")].sort((a, b) => a.label.localeCompare(b.label))
  const schools = byLevel("SCH")

  const periods = [...meta.timePeriods].sort((a, b) => a.period.localeCompare(b.period))

  return {
    indicators: meta.indicators,
    indicatorById,
    indicatorByLabel,
    shortLabel,
    las,
    laById: new Map(las.map((l) => [l.id, l])),
    schoolById: new Map(schools.map((s) => [s.id, s])),
    periods,
    defaultIndicatorIds,
  }
}

/** "2024/2025" → "2024-25" */
export function periodLabel(period: string): string {
  const [a, b] = period.split("/")
  if (!a || !b) return period
  return `${a}-${b.slice(-2)}`
}

export function indicatorTitle(lookups: Lookups, id: string): string {
  return lookups.shortLabel.get(id) ?? lookups.indicatorById.get(id)?.label ?? id
}

/** Buckets indicators into readable groups for the column picker. */
export function indicatorGroup(label: string): string {
  const l = label.toLowerCase()
  if (l.startsWith("number of")) return "Student counts"
  if (l.includes("value added") || l.includes("progress")) return "Value added & progress"
  if (l.includes("retain")) return "Retention"
  if (l.includes("aps") || l.includes("aab") || l.includes("level 3") || l.includes("vocational"))
    return "Attainment & APS"
  return "Other"
}

export const INDICATOR_GROUP_ORDER = [
  "Attainment & APS",
  "Value added & progress",
  "Retention",
  "Student counts",
  "Other",
]

/** Groups indicators into ordered [groupName, indicators[]] pairs. */
export function groupIndicators(indicators: IndicatorMeta[]) {
  const map = new Map<string, IndicatorMeta[]>()
  for (const ind of indicators) {
    const g = indicatorGroup(ind.label)
    const list = map.get(g) ?? []
    list.push(ind)
    map.set(g, list)
  }
  return INDICATOR_GROUP_ORDER.filter((g) => map.has(g)).map((g) => [g, map.get(g)!] as const)
}
