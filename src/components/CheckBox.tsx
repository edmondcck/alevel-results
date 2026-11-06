import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

/** Purely visual checkbox used inside command/menu items (the item handles the click). */
export function CheckBox({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition-all duration-150",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-foreground/25 bg-background/60",
        className,
      )}
    >
      <Check className={cn("size-3 transition-transform", checked ? "scale-100" : "scale-0")} strokeWidth={3} />
    </span>
  )
}
