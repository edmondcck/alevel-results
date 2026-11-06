import { Building2, ChevronsUpDown } from "lucide-react"
import { useMemo, useState } from "react"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CheckBox } from "./CheckBox"
import { triggerClass } from "./Field"

export type SchoolProvisionCategory = "Mainstream School" | "Special School"

export interface SchoolTypeOption {
  value: string
  label: string
  category: SchoolProvisionCategory
}

export const SCHOOL_TYPE_OPTIONS: SchoolTypeOption[] = [
  // Mainstream School (all provision types except special schools, including independent/private & FE colleges)
  { value: "mainstream_academy", label: "Academy / Free School", category: "Mainstream School" },
  { value: "mainstream_college", label: "FE / Sixth Form College", category: "Mainstream School" },
  { value: "mainstream_community", label: "Community school", category: "Mainstream School" },
  { value: "mainstream_va", label: "Voluntary Aided (VA)", category: "Mainstream School" },
  { value: "mainstream_vc", label: "Voluntary Controlled (VC)", category: "Mainstream School" },
  { value: "mainstream_foundation", label: "Foundation school", category: "Mainstream School" },
  { value: "mainstream_independent", label: "Independent / Private", category: "Mainstream School" },

  // Special School (specialist provision, AP, PRUs)
  { value: "special_academy", label: "Special academy", category: "Special School" },
  { value: "special_maintained", label: "Maintained special school", category: "Special School" },
  { value: "special_independent", label: "Independent special school", category: "Special School" },
  { value: "special_ap_pru", label: "Alternative provision / PRU", category: "Special School" },
]

export const PROVISION_CATEGORIES: SchoolProvisionCategory[] = [
  "Mainstream School",
  "Special School",
]

/** Default selection: state-funded mainstream schools and colleges (all except Independent and Special). */
export const DEFAULT_SCHOOL_TYPES: string[] = [
  "mainstream_academy",
  "mainstream_college",
  "mainstream_community",
  "mainstream_va",
  "mainstream_vc",
  "mainstream_foundation",
]

interface Props {
  id: string
  value: string[]
  onChange: (types: string[]) => void
}

/** Multi-select checkbox dropdown for school types grouped by provision. */
export function SchoolTypeSelect({ id, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => new Set(value), [value])
  const labelOf = (val: string) =>
    SCHOOL_TYPE_OPTIONS.find((o) => o.value === val)?.label ?? val

  const isDefault =
    value.length === DEFAULT_SCHOOL_TYPES.length &&
    DEFAULT_SCHOOL_TYPES.every((t) => selected.has(t))

  const mainstreamItems = useMemo(
    () => SCHOOL_TYPE_OPTIONS.filter((o) => o.category === "Mainstream School"),
    [],
  )
  const specialItems = useMemo(
    () => SCHOOL_TYPE_OPTIONS.filter((o) => o.category === "Special School"),
    [],
  )

  const allMainstreamSelected =
    mainstreamItems.length > 0 && mainstreamItems.every((o) => selected.has(o.value))
  const noSpecialSelected = !specialItems.some((o) => selected.has(o.value))

  const allSpecialSelected =
    specialItems.length > 0 && specialItems.every((o) => selected.has(o.value))
  const noMainstreamSelected = !mainstreamItems.some((o) => selected.has(o.value))

  const toggle = (val: string) => {
    if (selected.has(val)) {
      onChange(value.filter((v) => v !== val))
    } else {
      onChange([...value, val])
    }
  }

  const toggleCategory = (category: SchoolProvisionCategory) => {
    const catItems = SCHOOL_TYPE_OPTIONS.filter((o) => o.category === category)
    const allChecked = catItems.every((o) => selected.has(o.value))
    if (allChecked) {
      // Uncheck all in category
      const removeKeys = new Set(catItems.map((o) => o.value))
      onChange(value.filter((v) => !removeKeys.has(v)))
    } else {
      // Check all in category
      const current = new Set(value)
      for (const item of catItems) {
        current.add(item.value)
      }
      onChange(SCHOOL_TYPE_OPTIONS.filter((o) => current.has(o.value)).map((o) => o.value))
    }
  }

  const summary =
    value.length === 0
      ? "All school types"
      : isDefault
        ? `State mainstream (${DEFAULT_SCHOOL_TYPES.length})`
        : allMainstreamSelected && noSpecialSelected
          ? `Mainstream (${mainstreamItems.length})`
          : allSpecialSelected && noMainstreamSelected
            ? `Special (${specialItems.length})`
            : value.length === SCHOOL_TYPE_OPTIONS.length
              ? "All school types"
              : value.length === 1
                ? labelOf(value[0])
                : `${labelOf(value[0])} +${value.length - 1}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id={id} type="button" aria-expanded={open} className={triggerClass}>
          <span className="flex min-w-0 items-center gap-2">
            <Building2 className="size-4 shrink-0 text-primary" />
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
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <div className="flex items-center justify-between border-b px-3 py-1.5">
            <span className="text-xs text-muted-foreground">{value.length} selected</span>
            <div className="flex items-center gap-2">
              {!isDefault && (
                <button
                  type="button"
                  onClick={() => onChange(DEFAULT_SCHOOL_TYPES)}
                  className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Reset
                </button>
              )}
              {value.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          <CommandList className="max-h-84">
            {PROVISION_CATEGORIES.map((cat) => {
              const catItems = SCHOOL_TYPE_OPTIONS.filter((o) => o.category === cat)
              const allCatChecked = catItems.every((o) => selected.has(o.value))

              return (
                <CommandGroup
                  key={cat}
                  heading={
                    <div className="flex items-center justify-between pr-1">
                      <span>{cat}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleCategory(cat)
                        }}
                        className="text-[0.68rem] font-normal text-muted-foreground hover:text-foreground lowercase underline-offset-2 hover:underline"
                      >
                        {allCatChecked ? "deselect all" : "select all"}
                      </button>
                    </div>
                  }
                >
                  {catItems.map((opt) => {
                    const checked = selected.has(opt.value)
                    return (
                      <CommandItem
                        key={opt.value}
                        value={`${cat} ${opt.label}`}
                        onSelect={() => toggle(opt.value)}
                      >
                        <CheckBox checked={checked} />
                        <span className="truncate">{opt.label}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
