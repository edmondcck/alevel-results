import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./ThemeToggle"

const NAV = [
  { to: "/", label: "School Performance", id: "nav-school-performance" },
  { to: "/dashboard", label: "Dashboard", id: "nav-dashboard" },
]

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="glass-strong mx-auto flex max-w-[1400px] items-center gap-3 rounded-2xl px-3 py-2 sm:gap-6 sm:px-5">
        <NavLink to="/" className="group flex shrink-0 items-baseline gap-2" aria-label="A-Level Results home">
          <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            A-Level <em className="font-normal text-primary italic">Results</em>
          </span>
        </NavLink>

        <nav aria-label="Main" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              id={item.id}
              end
              className={({ isActive }) =>
                cn(
                  "group relative rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-3 -bottom-px h-px origin-left bg-primary transition-transform duration-300",
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50",
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  )
}
