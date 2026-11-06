/**
 * UI smoke test + screenshots for the A-Level Results site.
 * Usage: node scripts/ui-check.mjs [baseUrl] [outDir]
 * Requires the dev server (npm run dev) or a static server to be running.
 */
import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { chromium } from "playwright"

const BASE = process.argv[2] ?? "http://localhost:5173/"
const OUT = process.argv[3] ?? "screenshots"
mkdirSync(OUT, { recursive: true })

const report = []
const log = (step, ok, detail = "") => {
  report.push({ step, ok, detail })
  console.log(`${ok ? "PASS" : "FAIL"}  ${step}${detail ? ` — ${detail}` : ""}`)
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await context.newPage()
const consoleErrors = []
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()))
page.on("pageerror", (e) => consoleErrors.push(String(e)))

const shot = (name, opts = {}) => page.screenshot({ path: join(OUT, `${name}.png`), ...opts })
const headers = () =>
  page.$$eval("#results-table thead th", (ths) => ths.map((t) => t.innerText.replace(/\s+/g, " ").trim()))
const waitForRows = () =>
  page.waitForFunction(
    () => document.querySelectorAll("#results-table tbody tr td .font-display").length > 0,
    null,
    { timeout: 30000 },
  )

// 1. Initial load -------------------------------------------------------------
await page.goto(BASE)
await waitForRows()
await page.waitForTimeout(800)
await shot("01-school-performance-light")

const title = await page.locator("header").first().innerText()
log(
  "Top bar title + links + toggle",
  /A-Level\s+Results/.test(title) && title.includes("School Performance") && title.includes("Dashboard"),
  title.replace(/\s+/g, " "),
)
log("Light theme by default", !(await page.evaluate(() => document.documentElement.classList.contains("dark"))))

const yearText = await page.locator("#year-select").innerText()
const laText = await page.locator("#la-select").innerText()
const groupText = await page.locator("#group-select").innerText()
const colText = await page.locator("#column-select").innerText()
log(
  "Default filters",
  yearText.includes("2024-25") &&
    laText.includes("Bolton, Salford") &&
    groupText.includes("All pupils") &&
    colText.includes("6 columns"),
  `${yearText.trim()} | ${laText.replace(/\s+/g, " ").trim()} | ${groupText.trim()} | ${colText.trim()}`,
)

const h = await headers()
const expected = [
  "APS per entry",
  "Best 3 A levels",
  "% AAB+ (facilitating)",
  "Value added",
  "% Retained",
  "16–18 students",
]
log("Default column order", expected.every((e, i) => h[i + 2]?.includes(e)), h.join(" | "))

// 2. Dashboard ----------------------------------------------------------------
await page.click("#nav-dashboard")
await page.waitForFunction(() => document.querySelectorAll(".recharts-line").length > 0, null, { timeout: 30000 })
await page.waitForTimeout(1000)
const charts = await page.$$eval("section[id^=chart-]", (s) =>
  s.map((x) => ({
    id: x.id,
    title: x.querySelector("h2")?.textContent,
    lines: x.querySelectorAll(".recharts-line").length,
  })),
)
log("Dashboard has 7 charts", charts.length === 7, charts.map((c) => `${c.title}:${c.lines}`).join(" | "))
await shot("02-dashboard-light", { fullPage: true })

log("No console errors", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" || "))

await browser.close()
const failed = report.filter((r) => !r.ok)
console.log(`\n${report.length - failed.length}/${report.length} checks passed`)
process.exit(failed.length ? 1 : 0)
