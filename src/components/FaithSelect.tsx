import { Church, ChevronsUpDown } from "lucide-react"
import { useMemo, useState } from "react"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CheckBox } from "./CheckBox"
import { triggerClass } from "./Field"

export const FAITH_OPTIONS = [
  { value: "Church of England", label: "Church of England" },
  { value: "Roman Catholic", label: "Roman Catholic" },
  { value: "Muslim", label: "Muslim / Islamic" },
  { value: "Jewish", label: "Jewish" },
  { value: "Sikh", label: "Sikh" },
  { value: "Christian", label: "Christian (Other)" },
  { value: "Hindu", label: "Hindu" },
  { value: "None", label: "Non-religious only" },
] as const

interface Props {
  id: string
  value: string[]
  onChange: (faiths: string[]) => void
}

/** Multi-select checkbox dropdown for religious character. */
export function FaithSelect({ id, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => new Set(value), [value])
  const labelOf = (val: string) =>
    FAITH_OPTIONS.find((o) => o.value === val)?.label ?? val

  const toggle = (val: string) => {
    if (selected.has(val)) {
      onChange(value.filter((v) => v !== val))
    } else {
      onChange([...value, val])
    }
  }

  const summary =
    value.length === 0
      ? "All religious characters"
      : value.length === 1
        ? labelOf(value[0])
        : `${labelOf(value[0])} +${value.length - 1}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id={id} type="button" aria-expanded={open} className={triggerClass}>
          <span className="flex min-w-0 items-center gap-2">
            <Church className="size-4 shrink-0 text-primary" />
            <span className={value.length ? "truncate" : "truncate text-muted-foreground"}>
              {summary}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {value.length > 0 && (
              <span className="tabular rounded-full bg-primary/12 px-1.5 py-0.5 text-[0.7rem] font-semibold text-primary">
                {value.length}
              </span>
            )}
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <Command>
          {value.length > 0 && (
            <div className="flex items-center justify-between border-b px-3 py-1.5">
              <span className="text-xs text-muted-foreground">{value.length} selected</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
          <CommandList className="max-h-80">
            <CommandGroup heading="Religious character">
              {FAITH_OPTIONS.map((opt) => {
                const checked = selected.has(opt.value)
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => toggle(opt.value)}
                  >
                    <CheckBox checked={checked} />
                    <span className="truncate">{opt.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
