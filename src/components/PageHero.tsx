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
    <div className="flex animate-rise flex-col gap-2 px-1 pt-2 sm:pt-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="eyebrow flex items-center gap-1.5 text-primary text-[0.625rem]">
          <span className="inline-block h-px w-6 bg-primary/60" />
          {eyebrow}
        </p>
        <h1 className="mt-1.5 font-display text-2xl leading-tight font-light tracking-tight sm:text-4xl">
          {title}
        </h1>
        {lede && (
          <p className="mt-1 max-w-2xl text-xs leading-normal text-muted-foreground sm:text-sm">{lede}</p>
        )}
      </div>
      {aside}
    </div>
  )
}
