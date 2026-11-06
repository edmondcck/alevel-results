import { Loader2, LocateFixed } from "lucide-react"
import { useRef, useState } from "react"
import type { LocationOption } from "@/lib/ees"
import { cn } from "@/lib/utils"

interface Props {
  id?: string
  options: LocationOption[]
  onSelect: (laId: string) => void
  className?: string
}

/**
 * Compact "Near me" location button placed to the right of the "Local authorities" label.
 * Uses browser GPS and postcodes.io reverse geocoding to detect and select the user's council.
 */
export function NearMeButton({ id, options, onSelect, className }: Props) {
  const [isLocating, setIsLocating] = useState(false)
  const [status, setStatus] = useState<{ text: string; isError?: boolean } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showStatus = (text: string, isError = false) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setStatus({ text, isError })
    timerRef.current = setTimeout(() => {
      setStatus(null)
    }, 4000)
  }

  const handleNearMe = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!navigator.geolocation) {
      showStatus("No GPS support", true)
      return
    }

    setIsLocating(true)
    setStatus(null)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://api.postcodes.io/postcodes?lat=${latitude}&lon=${longitude}&limit=1`,
          )
          if (!res.ok) throw new Error("Lookup failed")
          const json = await res.json()
          const result = json?.result?.[0]
          if (!result) {
            showStatus("No UK council found", true)
            return
          }

          const districtCode = result?.codes?.admin_district
          const districtName = result?.admin_district ?? "your area"

          const matched =
            options.find((o) => o.code === districtCode) ??
            options.find((o) => o.label.toLowerCase() === districtName.toLowerCase())

          if (matched) {
            onSelect(matched.id)
            showStatus(`Located: ${matched.label}`)
          } else {
            showStatus(`${districtName} not in dataset`, true)
          }
        } catch {
          showStatus("Failed to locate", true)
        } finally {
          setIsLocating(false)
        }
      },
      (err) => {
        setIsLocating(false)
        if (err.code === 1) {
          showStatus("Permission denied", true)
        } else if (err.code === 3) {
          showStatus("Timed out", true)
        } else {
          showStatus("Unavailable", true)
        }
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 },
    )
  }

  return (
    <button
      type="button"
      id={id}
      onClick={handleNearMe}
      disabled={isLocating}
      title={status?.text ?? "Detect your local authority based on GPS location"}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.68rem] font-medium transition-colors outline-none",
        status?.isError
          ? "bg-amber-500/12 text-amber-600 dark:text-amber-400"
          : status
            ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
            : "text-primary hover:bg-primary/10 hover:text-primary",
        "disabled:opacity-50",
        className,
      )}
    >
      {isLocating ? (
        <Loader2 className="size-3 shrink-0 animate-spin text-primary" />
      ) : (
        <LocateFixed
          className={cn(
            "size-3 shrink-0",
            status?.isError
              ? "text-amber-600 dark:text-amber-400"
              : status
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-primary",
          )}
        />
      )}
      <span className="truncate max-w-[140px]">
        {isLocating ? "Locating…" : status ? status.text : "Near me"}
      </span>
    </button>
  )
}
