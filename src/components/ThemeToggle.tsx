import { useTheme, type Theme } from "@/providers/ThemeProvider"
import { cn } from "@/lib/utils"

const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "☀" },
  { value: "dark", label: "Dark", icon: "☽" },
]

/** Segmented "☀ Light" / "☽ Dark" toggle with a sliding indicator. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="relative grid grid-cols-2 rounded-full border border-glass-border bg-foreground/[0.04] p-1 text-xs font-medium"
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-background shadow-sm ring-1 ring-foreground/10 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-primary/20 dark:ring-primary/30",
          theme === "dark" && "translate-x-full",
        )}
      />
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          id={`theme-${o.value}`}
          type="button"
          role="radio"
          aria-checked={theme === o.value}
          onClick={() => setTheme(o.value)}
          className={cn(
            "relative z-10 flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 whitespace-nowrap transition-colors",
            theme === o.value ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span aria-hidden className="text-sm leading-none">
            {o.icon}
          </span>
          {o.label}
        </button>
      ))}
    </div>
  )
}
