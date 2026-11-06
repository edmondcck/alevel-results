# UI Design System & Architecture Guide

A comprehensive, reusable design specification based on the **Editorial Academic Glassmorphism** aesthetic. Use this guide to recreate consistent, premium user interfaces across web applications.

---

## 1. Design Philosophy & Visual Identity

The design language balances **scholarly, editorial elegance** with **modern, tactile glassmorphism**:
- **Warmth over Sterile Gray**: Instead of cold `#ffffff` / `#000000`, the theme uses warm ivory paper (`oklch(0.975 0.012 85)`) in light mode and midnight indigo (`oklch(0.17 0.03 265)`) in dark mode.
- **Editorial Typography Pairing**: A humanist, variable serif font (`Fraunces`) for expressive titles paired with a clean geometric sans (`Inter`) with tabular numerals for data density.
- **Ambient Depth (No Flat Gradients)**: Subtle organic gradient blobs drift slowly beneath semi-transparent frosted glass cards with specular highlight inset borders.
- **Data-First Utility**: Clean tabular alignment for numbers, micro-badges for categorization, and responsive multi-select popovers.

---

## 2. Color System (OKLCH)

We use the **OKLCH** color space for perceptually uniform lightness and predictable contrast in both light and dark themes.

### Light Theme (Warm Ivory & Deep Teal)
```css
:root {
  /* Surfaces & Background */
  --background: oklch(0.975 0.012 85);       /* Warm ivory paper */
  --foreground: oklch(0.24 0.035 260);       /* Deep ink-navy text */
  --card: oklch(0.995 0.006 85 / 0.6);       /* Semi-transparent surface */
  --popover: oklch(0.99 0.008 85 / 0.92);    /* Frosted popover surface */
  
  /* Primary & Accents */
  --primary: oklch(0.47 0.085 195);          /* Deep sea-teal */
  --primary-foreground: oklch(0.985 0.01 85);
  --secondary: oklch(0.94 0.015 85);
  --secondary-foreground: oklch(0.28 0.035 260);
  --muted: oklch(0.935 0.014 85);
  --muted-foreground: oklch(0.5 0.025 260);  /* Soft slate for secondary labels */
  --accent: oklch(0.92 0.03 190 / 0.55);
  --terracotta: oklch(0.62 0.13 45);         /* Warm terracotta accent */
  
  /* Status & Borders */
  --border: oklch(0.24 0.035 260 / 0.1);
  --input: oklch(0.24 0.035 260 / 0.14);
  --ring: oklch(0.55 0.09 195);
  --positive: oklch(0.52 0.11 160);
  --negative: oklch(0.56 0.15 30);

  /* Glass Tokens */
  --glass: oklch(1 0.005 85 / 0.55);
  --glass-strong: oklch(1 0.005 85 / 0.78);
  --glass-border: oklch(1 0 0 / 0.7);
  --glass-shadow: 0 1px 0 0 oklch(1 0 0 / 0.8) inset,
                  0 18px 50px -24px oklch(0.3 0.05 260 / 0.28),
                  0 2px 8px -4px oklch(0.3 0.05 260 / 0.12);

  /* Ambient Blobs */
  --blob-1: oklch(0.86 0.08 195 / 0.75);
  --blob-2: oklch(0.88 0.09 55 / 0.7);
  --blob-3: oklch(0.86 0.06 280 / 0.6);
}
```

### Dark Theme (Midnight Indigo & Luminous Teal)
```css
.dark {
  /* Surfaces & Background */
  --background: oklch(0.17 0.03 265);        /* Midnight indigo */
  --foreground: oklch(0.94 0.018 85);        /* Warm parchment text */
  --card: oklch(0.25 0.03 265 / 0.45);
  --popover: oklch(0.22 0.03 265 / 0.94);
  
  /* Primary & Accents */
  --primary: oklch(0.78 0.11 190);           /* Luminous electric teal */
  --primary-foreground: oklch(0.18 0.03 265);
  --secondary: oklch(0.28 0.03 265);
  --secondary-foreground: oklch(0.94 0.018 85);
  --muted: oklch(0.27 0.03 265 / 0.7);
  --muted-foreground: oklch(0.72 0.025 85);
  --accent: oklch(0.4 0.06 200 / 0.4);
  --terracotta: oklch(0.76 0.12 50);         /* Warm peach terracotta */
  
  /* Status & Borders */
  --border: oklch(1 0 0 / 0.09);
  --input: oklch(1 0 0 / 0.14);
  --ring: oklch(0.72 0.1 190);
  --positive: oklch(0.78 0.13 160);
  --negative: oklch(0.72 0.15 28);

  /* Glass Tokens */
  --glass: oklch(0.28 0.03 265 / 0.38);
  --glass-strong: oklch(0.24 0.03 265 / 0.72);
  --glass-border: oklch(1 0 0 / 0.1);
  --glass-shadow: 0 1px 0 0 oklch(1 0 0 / 0.07) inset,
                  0 24px 60px -28px oklch(0 0 0 / 0.7),
                  0 2px 10px -4px oklch(0 0 0 / 0.4);

  /* Ambient Blobs */
  --blob-1: oklch(0.42 0.1 200 / 0.55);
  --blob-2: oklch(0.42 0.1 40 / 0.4);
  --blob-3: oklch(0.38 0.12 290 / 0.55);
}
```

---

## 3. Typography & Font Hierarchy

### Font Packages
Install the official variable font packages:
```bash
npm install @fontsource-variable/inter @fontsource-variable/fraunces
```

### Font Pairings
- **Body & Controls**: `"Inter Variable", ui-sans-serif, system-ui, sans-serif`
  - Enabled font features: `font-feature-settings: "cv11", "ss01";` (clean single-story 'a' and rounded punctuation).
- **Headings & Display**: `"Fraunces Variable", ui-serif, Georgia, serif`
  - Variable axis settings: `font-variation-settings: "SOFT" 50, "WONK" 0; letter-spacing: -0.02em;`

### Typographic Utility Classes
```css
@utility font-display {
  font-family: var(--font-heading);
  font-optical-sizing: auto;
  font-variation-settings: "SOFT" 50, "WONK" 0;
  letter-spacing: -0.02em;
}

@utility eyebrow {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

@utility tabular {
  font-variant-numeric: tabular-nums lining-nums;
}
```

---

## 4. Surfaces, Glassmorphism & Ambient Lighting

### Ambient Background Layer (`BackgroundDecor`)
A fixed background layer creates soft, non-intrusive light beneath the glass:
```tsx
export function BackgroundDecor() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Drifting radial light blobs */}
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
      {/* SVG Fine Paper Noise Texture */}
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
```

### The Glass Utility
```css
@utility glass {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(22px) saturate(160%);
  -webkit-backdrop-filter: blur(22px) saturate(160%);
}
```
> **Specular Highlight Feature**: The `var(--glass-shadow)` incorporates an inset `1px` top edge highlight (`0 1px 0 0 ... inset`) simulating light reflecting off the top chamfer of glass.

### Performance Rule for Sticky Table Cells
> **Crucial Optimization**: Never place `backdrop-filter: blur(...)` inside repeated table body rows with sticky columns. In Chromium/WebKit on macOS, stacking 100+ hardware-composited backdrop filters causes multi-second scroll latency and GPU thread lockups.
> 
> **Solution**: Keep backdrop blur on `<TableHead>`, but use opaque `bg-background` and `border-r border-border/50` on sticky table cells (`left-0`, `left-12`) in `<TableBody>`.

---

## 5. Component Patterns & Anatomy

### 1. Page Hero (`PageHero`)
```tsx
export function PageHero({
  eyebrow,
  title,
  lede,
}: {
  eyebrow?: string
  title: ReactNode
  lede?: string
}) {
  return (
    <header className="relative flex flex-col gap-2 pt-6 pb-2">
      {eyebrow && <span className="eyebrow text-terracotta">{eyebrow}</span>}
      <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-5xl">
        {title}
      </h1>
      {lede && <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{lede}</p>}
    </header>
  )
}
```
*Usage:*
```tsx
<PageHero
  eyebrow="Key stage 4 · Performance tables"
  title={<>School <em className="text-primary italic">performance</em></>}
  lede="Headline GCSE measures for state-funded schools in England."
/>
```

---

### 2. Filter Controls Card
A unified frosted card housing form fields, responsive grids, and an instant reset action:
```tsx
<section aria-label="Table filters" className="glass flex flex-col gap-3 rounded-3xl p-4 animate-rise sm:p-5">
  <div className="flex items-center justify-between">
    <span className="eyebrow text-muted-foreground">Filters</span>
    {isFiltered && (
      <button
        type="button"
        onClick={resetFilters}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
      >
        <RotateCcw className="size-3.5" />
        Reset filters
      </button>
    )}
  </div>
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    {/* Form Fields */}
  </div>
</section>
```

---

### 3. Form Field & Trigger Style
```tsx
// Field.tsx wrapper
export function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label htmlFor={htmlFor} className="eyebrow text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

// Universal Trigger Button Style
export const triggerClass =
  "group flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-border/80 bg-background/60 px-3 text-left text-xs font-medium backdrop-blur-md transition-all hover:border-foreground/25 hover:bg-background/85 focus:outline-none focus:ring-2 focus:ring-primary/40"
```

---

### 4. Categorization Badges
Rendered under item titles for instant visual metadata:
```tsx
<div className="mt-1 flex flex-wrap items-center gap-1">
  {/* Sector Badge */}
  <span className="inline-flex items-center rounded-md bg-secondary/80 px-1.5 py-0.5 text-[0.625rem] font-medium text-secondary-foreground">
    Academy converter
  </span>
  
  {/* Faith Badge */}
  <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[0.625rem] font-medium text-primary">
    Church of England
  </span>
</div>
```

---

### 5. Multi-Select Popover with Badge Counts
When multiple items are selected, display the first item's name plus a small badge with `+N`:
```tsx
<span className="flex shrink-0 items-center gap-1.5">
  {value.length > 0 && (
    <span className="tabular rounded-full bg-primary/12 px-1.5 py-0.5 text-[0.7rem] font-semibold text-primary">
      {value.length}
    </span>
  )}
  <ChevronsUpDown className="size-4 text-muted-foreground" />
</span>
```

---

## 6. Micro-Animations & Motion

```css
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes drift {
  0% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(4vw, -3vh, 0) scale(1.08); }
  100% { transform: translate3d(-3vw, 4vh, 0) scale(0.96); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Seamless Theme Toggle Cross-Fade
To avoid jarring color flashing when toggling dark mode:
```css
html.theme-transition,
html.theme-transition *,
html.theme-transition *::before,
html.theme-transition *::after {
  transition: background-color 0.45s ease, border-color 0.45s ease,
    color 0.3s ease, fill 0.3s ease, stroke 0.3s ease !important;
}
```

---

## 7. Porting to a New Project (Checklist)

1. **Install Dependencies**:
   ```bash
   npm install @fontsource-variable/inter @fontsource-variable/fraunces lucide-react tw-animate-css clsx tailwind-merge
   ```
2. **Setup Tailwind & CSS Variables**:
   Copy the `@theme inline` block and OKLCH color definitions into `index.css`.
3. **Import Fonts**:
   ```css
   @import "@fontsource-variable/inter";
   @import "@fontsource-variable/fraunces/full.css";
   @import "@fontsource-variable/fraunces/full-italic.css";
   ```
4. **Copy Core Shell Components**:
   - `BackgroundDecor.tsx` (ambient drifting blobs and texture)
   - `PageHero.tsx` (standard editorial header)
   - `Field.tsx` (form field container with eyebrow label)
   - `StatePanels.tsx` (loading skeleton, empty state, error banner)
   - `ThemeProvider.tsx` (theme switcher with persistent localStorage and smooth cross-fade)
