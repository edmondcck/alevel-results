import type { IndicatorMeta } from "./ees"
import type { CellValue } from "./transform"

export const SPECIAL_VALUE_INFO: Record<string, { display: string; title: string }> = {
  c: { display: "c", title: "Suppressed to protect confidentiality" },
  z: { display: "–", title: "Not applicable / not published for this year" },
  x: { display: "x", title: "Not available" },
  u: { display: "u", title: "Low reliability" },
  low: { display: "low", title: "Rounds to zero" },
}

export function isProgressScore(ind?: IndicatorMeta): boolean {
  return (
    !!ind &&
    (/progress 8/i.test(ind.label) ||
      /value added/i.test(ind.label) ||
      /average (english|maths) progress/i.test(ind.label)) &&
    !/^(number|percentage|sum|progress banding)/i.test(ind.label)
  )
}

export function formatNumber(value: number, ind?: IndicatorMeta): string {
  const dp = ind?.decimalPlaces ?? (Number.isInteger(value) ? 0 : 1)
  const text = value.toLocaleString("en-GB", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  })
  if (ind?.unit === "%") return `${text}%`
  if (isProgressScore(ind) && value > 0) return `+${text}`
  return text
}

export function formatCell(value: CellValue, ind?: IndicatorMeta): { text: string; title?: string } {
  if (value === null || value === undefined) return { text: "", title: "No data" }
  if (typeof value === "number") return { text: formatNumber(value, ind) }
  const info = SPECIAL_VALUE_INFO[value]
  return info ? { text: info.display, title: info.title } : { text: value }
}
