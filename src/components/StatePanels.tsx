import { AlertTriangle, RefreshCw } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="px-6 py-16 text-center text-sm text-muted-foreground">{children}</div>
}

export function ErrorPanel({
  message,
  onRetry,
  inline,
}: {
  message?: string
  onRetry: () => void
  inline?: boolean
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 px-6 py-14 text-center",
        !inline && "glass rounded-3xl",
      )}
    >
      <AlertTriangle className="size-6 text-destructive" />
      <div>
        <p className="font-display text-lg">Couldn’t load data from the DfE statistics API</p>
        {message && <p className="mt-1 text-xs text-muted-foreground">{message}</p>}
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} id="retry-button">
        <RefreshCw /> Try again
      </Button>
    </div>
  )
}

/** Thin indeterminate progress bar shown while refetching. */
export function LoadingBar({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div className="absolute inset-x-0 top-0 z-30 h-0.5 overflow-hidden" role="progressbar" aria-label="Loading">
      <div className="h-full w-1/3 animate-[loading-bar_1.1s_ease-in-out_infinite] rounded-full bg-primary" />
    </div>
  )
}
