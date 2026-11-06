import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { getMeta, queryAll } from "@/lib/ees"
import { buildLookups, type Lookups } from "@/lib/indicators"
import { buildPupilGroups, type PupilGroup } from "@/lib/pupilGroups"

export interface MetaData {
  lookups: Lookups
  groups: PupilGroup[]
}

/** Dataset metadata – fetched once per session. */
export function useMeta() {
  const query = useQuery({
    queryKey: ["meta"],
    queryFn: ({ signal }) => getMeta(signal),
    staleTime: Infinity,
    gcTime: Infinity,
  })
  const data = useMemo<MetaData | undefined>(
    () =>
      query.data
        ? { lookups: buildLookups(query.data), groups: buildPupilGroups(query.data.filters) }
        : undefined,
    [query.data],
  )
  return { ...query, data }
}

/** School rows for the given LAs, indicators and (optional) single period. */
export function useSchoolData(laIds: string[], indicatorIds: string[], period?: string) {
  const las = [...laIds].sort()
  const inds = [...new Set(indicatorIds)].sort()
  return useQuery({
    queryKey: ["school-data", las, inds, period ?? "all"],
    queryFn: ({ signal }) => queryAll({ laIds: las, indicatorIds: inds, period }, signal),
    enabled: las.length > 0 && inds.length > 0,
    staleTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev,
  })
}
