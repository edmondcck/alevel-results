import { ChevronsUpDown, Columns3, RotateCcw } from "lucide-react"
import { useMemo, useState } from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { IndicatorMeta } from "@/lib/ees"
import { groupIndicators } from "@/lib/indicators"
import { CheckBox } from "./CheckBox"
import { triggerClass } from "./Field"

interface Props {
  id: string
  indicators: IndicatorMeta[]
  shortLabel: Map<string, string>
  value: string[]
  defaults: string[]
  onChange: (ids: string[]) => void
}

/** Searchable checkbox dropdown for choosing table columns (indicators). */
export function ColumnSelect({ id, indicators, shortLabel, value, defaults, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const grouped = useMemo(() => groupIndicators(indicators), [indicators])
  const selected = new Set(value)

  const toggle = (indId: string) => {
    if (selected.has(indId)) {
      if (value.length > 1) onChange(value.filter((v) => v !== indId))
    } else {
      onChange([...value, indId])
    }
  }

  const isDefault = value.length === defaults.length && value.every((v, i) => v === defaults[i])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id={id} type="button" aria-expanded={open} className={triggerClass}>
          <span className="flex min-w-0 items-center gap-2">
            <Columns3 className="size-4 shrink-0 text-primary" />
            <span className="truncate">
              {value.length} column{value.length === 1 ? "" : "s"}
              {!isDefault && <span className="text-muted-foreground"> · customised</span>}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(30rem,calc(100vw-2rem))] p-0">
        <Command>
          <CommandInput id={`${id}-search`} placeholder={`Search ${indicators.length} indicators…`} />
          <div className="flex items-center justify-between px-3 pt-2 text-xs text-muted-foreground">
            <span>{value.length} selected</span>
            <button
              type="button"
              disabled={isDefault}
              onClick={() => onChange(defaults)}
              className="flex items-center gap-1 rounded px-1 hover:text-foreground disabled:opacity-40"
            >
              <RotateCcw className="size-3" /> Reset to defaults
            </button>
          </div>
          <CommandList className="max-h-[min(26rem,60vh)]">
            <CommandEmpty>No indicator found.</CommandEmpty>
            {grouped.map(([group, items]) => (
              <CommandGroup key={group} heading={group}>
                {items.map((ind) => (
                  <CommandItem
                    key={ind.id}
                    value={`${ind.label} ${shortLabel.get(ind.id) ?? ""}`}
                    onSelect={() => toggle(ind.id)}
                    className="items-start"
                  >
                    <CheckBox checked={selected.has(ind.id)} className="mt-0.5" />
                    <span className="flex flex-col">
                      <span className="leading-snug">{ind.label}</span>
                      {shortLabel.has(ind.id) && (
                        <span className="text-[0.7rem] text-primary">Default · {shortLabel.get(ind.id)}</span>
                      )}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface IndicatorPickerProps {
  id: string
  indicators: IndicatorMeta[]
  value: string
  onChange: (id: string) => void
}

/** Searchable single-choice indicator picker (Dashboard custom chart). */
export function IndicatorPicker({ id, indicators, value, onChange }: IndicatorPickerProps) {
  const [open, setOpen] = useState(false)
  const grouped = useMemo(() => groupIndicators(indicators), [indicators])
  const current = indicators.find((i) => i.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id={id} type="button" role="combobox" aria-expanded={open} className={`${triggerClass} h-9`}>
          <span className="truncate">{current?.label ?? "Choose an indicator…"}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(30rem,calc(100vw-2rem))] p-0">
        <Command>
          <CommandInput id={`${id}-search`} placeholder="Search indicators…" />
          <CommandList className="max-h-[min(26rem,60vh)]">
            <CommandEmpty>No indicator found.</CommandEmpty>
            {grouped.map(([group, items]) => (
              <CommandGroup key={group} heading={group}>
                {items.map((ind) => (
                  <CommandItem
                    key={ind.id}
                    value={ind.label}
                    data-checked={ind.id === value}
                    onSelect={() => {
                      onChange(ind.id)
                      setOpen(false)
                    }}
                  >
                    <span className="leading-snug">{ind.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
