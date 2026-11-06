import type { ReactNode } from "react"

/** Editorial page heading: eyebrow, large serif title, and a lede line. */
export function PageHero({
  eyebrow,
  title,
  lede,
  aside,
}: {
  eyebrow: string
  title: ReactNode
  lede?: ReactNode
  aside?: ReactNode
}) {
  return (
    <div className="flex animate-rise flex-col gap-4 px-1 pt-4 sm:pt-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="eyebrow flex items-center gap-2 text-primary">
          <span className="inline-block h-px w-8 bg-primary/60" />
          {eyebrow}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.02] font-light tracking-tight sm:text-6xl">
          {title}
        </h1>
        {lede && (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{lede}</p>
        )}
      </div>
      {aside}
    </div>
  )
}
