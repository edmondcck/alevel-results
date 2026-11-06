/**
 * Fetches 2023-24 institution-level "Best 3 A levels" and "% achieving >= AAB (facilitating)"
 * data from the DfE Explore Education Statistics 2023-24 release TableBuilder API
 * (https://explore-education-statistics.service.gov.uk/find-statistics/16-to-19-performance/2023-24)
 * and writes src/data/best3-aab-202324.json keyed by the 2024-25 EES school location ID (SCH).
 *
 * Why this is needed:
 * - In the 2024-25 dataset (019c2960-81e3-70c2-8d65-72c3718ae4fd), DfE only populated
 *   "APS per 'Best 3' entries" (qGU8j), "APS per 'Best 3' entries (grade)" (a275L),
 *   "% achieving >= AAB for a minimum of 2 facilitating subjects" (IXW3B),
 *   "Number of students entered for >= 1 A level" (cZzR3), and
 *   "Number of students entered for >= 1 A level or applied A level" (5TNzd)
 *   for 2024/2025, leaving 2021/22–2023/24 as "z".
 * - The 2023-24 release has those indicators populated for 2023/2024 in dataset
 *   "16 to 18 institution level 2024 final data - Schools and colleges (performance)"
 *   (releaseVersionId: 19157c8c-c75f-4bef-ba68-c3dd3b6d1d96,
 *    subjectId: 74052b52-ef04-4d43-a5c4-08dd978934b7).
 * - Earlier releases (2021-22 and 2022-23) on EES only published National, Regional,
 *   and Local Authority aggregate datasets, not school/institution-level datasets.
 */
import { writeFileSync } from "node:fs"

const DATASET_2024_25_ID = "019c2960-81e3-70c2-8d65-72c3718ae4fd"
const META_2024_25_URL = `https://api.education.gov.uk/statistics/v1/data-sets/${DATASET_2024_25_ID}/meta`

const RELEASE_VERSION_ID = "19157c8c-c75f-4bef-ba68-c3dd3b6d1d96"
const SUBJECT_ID = "74052b52-ef04-4d43-a5c4-08dd978934b7"
const META_2023_24_URL = `https://data.explore-education-statistics.service.gov.uk/api/release/${RELEASE_VERSION_ID}/meta/subject/${SUBJECT_ID}`
const TB_URL = `https://data.explore-education-statistics.service.gov.uk/api/tablebuilder/release/${RELEASE_VERSION_ID}`

// Map 2023-24 TableBuilder indicator IDs -> 2024-25 Public API v1 indicator IDs
const IND_MAP = {
  "7f534f6f-c725-482d-0382-08dd97893565": "qGU8j", // APS per 'Best 3' entries
  "90072c67-cf33-489b-0383-08dd97893565": "a275L", // APS per 'Best 3' entries (grade)
  "c2f55791-a044-434b-0385-08dd97893565": "IXW3B", // % achieving >= AAB for a minimum of 2 facilitating subjects
  "aa4d07f5-5033-4f73-0386-08dd97893565": "cZzR3", // Number of students entered for >= 1 A level
  "7e85544d-0765-42fb-0384-08dd97893565": "5TNzd", // Number of students entered for >= 1 A level or applied A level
}

const FILTER_A_LEVEL = "62f6d223-b706-4d4c-8780-45654259c2ea"
const FILTER_ALL_STUDENTS = "6e065612-e836-465d-b847-238f5330a39b"

async function main() {
  console.log("Fetching 2024-25 dataset metadata for URN -> SCH ID mapping...")
  const meta2425Res = await fetch(META_2024_25_URL)
  if (!meta2425Res.ok) throw new Error(`2024-25 Metadata HTTP ${meta2425Res.status}`)
  const meta2425 = await meta2425Res.json()
  const schGroup = meta2425.locations.find((l) => l.level.code === "SCH")
  const urnToSchId = new Map()
  for (const s of schGroup?.options ?? []) {
    if (s.urn) urnToSchId.set(String(s.urn), s.id)
  }

  console.log("Fetching 2023-24 subject metadata from EES TableBuilder API...")
  const metaRes = await fetch(META_2023_24_URL)
  if (!metaRes.ok) throw new Error(`2023-24 Metadata HTTP ${metaRes.status}`)
  const sm = await metaRes.json()

  const laGroups = sm.locations.school.options
  const tbIdToSchId = new Map()
  for (const la of laGroups) {
    for (const s of la.options) {
      const schId = urnToSchId.get(String(s.value))
      if (schId) tbIdToSchId.set(s.id, schId)
    }
  }
  console.log(
    `Matched ${tbIdToSchId.size} institutions between 2023-24 and 2024-25 datasets.`,
  )

  const allIds = [...tbIdToSchId.keys()]
  const out = {}
  const batchSize = 300

  for (let i = 0; i < allIds.length; i += batchSize) {
    const batch = allIds.slice(i, i + batchSize)
    const payload = {
      subjectId: SUBJECT_ID,
      indicators: Object.keys(IND_MAP),
      filters: [FILTER_A_LEVEL, FILTER_ALL_STUDENTS],
      locationIds: batch,
      timePeriod: {
        startYear: 2023,
        startCode: "AY",
        endYear: 2023,
        endCode: "AY",
      },
    }
    const r = await fetch(TB_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!r.ok) throw new Error(`TableBuilder HTTP ${r.status}`)
    const data = await r.json()

    for (const row of data.results || []) {
      const locId =
        row.geographicLevel === "school" ? row.locationId : row.location && row.location.school
      const schId = tbIdToSchId.get(locId)
      if (!schId) continue
      const m = row.measures || {}
      const mapped = {}
      let hasUseful = false
      for (const [oldId, newId] of Object.entries(IND_MAP)) {
        const val = m[oldId]
        if (val !== undefined && val !== "z") {
          mapped[newId] = val
          hasUseful = true
        }
      }
      if (hasUseful) out[schId] = mapped
    }
  }

  const outPath = "src/data/best3-aab-202324.json"
  writeFileSync(outPath, JSON.stringify(out))
  console.log(`Wrote ${Object.keys(out).length} institutions to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
