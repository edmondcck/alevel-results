import { CalendarDays } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TimePeriodMeta } from "@/lib/ees"
import { periodLabel } from "@/lib/indicators"
import { triggerClass } from "./Field"

interface Props {
  id: string
  periods: TimePeriodMeta[]
  value: string
  onChange: (period: string) => void
}

/** Choose-only academic year dropdown (newest first). */
export function YearSelect({ id, periods, value, onChange }: Props) {
  const newestFirst = [...periods].reverse()
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={`${triggerClass} data-[size=default]:h-10`}>
        <span className="flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />
          <SelectValue placeholder="Year" />
        </span>
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {newestFirst.map((p, i) => (
          <SelectItem key={p.period} value={p.period}>
            <span className="tabular">{periodLabel(p.period)}</span>
            {i === 0 && (
              <span className="ml-2 rounded-full bg-primary/12 px-1.5 text-[0.65rem] font-semibold text-primary uppercase">
                Latest
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
