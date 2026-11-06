/** Fixed, softly drifting gradient blobs behind the glass surfaces. */
export function BackgroundDecor() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-[18vh] -left-[10vw] h-[60vh] w-[55vw] animate-drift rounded-full blur-[90px]"
        style={{ background: "var(--blob-1)" }}
      />
      <div
        className="absolute top-[30vh] -right-[12vw] h-[55vh] w-[50vw] animate-drift rounded-full blur-[100px] [animation-delay:-9s]"
        style={{ background: "var(--blob-2)" }}
      />
      <div
        className="absolute -bottom-[20vh] left-[20vw] h-[50vh] w-[45vw] animate-drift rounded-full blur-[110px] [animation-delay:-17s]"
        style={{ background: "var(--blob-3)" }}
      />
      {/* fine paper grain */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-multiply dark:opacity-[0.06] dark:mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  )
}
