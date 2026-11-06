import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { DEFAULT_SCHOOL_TYPES } from "@/components/SchoolTypeSelect"
import { useMeta } from "@/hooks/useEesData"
import { DEFAULT_LA_NAMES } from "@/lib/indicators"
import { ALL_PUPILS_KEY } from "@/lib/pupilGroups"
import type { SortState } from "@/lib/transform"

interface FiltersContextValue {
  /** Selected local authority location ids */
  laIds: string[]
  setLaIds: (ids: string[]) => void

  /** Selected school types */
  schoolTypes: string[]
  setSchoolTypes: (types: string[]) => void

  /** Selected religious characters */
  faiths: string[]
  setFaiths: (faiths: string[]) => void

  /** Selected pupil group keys */
  groupKeys: string[]
  setGroupKeys: (keys: string[]) => void

  /** Selected academic year / period (null = use latest) */
  periodState: string | null
  setPeriod: (period: string | null) => void

  /** Selected table columns (null = use defaults) */
  columnsState: string[] | null
  setColumns: (cols: string[] | null) => void

  /** Sort state (indicator + direction) */
  sortState: SortState | null
  setSort: React.Dispatch<React.SetStateAction<SortState | null>>

  /** Resets pupil groups, school types, faiths, and sort back to defaults (does NOT reset columns) */
  resetFilters: () => void

  /** Resets custom columns back to defaults */
  resetColumns: () => void

  /** Whether custom columns have been applied */
  isColumnsModified: boolean

  /** Whether any reset-eligible filter is non-default */
  isFiltered: boolean
}

const FiltersContext = createContext<FiltersContextValue | null>(null)

export function FiltersProvider({ children }: { children: ReactNode }) {
  const { data } = useMeta()
  // null = user hasn't changed anything yet → use defaults (Bolton, Salford)
  const [userLaIds, setLaIds] = useState<string[] | null>(null)
  const [schoolTypes, setSchoolTypes] = useState<string[]>(DEFAULT_SCHOOL_TYPES)
  const [faiths, setFaiths] = useState<string[]>([])
  const [groupKeys, setGroupKeys] = useState<string[]>([ALL_PUPILS_KEY])
  const [periodState, setPeriod] = useState<string | null>(null)
  const [columnsState, setColumns] = useState<string[] | null>(null)
  const [sortState, setSort] = useState<SortState | null>(null)

  const resetFilters = () => {
    setSchoolTypes(DEFAULT_SCHOOL_TYPES)
    setFaiths([])
    setGroupKeys([ALL_PUPILS_KEY])
    setSort(null)
  }

  const resetColumns = () => {
    setColumns(null)
  }

  const isColumnsModified = columnsState !== null

  const isFiltered = useMemo(() => {
    const isDefaultSchoolTypes =
      schoolTypes.length === DEFAULT_SCHOOL_TYPES.length &&
      DEFAULT_SCHOOL_TYPES.every((t) => schoolTypes.includes(t))
    const isDefaultFaiths = faiths.length === 0
    const isDefaultGroups = groupKeys.length === 1 && groupKeys[0] === ALL_PUPILS_KEY
    const isDefaultSort = sortState === null

    return (
      !isDefaultSchoolTypes ||
      !isDefaultFaiths ||
      !isDefaultGroups ||
      !isDefaultSort
    )
  }, [schoolTypes, faiths, groupKeys, sortState])

  const defaults = useMemo(
    () =>
      data
        ? DEFAULT_LA_NAMES.map((name) => data.lookups.las.find((l) => l.label === name)?.id).filter(
            (x): x is string => !!x,
          )
        : [],
    [data],
  )

  const value = useMemo(
    () => ({
      laIds: userLaIds ?? defaults,
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
    }),
    [
      userLaIds,
      defaults,
      schoolTypes,
      faiths,
      groupKeys,
      periodState,
      columnsState,
      sortState,
      isColumnsModified,
      isFiltered,
    ],
  )

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFilters() {
  const ctx = useContext(FiltersContext)
  if (!ctx) throw new Error("useFilters must be used within FiltersProvider")
  return ctx
}
