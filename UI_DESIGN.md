# A-Level Results – UI & Design System Specification
**Version**: 2.0  
**Theme**: Editorial Academic Glassmorphism  
**Stack**: React 19, Tailwind CSS v4, Radix UI Primitives, Lucide Icons, Recharts

This document describes the design language, token architecture, and UX components of the A-Level Results application.

---

## 1. Design Philosophy

The application balances two competing goals:
1. **Academic Authority & Rigour**: Inspiring trust through deep navy/ivory tones, Fraunces serif typography, and precise statistical notations (confidence intervals, percentage formatting, suppression tooltips).
2. **Modern Glassmorphism & Fluidity**: Tactile depth using semi-transparent frosted surfaces, subtle borders, ambient backdrop gradients, and micro-animations.

---

## 2. Color Palette & Theming (OKLCH)

All colors are defined in OKLCH within `src/index.css` via Tailwind v4 `@theme inline`.

### Light Mode ("Warm Ivory Library")
- **Background**: `oklch(0.975 0.012 85)` — Soft parchment ivory.
- **Card / Surface**: `oklch(1 0 0 / 0.72)` — High-translucency white glass.
- **Foreground**: `oklch(0.18 0.03 260)` — Deep navy black.
- **Primary / Accent**: `oklch(0.38 0.12 250)` — Scholarly Oxford cobalt.
- **Secondary / Muted**: `oklch(0.93 0.015 85)` — Warm tinted grey.
- **Terracotta (Callouts / Disadvantaged)**: `oklch(0.55 0.16 35)` — Distinctive terracotta red for cohort indicators and warnings.

### Dark Mode ("Midnight Study")
- **Background**: `oklch(0.13 0.03 260)` — Midnight indigo abyss.
- **Card / Surface**: `oklch(0.18 0.035 260 / 0.65)` — Semi-translucent dark glass.
- **Foreground**: `oklch(0.96 0.01 85)` — Crisp off-white.
- **Primary / Accent**: `oklch(0.72 0.14 240)` — Luminous cerulean blue.
- **Secondary / Muted**: `oklch(0.22 0.035 260)` — Slate navy container.
- **Terracotta (Callouts / Disadvantaged)**: `oklch(0.68 0.16 35)` — Warm ember.

---

## 3. Typography Architecture

Pairing a classic academic serif display with an ultra-readable geometric sans:

### Display Serif: *Fraunces Variable*
- **Role**: Brand logos, hero section titles, school names in performance tables, large chart headings.
- **Styles**: Regular weight, optical size variation, italicized accents (e.g. `A-Level Results` with italicized *Results* in primary color).
- **Class**: `font-display`

### Body & Data Sans: *Inter Variable*
- **Role**: Metric values, navigation links, filters, badges, and explanatory notes.
- **Numerals**: Configured with **`font-variant-numeric: tabular-nums`** via `.tabular` utility to ensure vertical alignment of digits in tables and charts.
- **Class**: `font-sans`

### Eyebrow Micro-Labels
- **Role**: Section headers, column categories, uppercase micro-metadata.
- **Rules**: `text-[0.6875rem] font-bold tracking-[0.14em] uppercase text-muted-foreground`.
- **Class**: `.eyebrow`

---

## 4. Glassmorphism & Elevation System

Surfaces use backdrop blur combined with high-contrast specular borders.

### CSS Glass Tokens
```css
:root {
  --glass-bg: oklch(1 0 0 / 0.65);
  --glass-strong: oklch(1 0 0 / 0.88);
  --glass-border: oklch(0.2 0.03 260 / 0.10);
  --glass-shadow: 0 16px 40px -12px oklch(0.2 0.03 260 / 0.08),
                  0 1px 0 0 oklch(1 1 0 / 0.6) inset;
}

.dark {
  --glass-bg: oklch(0.18 0.035 260 / 0.65);
  --glass-strong: oklch(0.18 0.035 260 / 0.88);
  --glass-border: oklch(1 0 0 / 0.12);
  --glass-shadow: 0 20px 48px -12px oklch(0 0 0 / 0.45),
                  0 1px 0 0 oklch(1 0 0 / 0.08) inset;
}

.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}

.glass-strong {
  background: var(--glass-strong);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}
```

### Ambient Background Layer (`BackgroundDecor`)
The application features floating ambient colored gradients behind the frosted cards:
```tsx
export function BackgroundDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[130px] animate-drift" />
      <div className="absolute top-1/3 -right-40 h-[550px] w-[550px] rounded-full bg-terracotta/10 blur-[140px] animate-drift [animation-delay:-6s]" />
      <div className="absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px] animate-drift [animation-delay:-12s]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-transparent via-background/40 to-background/80" />
    </div>
  )
}
```
> **Specular Highlight Feature**: The `var(--glass-shadow)` incorporates an inset `1px` top edge highlight (`0 1px 0 0 ... inset`) simulating light reflecting off the top chamfer of glass.

### Performance Rule for Sticky Table Cells
> **Crucial Optimization**: Never place `backdrop-filter: blur(...)` inside repeated table body rows with sticky columns. In Chromium/WebKit on macOS, stacking 100+ hardware-composited backdrop filters causes multi-second scroll latency and GPU thread lockups.
> 
> **Solution**: Keep backdrop blur on `<TableHead>`, but use opaque `bg-background` and `border-r border-border/50` on sticky table cells (`left-0`, `left-9`) in `<TableBody>`.

---

## 5. Component Patterns & Anatomy

### 1. Page Hero (`PageHero`)
Compact editorial header with leading accent line, serif display title, and lede:
```tsx
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
```
*Usage:*
```tsx
<PageHero
  eyebrow="Key stage 5 · Performance tables"
  title={<>School & college <em className="text-primary italic">performance</em></>}
  lede="Headline 16-to-19 measures for state-funded schools and colleges in England."
/>
```

---

### 2. Filter Controls Card
A unified frosted card housing form fields, responsive grids, and an instant reset action:
```tsx
<section aria-label="Table filters" className="glass flex flex-col gap-2.5 rounded-2xl p-3 animate-rise sm:p-3.5">
  <div className="flex items-center justify-between">
    <span className="eyebrow text-[0.625rem] text-muted-foreground">Filters</span>
    {isFiltered && (
      <button
        type="button"
        onClick={resetFilters}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
      >
        <RotateCcw className="size-3" />
        Reset filters
      </button>
    )}
  </div>
  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    {/* Form Fields */}
  </div>
</section>
```

---

### 3. Form Field & Trigger Style
```tsx
// Field.tsx wrapper
export function Field({ label, htmlFor, children, action }: { label: string; htmlFor?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center justify-between gap-1.5">
        <label htmlFor={htmlFor} className="eyebrow text-[0.625rem] text-muted-foreground truncate">{label}</label>
        {action}
      </div>
      {children}
    </div>
  )
}

// Universal Trigger Button Style (compact 34px height for data density)
export const triggerClass =
  "flex h-8.5 w-full min-w-0 items-center justify-between gap-1.5 rounded-xl border border-input bg-background/60 px-2.5 text-left text-xs shadow-xs transition-[color,box-shadow,background-color] outline-none hover:bg-background/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 data-[state=open]:border-ring data-[state=open]:ring-3 data-[state=open]:ring-ring/20 dark:bg-white/5 dark:hover:bg-white/10"
```

---

### 4. Categorization Badges
Rendered under item titles for instant visual metadata without adding vertical bloat:
```tsx
<div className="mt-0.5 flex flex-wrap items-center gap-1">
  {/* Sector Badge */}
  <span className="inline-flex items-center rounded-md bg-secondary/80 px-1 py-0.25 text-[0.575rem] font-medium text-secondary-foreground">
    Academy converter
  </span>
  
  {/* Faith Badge */}
  <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-1 py-0.25 text-[0.575rem] font-medium text-primary">
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
    <span className="tabular rounded-full bg-primary/12 px-1.5 py-0.5 text-[0.65rem] font-semibold text-primary">
      {value.length}
    </span>
  )}
  <ChevronsUpDown className="size-3.5 text-muted-foreground" />
</span>
```

---

### 6. High-Density Table Layout
Optimized for dense tabular data with sticky navigation columns:
- **Sticky Rank `#` Column**: Fixed width `w-9`, `left-0`, `px-2 text-right`.
- **Sticky School Column**: `left-9`, `min-w-48 max-w-72`, `px-2.5 py-1.5`. Title set to `text-[0.84rem]` with tight line height.
- **Metric Indicator Columns**: Right-aligned tabular numerals `tabular text-[0.8125rem]` with compact cell padding `px-2.5 py-1.5`.
- **Active Sort Column**: Highlighted with `bg-primary/[0.04] font-semibold` for immediate scanability.

---

### 7. Footer & License Attribution
A clean, horizontally centered bar separated by subtle delimiters:
```tsx
<footer className="mt-auto border-t border-border/40 py-6 text-xs text-muted-foreground">
  <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-3 gap-y-2 px-3 text-center sm:px-6">
    <span>Released under the <a href="https://opensource.org/licenses/MIT" className="font-medium text-foreground underline-offset-4 hover:underline">MIT License</a></span>
    <span aria-hidden="true" className="text-border">|</span>
    <span>Contains DfE public sector data licensed under OGL v3.0</span>
    <span aria-hidden="true" className="text-border">|</span>
    <a href="https://github.com/edmondcck" aria-label="GitHub profile @edmondcck" className="inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
      <GithubIcon className="size-4" />
    </a>
  </div>
</footer>
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
   - `PageHero.tsx` (compact editorial header)
   - `Field.tsx` (form field container with eyebrow label & trigger styling)
   - `Footer.tsx` (centered license attribution & GitHub profile link)
   - `StatePanels.tsx` (loading skeleton, empty state, error banner)
   - `ThemeProvider.tsx` (theme switcher with persistent localStorage and smooth cross-fade)
