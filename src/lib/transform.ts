import type { QueryResult } from "./ees"
import type { Lookups } from "./indicators"
import { periodLabel } from "./indicators"
import { groupKeyOf, matchesGroup, type PupilGroup } from "./pupilGroups"

import {
  classifySchool,
  matchesFaith,
  matchesSchoolType,
  type ReligiousCharacter,
  type SchoolType,
} from "./schoolInfo"

/** number, a special code ("c", "z", …) or null when there is no row at all */
export type CellValue = number | string | null

export function parseValue(raw: string | undefined): CellValue {
  if (raw === undefined || raw === null || raw === "") return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : raw
}

export type SortDir = "asc" | "desc"
export interface SortState {
  indicatorId: string
  dir: SortDir
}

const QUALITATIVE_RANK: Record<string, number> = {
  // A-level grades
  "A*": 60,
  "A*-": 56.67,
  "A+": 53.33,
  A: 50,
  "A-": 46.67,
  "B+": 43.33,
  B: 40,
  "B-": 36.67,
  "C+": 33.33,
  C: 30,
  "C-": 26.67,
  "D+": 23.33,
  D: 20,
  "D-": 16.67,
  "E+": 13.33,
  E: 10,
  "E-": 6.67,
  U: 0,
  // Level 3 vocational grades
  "Dist*": 50,
  "Dist*-": 46.67,
  "Dist+": 40,
  Dist: 35,
  "Dist-": 31.67,
  "Merit+": 28.33,
  Merit: 25,
  "Merit-": 21.67,
  "Pass+": 18.33,
  Pass: 15,
  "Pass-": 11.67,
  // Level 2 vocational grades
  "L2Dist*": 8.5,
  "L2Dist*-": 8.0,
  "L2Dist+": 7.5,
  L2Dist: 7.0,
  "L2Dist-": 6.5,
  "L2Merit+": 6.2,
  L2Merit: 6.0,
  "L2Merit-": 5.6,
  "L2Pass+": 5.3,
  L2Pass: 5.0,
  "L2Pass-": 4.6,
  // Progress bandings
  "Well above average": 5,
  "Above average": 4,
  Average: 3,
  "Below average": 2,
  "Well below average": 1,
}

function numericRank(val: CellValue): number | null {
  if (typeof val === "number") return val
  if (typeof val === "string" && val in QUALITATIVE_RANK) return QUALITATIVE_RANK[val]
  return null
}

/** Compares cell values; suppression/non-ranked values always sort last regardless of direction. */
export function compareCells(a: CellValue, b: CellValue, dir: SortDir): number {
  const ar = numericRank(a)
  const br = numericRank(b)
  if (ar !== null && br !== null) return dir === "desc" ? br - ar : ar - br
  if (ar !== null) return -1
  if (br !== null) return 1
  return 0
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export interface TableRow {
  key: string
  schoolId: string
  schoolName: string
  urn?: string
  laEstab?: string
  schoolType: SchoolType
  religion: ReligiousCharacter
  isFaithSchool: boolean
  laName: string
  groupKey: string
  groupLabel: string
  /** First row rendered for this school (used for grouping visuals) */
  isFirstOfSchool: boolean
  values: Record<string, CellValue>
}

/**
 * Turns raw API rows into one table row per (school, selected pupil group).
 * Schools are ordered by the sort indicator in the first selected group;
 * group rows of the same school stay together in the order the groups were selected.
 */
export function toTableRows(
  results: QueryResult[],
  lookups: Lookups,
  selectedGroups: PupilGroup[],
  indicatorIds: string[],
  sort: SortState,
): TableRow[] {
  if (selectedGroups.length === 0) return []

  // school -> groupKey -> values
  const bySchool = new Map<string, Map<string, Record<string, CellValue>>>()
  for (const r of results) {
    const schoolId = r.locations.SCH
    if (!schoolId) continue
    const gk = groupKeyOf(r, selectedGroups)
    if (!gk) continue
    const values: Record<string, CellValue> = {}
    for (const id of indicatorIds) values[id] = parseValue(r.values[id])
    let groups = bySchool.get(schoolId)
    if (!groups) {
      groups = new Map()
      bySchool.set(schoolId, groups)
    }
    groups.set(gk, values)
  }

  const primaryKey = selectedGroups[0].key
  const schoolLa = new Map<string, string>()
  for (const r of results) {
    if (r.locations.SCH && r.locations.LA) schoolLa.set(r.locations.SCH, r.locations.LA)
  }

  const schoolIds = [...bySchool.keys()]
  const nameOf = (id: string) => lookups.schoolById.get(id)?.label ?? id
  schoolIds.sort((a, b) => {
    const va = bySchool.get(a)?.get(primaryKey)?.[sort.indicatorId] ?? null
    const vb = bySchool.get(b)?.get(primaryKey)?.[sort.indicatorId] ?? null
    return compareCells(va, vb, sort.dir) || nameOf(a).localeCompare(nameOf(b))
  })

  const rows: TableRow[] = []
  for (const schoolId of schoolIds) {
    const school = lookups.schoolById.get(schoolId)
    const groups = bySchool.get(schoolId)!
    const classification = classifySchool(school?.label ?? schoolId, school?.laEstab, school?.urn)
    let first = true
    for (const g of selectedGroups) {
      const values = groups.get(g.key)
      if (!values) continue
      rows.push({
        key: `${schoolId}|${g.key}`,
        schoolId,
        schoolName: school?.label ?? schoolId,
        urn: school?.urn,
        laEstab: school?.laEstab,
        schoolType: classification.type,
        religion: classification.religion,
        isFaithSchool: classification.isFaithSchool,
        laName: lookups.laById.get(schoolLa.get(schoolId) ?? "")?.label ?? "",
        groupKey: g.key,
        groupLabel: g.label,
        isFirstOfSchool: first,
        values,
      })
      first = false
    }
  }
  return rows
}

// ---------------------------------------------------------------------------
// Time series (Dashboard)
// ---------------------------------------------------------------------------

export interface SeriesSchool {
  key: string
  schoolId: string
  name: string
  laName: string
  latestValue: number
  rank: number
}

export interface SeriesResult {
  data: Array<Record<string, string | number | null>>
  schools: SeriesSchool[]
  /** Period (e.g. "2023/2024") used for ranking, i.e. latest year with any data */
  rankPeriod?: string
  /** Number of schools that had data in the ranking year (before the limit) */
  totalSchools: number
}

export const seriesKey = (schoolId: string) => `s_${schoolId}`

/**
 * Builds a Recharts-friendly dataset: one entry per year, one key per school.
 * Schools are ranked by their value in the latest year that has any numeric data
 * for this indicator (higher = better) and limited to `limit`.
 */
export function toSeries(
  results: QueryResult[],
  lookups: Lookups,
  indicatorId: string,
  group: PupilGroup,
  limit = 20,
  schoolTypes: string[] = [],
  faiths: string[] = [],
): SeriesResult {
  const periods = lookups.periods.map((p) => p.period)
  // school -> period -> value
  const values = new Map<string, Map<string, number>>()
  const schoolLa = new Map<string, string>()

  for (const r of results) {
    const schoolId = r.locations.SCH
    if (!schoolId || !matchesGroup(r, group)) continue

    if (schoolTypes.length > 0 || faiths.length > 0) {
      const school = lookups.schoolById.get(schoolId)
      const classification = classifySchool(school?.label ?? schoolId, school?.laEstab, school?.urn)
      if (!matchesSchoolType(classification.type, schoolTypes)) continue
      if (!matchesFaith(classification.religion, classification.isFaithSchool, faiths)) continue
    }

    const v = parseValue(r.values[indicatorId])
    if (typeof v !== "number") continue
    let m = values.get(schoolId)
    if (!m) {
      m = new Map()
      values.set(schoolId, m)
    }
    m.set(r.timePeriod.period, v)
    if (r.locations.LA) schoolLa.set(schoolId, r.locations.LA)
  }

  const rankPeriod = [...periods]
    .reverse()
    .find((p) => [...values.values()].some((m) => m.has(p)))

  const ranked = rankPeriod
    ? [...values.entries()]
        .filter(([, m]) => m.has(rankPeriod))
        .sort((a, b) => b[1].get(rankPeriod)! - a[1].get(rankPeriod)!)
    : []

  const schools: SeriesSchool[] = ranked.slice(0, limit).map(([schoolId, m], i) => ({
    key: seriesKey(schoolId),
    schoolId,
    name: lookups.schoolById.get(schoolId)?.label ?? schoolId,
    laName: lookups.laById.get(schoolLa.get(schoolId) ?? "")?.label ?? "",
    latestValue: m.get(rankPeriod!)!,
    rank: i + 1,
  }))

  const data = periods.map((p) => {
    const point: Record<string, string | number | null> = { period: p, year: periodLabel(p) }
    for (const s of schools) point[s.key] = values.get(s.schoolId)?.get(p) ?? null
    return point
  })

  return { data, schools, rankPeriod, totalSchools: ranked.length }
}
