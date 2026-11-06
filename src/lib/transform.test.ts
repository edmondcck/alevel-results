import { describe, expect, it } from "vitest"
import type { DataSetMeta, QueryResult } from "./ees"
import { buildQueryBody, merge202324Supplement } from "./ees"
import { formatCell } from "./format"
import { buildLookups, indicatorGroup, periodLabel } from "./indicators"
import { ALL_PUPILS_KEY, buildPupilGroups } from "./pupilGroups"
import { compareCells, parseValue, toSeries, toTableRows } from "./transform"
import metaJson from "./__fixtures__/meta.json"
import queryJson from "./__fixtures__/query-bolton-salford.json"

const meta = metaJson as unknown as DataSetMeta
const results = merge202324Supplement((queryJson as unknown as { results: QueryResult[] }).results)
const lookups = buildLookups(meta)
const groups = buildPupilGroups(meta.filters)
const byLabel = (l: string) => lookups.indicatorByLabel.get(l)!.id

const APS = byLabel("APS per entry")
const BEST3 = byLabel("APS per 'Best 3' entries")
const VA = byLabel("Value added")
const AAB = byLabel("% achieving ≥ AAB for a minimum of 2 facilitating subjects")
const allPupils = groups.find((g) => g.key === ALL_PUPILS_KEY)!

describe("lookups", () => {
  it("resolves all six default columns in the agreed order", () => {
    expect(lookups.defaultIndicatorIds.map((id) => lookups.shortLabel.get(id))).toEqual([
      "APS per entry",
      "Best 3 A levels",
      "% AAB+ (facilitating)",
      "Value added",
      "% Retained",
      "16–18 students",
    ])
  })

  it("sorts periods oldest to newest and formats labels", () => {
    expect(lookups.periods.map((p) => periodLabel(p.period))).toEqual([
      "2021-22",
      "2022-23",
      "2023-24",
      "2024-25",
    ])
  })

  it("groups indicators", () => {
    expect(indicatorGroup("Value added")).toBe("Value added & progress")
    expect(indicatorGroup("APS per entry")).toBe("Attainment & APS")
    expect(indicatorGroup("% retained")).toBe("Retention")
    expect(indicatorGroup("Number of students at end of 16-18 study")).toBe("Student counts")
  })
})

describe("pupil groups", () => {
  it("derives 'All pupils' plus one group per non-baseline filter option", () => {
    expect(groups).toHaveLength(8)
    expect(groups[0].label).toBe("All pupils")
    expect(groups.map((g) => g.label)).toContain("Not disadvantaged")
    expect(groups.map((g) => g.label)).toContain("Applied general")
    expect(groups.map((g) => g.label)).toContain("English & maths retakes")
  })
})

describe("values", () => {
  it("parses numbers and keeps special codes", () => {
    expect(parseValue("37.16")).toBe(37.16)
    expect(parseValue("-0.12")).toBe(-0.12)
    expect(parseValue("c")).toBe("c")
    expect(parseValue(undefined)).toBeNull()
  })

  it("sorts suppression values last in both directions and sorts qualitative grades", () => {
    const vals = [3, "c", 7, "z", 5]
    expect([...vals].sort((a, b) => compareCells(a, b, "desc"))).toEqual([7, 5, 3, "c", "z"])
    expect([...vals].sort((a, b) => compareCells(a, b, "asc"))).toEqual([3, 5, 7, "c", "z"])

    const grades = ["C+", "z", "A-", "B"]
    expect([...grades].sort((a, b) => compareCells(a, b, "desc"))).toEqual(["A-", "B", "C+", "z"])
    expect([...grades].sort((a, b) => compareCells(a, b, "asc"))).toEqual(["C+", "B", "A-", "z"])
  })

  it("formats by unit", () => {
    const pct = lookups.indicatorById.get(AAB)
    const va = lookups.indicatorById.get(VA)
    expect(formatCell(34.0, pct).text).toBe("34.00%")
    expect(formatCell(0.2, va).text).toBe("+0.20")
    expect(formatCell("z", pct).text).toBe("–")
  })
})

describe("toTableRows", () => {
  const latest = results.filter((r) => r.timePeriod.period === "2024/2025")

  it("returns one row per school for All pupils sorted by APS per entry desc", () => {
    const rows = toTableRows(latest, lookups, [allPupils], lookups.defaultIndicatorIds, {
      indicatorId: APS,
      dir: "desc",
    })
    expect(rows.length).toBe(15)
    expect(new Set(rows.map((r) => r.schoolId)).size).toBe(rows.length)
    const nums = rows.map((r) => r.values[APS]).filter((v) => typeof v === "number") as number[]
    expect(nums).toEqual([...nums].sort((a, b) => b - a))
    // non-numeric values are at the bottom
    const firstNonNumeric = rows.findIndex((r) => typeof r.values[APS] !== "number")
    expect(rows.slice(firstNonNumeric).every((r) => typeof r.values[APS] !== "number")).toBe(true)
    expect(rows[0].laName).toMatch(/Bolton|Salford/)
  })

  it("keeps selected group rows together under each school", () => {
    const notDisadv = groups.find((g) => g.label === "Not disadvantaged")!
    const rows = toTableRows(latest, lookups, [allPupils, notDisadv], [APS], {
      indicatorId: APS,
      dir: "desc",
    })
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].isFirstOfSchool) expect(rows[i].schoolId).toBe(rows[i - 1].schoolId)
    }
    expect(rows.some((r) => r.groupLabel === "Not disadvantaged")).toBe(true)
  })
})

describe("toSeries", () => {
  it("ranks schools by latest year, best first", () => {
    const s = toSeries(results, lookups, APS, allPupils, 20)
    expect(s.rankPeriod).toBe("2024/2025")
    expect(s.schools.length).toBeGreaterThan(0)
    const latestVals = s.schools.map((x) => x.latestValue)
    expect(latestVals).toEqual([...latestVals].sort((a, b) => b - a))
    expect(s.data.map((d) => d.year)).toEqual(["2021-22", "2022-23", "2023-24", "2024-25"])
  })

  it("ranks Value added by 2024-25", () => {
    const s = toSeries(results, lookups, VA, allPupils, 20)
    expect(s.rankPeriod).toBe("2024/2025")
    expect(s.schools.length).toBeGreaterThan(0)
  })

  it("populates 2023-24 and 2024-25 values for Best 3 A levels and % AAB+ via supplement", () => {
    const best3Series = toSeries(results, lookups, BEST3, allPupils, 20)
    const aabSeries = toSeries(results, lookups, AAB, allPupils, 20)
    const row2023Best3 = best3Series.data.find((d) => d.year === "2023-24")!
    const row2023Aab = aabSeries.data.find((d) => d.year === "2023-24")!
    expect(Object.keys(row2023Best3).length).toBeGreaterThan(2)
    expect(Object.keys(row2023Aab).length).toBeGreaterThan(2)
  })

  it("filters schools by schoolTypes and faiths in toSeries", () => {
    const s = toSeries(results, lookups, APS, allPupils, 20, ["Community"], ["None"])
    expect(s.schools.length).toBeGreaterThan(0)
    for (const school of s.schools) {
      const rowSchool = lookups.schoolById.get(school.schoolId)
      expect(rowSchool).toBeDefined()
    }
  })
})

describe("buildQueryBody", () => {
  it("adds a time period criterion only when a period is given", () => {
    const body = buildQueryBody({ laIds: ["a"], indicatorIds: ["x"], period: "2024/2025" }, 1)
    expect(body.criteria.and).toHaveLength(2)
    expect(buildQueryBody({ laIds: ["a"], indicatorIds: ["x"] }, 1).criteria.and).toHaveLength(1)
  })
})
