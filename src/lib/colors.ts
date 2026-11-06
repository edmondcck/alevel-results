/** 20 well-separated hues (golden-angle walk), tuned per theme for contrast. */
export function seriesColor(i: number, theme: "light" | "dark") {
  const hue = (200 + i * 137.508) % 360
  const l = theme === "light" ? (i % 2 ? 0.6 : 0.5) : i % 2 ? 0.7 : 0.8
  const c = theme === "light" ? 0.14 : 0.13
  return `oklch(${l} ${c} ${hue.toFixed(1)})`
}
