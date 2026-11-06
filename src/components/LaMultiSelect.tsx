import { ChevronsUpDown, MapPin, X } from "lucide-react"
import { useMemo, useState } from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { LocationOption } from "@/lib/ees"
import { CheckBox } from "./CheckBox"
import { triggerClass } from "./Field"

export { NearMeButton } from "./NearMeButton"

interface Props {
  id: string
  options: LocationOption[]
  value: string[]
  onChange: (ids: string[]) => void
}

/** Type-ahead, multi-select local authority picker. */
export function LaMultiSelect({ id, options, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => new Set(value), [value])
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options])
  const selectedOptions = value.map((v) => byId.get(v)).filter((o): o is LocationOption => !!o)

  const toggle = (laId: string) =>
    onChange(selected.has(laId) ? value.filter((v) => v !== laId) : [...value, laId])

  const summary =
    selectedOptions.length === 0
      ? "Choose local authorities…"
      : selectedOptions.length <= 2
        ? selectedOptions.map((o) => o.label).join(", ")
        : `${selectedOptions[0].label}, ${selectedOptions[1].label} +${selectedOptions.length - 2}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id={id} type="button" role="combobox" aria-expanded={open} className={triggerClass}>
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0 text-primary" />
            <span className={selectedOptions.length ? "truncate" : "truncate text-muted-foreground"}>
              {summary}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {selectedOptions.length > 0 && (
              <span className="tabular rounded-full bg-primary/12 px-1.5 py-0.5 text-[0.65rem] font-semibold text-primary">
                {selectedOptions.length}
              </span>
            )}
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-72 p-0">
        <Command>
          <CommandInput id={`${id}-search`} placeholder="Type to search local authorities…" />
          {selectedOptions.length > 0 && (
            <div className="flex flex-wrap gap-1 px-2 pt-2">
              {selectedOptions.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggle(o.id)}
                  className="group/chip flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 py-0.5 pr-1 pl-2 text-xs text-foreground transition-colors hover:border-primary/50"
                  aria-label={`Remove ${o.label}`}
                >
                  {o.label}
                  <X className="size-3 opacity-60 group-hover/chip:opacity-100" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => onChange([])}
                className="ml-auto px-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Clear
              </button>
            </div>
          )}
          <CommandList className="max-h-80">
            <CommandEmpty>No local authority found.</CommandEmpty>
            {selectedOptions.length > 0 && <CommandSeparator className="mt-2" />}
            <CommandGroup heading={`${options.length} local authorities`}>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.label}
                  keywords={[o.code ?? "", o.oldCode ?? ""]}
                  onSelect={() => toggle(o.id)}
                >
                  <CheckBox checked={selected.has(o.id)} />
                  <span className="truncate">{o.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
