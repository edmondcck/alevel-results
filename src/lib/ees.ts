/**
 * Minimal typed client for the Explore Education Statistics (EES) public API.
 * Docs: https://api.education.gov.uk/statistics/docs/
 */

import best3Aab202324Raw from "@/data/best3-aab-202324.json"

export const EES_API_BASE = "https://api.education.gov.uk/statistics/v1"

/** "Schools and colleges - performance" – 16 to 19 institution-level dataset */
export const DATASET_ID = "019c2960-81e3-70c2-8d65-72c3718ae4fd"

export const RELEASE_URL =
  "https://explore-education-statistics.service.gov.uk/find-statistics/16-to-19-performance/2024-25"

const MAX_PAGE_SIZE = 10_000

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterOption {
  id: string
  label: string
  isAggregate?: boolean
}

export interface FilterMeta {
  id: string
  column: string
  label: string
  hint?: string
  options: FilterOption[]
}

export interface IndicatorMeta {
  id: string
  column: string
  label: string
  unit?: string
  decimalPlaces?: number
}

export interface LocationOption {
  id: string
  label: string
  code?: string
  oldCode?: string
  urn?: string
  laEstab?: string
}

export interface LocationGroupMeta {
  level: { code: string; label: string }
  options: LocationOption[]
}

export interface TimePeriodMeta {
  code: string
  period: string
  label: string
}

export interface DataSetMeta {
  filters: FilterMeta[]
  indicators: IndicatorMeta[]
  geographicLevels: { code: string; label: string }[]
  locations: LocationGroupMeta[]
  timePeriods: TimePeriodMeta[]
}

export interface QueryResult {
  timePeriod: { code: string; period: string }
  geographicLevel: string
  locations: Record<string, string>
  filters: Record<string, string>
  values: Record<string, string>
}

interface QueryResponse {
  paging: { page: number; pageSize: number; totalResults: number; totalPages: number }
  results: QueryResult[]
  warnings?: { code: string; message: string }[]
}

export interface DataQuery {
  laIds: string[]
  indicatorIds: string[]
  /** Restrict to a single period (e.g. "2025/2026"). Omit for all years. */
  period?: string
}

export class EesApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "EesApiError"
    this.status = status
  }
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${EES_API_BASE}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    let message = `EES API request failed (${res.status})`
    try {
      const body = await res.json()
      const first = body?.errors?.[0]?.message ?? body?.title
      if (first) message = `${message}: ${first}`
    } catch {
      /* non-JSON error body */
    }
    throw new EesApiError(message, res.status)
  }
  return (await res.json()) as T
}

export function getMeta(signal?: AbortSignal): Promise<DataSetMeta> {
  return request<DataSetMeta>(`/data-sets/${DATASET_ID}/meta`, { signal })
}

/** Builds the POST body for the /query endpoint. Exported for testing. */
export function buildQueryBody(q: DataQuery, page: number) {
  const and: unknown[] = [
    { locations: { in: q.laIds.map((id) => ({ level: "LA", id })) } },
  ]
  if (q.period) {
    and.push({ timePeriods: { eq: { period: q.period, code: "AY" } } })
  }
  return {
    criteria: { and },
    indicators: q.indicatorIds,
    page,
    pageSize: MAX_PAGE_SIZE,
  }
}

const best3Aab202324 = best3Aab202324Raw as Record<string, Record<string, string>>

/**
 * Enriches 2023/2024 "All pupils" (A level + Total) rows with official 2023-24
 * DfE institution-level values for "APS per 'Best 3' entries" (qGU8j),
 * "APS per 'Best 3' entries (grade)" (a275L), "% achieving >= AAB for a minimum
 * of 2 facilitating subjects" (IXW3B), and A-level entry counts (cZzR3, 5TNzd),
 * which DfE left as "z" in the 2024-25 dataset file but published in the 2023-24 release.
 */
export function merge202324Supplement(
  results: QueryResult[],
  indicatorIds?: string[],
): QueryResult[] {
  const allowed = indicatorIds ? new Set(indicatorIds) : null
  return results.map((row) => {
    if (
      row.timePeriod.period !== "2023/2024" ||
      row.filters["98L4v"] !== "rG65N" ||
      row.filters["Q7Awb"] !== "U34ER"
    ) {
      return row
    }
    const supp = best3Aab202324[row.locations.SCH]
    if (!supp) return row

    let nextValues: Record<string, string> | null = null
    for (const [indId, val] of Object.entries(supp)) {
      if (allowed && !allowed.has(indId)) continue
      const cur = row.values[indId]
      if (cur === undefined || cur === "z") {
        if (!nextValues) nextValues = { ...row.values }
        nextValues[indId] = val
      }
    }
    return nextValues ? { ...row, values: nextValues } : row
  })
}

/** Runs a query and transparently follows all result pages. */
export async function queryAll(q: DataQuery, signal?: AbortSignal): Promise<QueryResult[]> {
  if (q.laIds.length === 0 || q.indicatorIds.length === 0) return []

  const results: QueryResult[] = []
  let page = 1
  let totalPages: number
  do {
    const res = await request<QueryResponse>(`/data-sets/${DATASET_ID}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildQueryBody(q, page)),
      signal,
    })
    results.push(...(res.results ?? []))
    totalPages = res.paging?.totalPages ?? 1
    page += 1
  } while (page <= totalPages)

  return merge202324Supplement(results, q.indicatorIds)
}
