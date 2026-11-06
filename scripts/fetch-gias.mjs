/**
 * Fetches the official GIAS (Get Information About Schools) CSV from the
 * Department for Education (DfE) and extracts official school types and
 * religious character records mapped by URN.
 *
 * Source: https://get-information-schools.service.gov.uk/
 * Public daily extract endpoint:
 * https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldataYYYYMMDD.csv
 *
 * Usage: node scripts/fetch-gias.mjs
 */

import { writeFileSync, mkdirSync, existsSync, createReadStream, readdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import readline from "node:readline"
import { Readable } from "node:stream"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_FILE = resolve(__dirname, "../src/data/gias.json")

function findLocalCsv() {
  const dirs = [resolve(__dirname, ".."), __dirname]
  for (const dir of dirs) {
    if (!existsSync(dir)) continue
    const files = readdirSync(dir)
    const match = files.find((f) => f.startsWith("edubasealldata") && f.endsWith(".csv"))
    if (match) return resolve(dir, match)
  }
  return null
}

function formatDate(d) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}${mm}${dd}`
}

async function findLatestGiasUrl() {
  const now = new Date()
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Range: "bytes=0-10",
  }

  for (let i = 0; i < 30; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = formatDate(d)

    const candidates = [
      `https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata${dateStr}.csv`,
      `https://ea-edubase-api-prod.azurewebsites.net/edubase/edubasealldata${dateStr}.csv`,
      `http://ea-edubase-api-prod.azurewebsites.net/edubase/edubasealldata${dateStr}.csv`,
    ]

    for (const url of candidates) {
      try {
        const res = await fetch(url, { headers })
        if (res.status === 200 || res.status === 206) {
          console.log(`Found active GIAS extract (${res.status}): ${url}`)
          return { url, dateStr }
        }
      } catch (e) {
        // Continue
      }
    }
  }
  throw new Error("Could not find a recent GIAS download extract from DfE.")
}

function parseCsvLine(line) {
  const result = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (c === "," && !inQuotes) {
      result.push(cur.trim())
      cur = ""
    } else {
      cur += c
    }
  }
  result.push(cur.trim())
  return result
}

async function run() {
  const localFile = findLocalCsv()
  let inputStream

  if (localFile) {
    console.log(`Found local official GIAS extract file: ${localFile}`)
    inputStream = createReadStream(localFile)
  } else {
    const { url, dateStr } = await findLatestGiasUrl()
    console.log(`Downloading official GIAS data for ${dateStr} (~80MB)... this may take a moment.`)

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    })
    if (!res.ok) throw new Error(`Failed to download GIAS data (${res.status})`)
    inputStream = Readable.fromWeb(res.body)
  }

  const rl = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  })

  let urnIdx = -1
  let typeIdx = -1
  let relIdx = -1
  let ethosIdx = -1
  let phaseIdx = -1
  let statusIdx = -1

  const giasMap = {}
  let lineCount = 0
  let matchedCount = 0

  for await (const line of rl) {
    if (!line) continue
    lineCount++

    if (lineCount === 1) {
      const header = parseCsvLine(line)
      urnIdx = header.findIndex((h) => h === "URN")
      typeIdx = header.findIndex(
        (h) => h === "TypeOfEstablishment (name)" || h === "TypeOfEstablishment"
      )
      relIdx = header.findIndex(
        (h) => h === "ReligiousCharacter (name)" || h === "ReligiousCharacter"
      )
      ethosIdx = header.findIndex(
        (h) => h === "ReligiousEthos (name)" || h === "ReligiousEthos"
      )
      phaseIdx = header.findIndex(
        (h) => h === "PhaseOfEducation (name)" || h === "PhaseOfEducation"
      )
      statusIdx = header.findIndex(
        (h) => h === "EstablishmentStatus (name)" || h === "EstablishmentStatus"
      )

      if (urnIdx === -1 || typeIdx === -1 || relIdx === -1) {
        throw new Error(
          `Could not locate required columns in GIAS header: URN=${urnIdx}, Type=${typeIdx}, Rel=${relIdx}`
        )
      }
      continue
    }

    const row = parseCsvLine(line)
    const urn = row[urnIdx]
    const type = row[typeIdx]
    const relChar = row[relIdx] || ""
    const relEthos = ethosIdx !== -1 ? row[ethosIdx] || "" : ""

    const isNonFaith = (val) =>
      !val ||
      val === "None" ||
      val === "Does not apply" ||
      val === "Not applicable" ||
      /^\d+$/.test(val)

    // DfE records official faith under ReligiousCharacter for state/maintained schools,
    // and under ReligiousEthos for Independent and Free schools.
    let religion = relChar
    if (isNonFaith(religion) && !isNonFaith(relEthos)) {
      religion = relEthos
    }
    if (!religion || (isNonFaith(religion) && isNonFaith(relEthos))) {
      religion = relChar || "None"
    }

    const phase = phaseIdx !== -1 ? row[phaseIdx] : ""
    const status = statusIdx !== -1 ? row[statusIdx] : ""

    if (!urn) continue

    // Keep secondary, independent, all-through, 16+, FE, and special/PRU schools.
    // Note: GIAS sets PhaseOfEducation to "Not applicable" for Independent schools
    // and "Middle deemed secondary" (lowercase s) for middle schools with sixth forms.
    const phaseLower = phase.toLowerCase()
    const typeLower = type.toLowerCase()
    const isSecondaryOrRelevant =
      !phase ||
      phase === "Not applicable" ||
      phaseLower.includes("secondary") ||
      phaseLower.includes("all-through") ||
      phaseLower.includes("16 plus") ||
      phaseLower.includes("special") ||
      phaseLower.includes("pupil referral unit") ||
      phaseLower.includes("alternative provision") ||
      typeLower.includes("independent") ||
      typeLower.includes("further education") ||
      typeLower.includes("sixth form") ||
      typeLower.includes("16 to 19") ||
      typeLower.includes("16-19")

    if (isSecondaryOrRelevant) {
      giasMap[urn] = {
        type: type || "Other",
        religion: religion || "None",
      }
      matchedCount++
    }
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true })
  writeFileSync(OUT_FILE, JSON.stringify(giasMap))
  console.log(
    `Successfully generated official GIAS lookup: ${matchedCount} establishments saved to ${OUT_FILE}`
  )
}

run().catch((err) => {
  console.error("GIAS fetch failed:", err)
  process.exit(1)
})
