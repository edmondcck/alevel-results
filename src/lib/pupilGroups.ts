import type { FilterMeta, QueryResult } from "./ees"

/**
 * A pupil group = one filter set to a specific option, every other filter at its baseline
 * ("Total" for demographic dimensions, "A level" for Exam cohort).
 */
export interface PupilGroup {
  key: string
  label: string
  /** Heading for grouping in pickers, e.g. "Disadvantaged status" or "Exam cohort" */
  category: string
  match: Record<string, string>
}

export const ALL_PUPILS_KEY = "all"

const FRIENDLY_LABELS: Record<string, string> = {
  "Known or believed to be other than English": "First language not English",
  "Not known to be disadvantaged": "Not disadvantaged",
  "Non mobile": "Non-mobile",
  "E/M measures": "English & maths retakes",
}

function totalOptionId(filter: FilterMeta): string | undefined {
  return (
    filter.options.find((o) => o.isAggregate) ??
    filter.options.find((o) => o.label.toLowerCase() === "total") ??
    filter.options.find((o) => o.label.toLowerCase() === "a level")
  )?.id
}

function getOptionSortRank(category: string, label: string): number {
  const normCat = category.toLowerCase()
  const normLabel = label.toLowerCase()

  if (normCat.includes("prior attainment")) {
    if (normLabel.includes("high")) return 1
    if (normLabel.includes("mid")) return 2
    if (normLabel.includes("low")) return 3
  }

  if (normCat.includes("disadvantag")) {
    if (normLabel.includes("not")) return 1
    return 2
  }

  if (normCat.includes("cohort")) {
    if (normLabel.includes("academic")) return 1
    if (normLabel.includes("applied general")) return 2
    if (normLabel.includes("tech level")) return 3
    if (normLabel.includes("technical certificate")) return 4
    if (normLabel.includes("e/m")) return 5
  }

  return 99
}

export function buildPupilGroups(filters: FilterMeta[]): PupilGroup[] {
  const totals: Record<string, string> = {}
  for (const f of filters) {
    const t = totalOptionId(f)
    if (t) totals[f.id] = t
  }

  const groups: PupilGroup[] = [
    { key: ALL_PUPILS_KEY, label: "All pupils", category: "All", match: { ...totals } },
  ]

  for (const f of filters) {
    const nonTotalOptions = f.options.filter((o) => o.id !== totals[f.id])
    nonTotalOptions.sort((a, b) => {
      const orderA = getOptionSortRank(f.label, a.label)
      const orderB = getOptionSortRank(f.label, b.label)
      return orderA - orderB
    })

    for (const o of nonTotalOptions) {
      groups.push({
        key: `${f.id}:${o.id}`,
        label: FRIENDLY_LABELS[o.label] ?? o.label,
        category: f.label,
        match: { ...totals, [f.id]: o.id },
      })
    }
  }
  return groups
}

export function matchesGroup(row: Pick<QueryResult, "filters">, group: PupilGroup): boolean {
  for (const [filterId, optionId] of Object.entries(group.match)) {
    if (row.filters[filterId] !== optionId) return false
  }
  return true
}

/** Returns the key of the group a row belongs to, or undefined. */
export function groupKeyOf(
  row: Pick<QueryResult, "filters">,
  groups: PupilGroup[],
): string | undefined {
  return groups.find((g) => matchesGroup(row, g))?.key
}
