import { ChevronsUpDown, Users } from "lucide-react"
import { useMemo, useState } from "react"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PupilGroup } from "@/lib/pupilGroups"
import { CheckBox } from "./CheckBox"
import { triggerClass } from "./Field"

function byCategory(groups: PupilGroup[]) {
  const map = new Map<string, PupilGroup[]>()
  for (const g of groups) {
    const list = map.get(g.category) ?? []
    list.push(g)
    map.set(g.category, list)
  }
  return [...map.entries()]
}

interface MultiProps {
  id: string
  groups: PupilGroup[]
  value: string[]
  onChange: (keys: string[]) => void
}

/** Checkbox dropdown of pupil groups (dataset filters). At least one stays selected. */
export function PupilGroupMultiSelect({ id, groups, value, onChange }: MultiProps) {
  const [open, setOpen] = useState(false)
  const categories = useMemo(() => byCategory(groups), [groups])
  const labelOf = (k: string) => groups.find((g) => g.key === k)?.label ?? k

  const toggle = (key: string) => {
    if (value.includes(key)) {
      if (value.length > 1) onChange(value.filter((k) => k !== key))
    } else {
      // keep selection in canonical group order
      const next = new Set([...value, key])
      onChange(groups.filter((g) => next.has(g.key)).map((g) => g.key))
    }
  }

  const summary =
    value.length === 1 ? labelOf(value[0]) : `${labelOf(value[0])} +${value.length - 1}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id={id} type="button" aria-expanded={open} className={triggerClass}>
          <span className="flex min-w-0 items-center gap-2">
            <Users className="size-4 shrink-0 text-primary" />
            <span className="truncate">{summary}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandList className="max-h-96">
            {categories.map(([cat, items]) => (
              <CommandGroup key={cat} heading={cat === "All" ? "Overall" : cat}>
                {items.map((g) => {
                  const checked = value.includes(g.key)
                  return (
                    <CommandItem
                      key={g.key}
                      value={`${cat} ${g.label}`}
                      onSelect={() => toggle(g.key)}
                      disabled={checked && value.length === 1}
                      className="data-[disabled=true]:opacity-100"
                    >
                      <CheckBox checked={checked} />
                      {g.label}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
          <p className="border-t px-3 py-2 text-[0.7rem] leading-snug text-muted-foreground">
            The dataset publishes breakdowns by disadvantage status (for A level) and by
            qualification cohort. Each selected group adds a row per institution.
          </p>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface SingleProps {
  id: string
  groups: PupilGroup[]
  value: string
  onChange: (key: string) => void
}

export function PupilGroupSelect({ id, groups, value, onChange }: SingleProps) {
  const categories = useMemo(() => byCategory(groups), [groups])
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={`${triggerClass} data-[size=default]:h-10`}>
        <span className="flex min-w-0 items-center gap-2">
          <Users className="size-4 shrink-0 text-primary" />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="max-h-96">
        {categories.map(([cat, items]) => (
          <SelectGroup key={cat}>
            <SelectLabel>{cat === "All" ? "Overall" : cat}</SelectLabel>
            {items.map((g) => (
              <SelectItem key={g.key} value={g.key}>
                {g.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
