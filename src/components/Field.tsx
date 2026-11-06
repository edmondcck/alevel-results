import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Labelled wrapper for a filter control. */
export function Field({
  label,
  htmlFor,
  children,
  className,
  action,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <div className="flex items-center justify-between gap-1.5">
        <label htmlFor={htmlFor} className="eyebrow truncate text-muted-foreground text-[0.625rem]">
          {label}
        </label>
        {action}
      </div>
      {children}
    </div>
  )
}

/** Shared look for popover trigger buttons so all controls align. */
export const triggerClass =
  "flex h-8.5 w-full min-w-0 items-center justify-between gap-1.5 rounded-xl border border-input bg-background/60 px-2.5 text-left text-xs shadow-xs transition-[color,box-shadow,background-color] outline-none hover:bg-background/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 data-[state=open]:border-ring data-[state=open]:ring-3 data-[state=open]:ring-ring/20 dark:bg-white/5 dark:hover:bg-white/10"
