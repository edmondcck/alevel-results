/**
 * Official GIAS (Get Information About Schools) Integration.
 *
 * Source: Department for Education (DfE) Get Information About Schools
 * https://get-information-schools.service.gov.uk/
 *
 * All school types and religious character classifications are mapped
 * directly from official DfE GIAS records by URN.
 */

import giasRaw from "@/data/gias.json"

export type SchoolType = string
export type ReligiousCharacter = string

export interface SchoolClassification {
  type: string
  religion: string
  isFaithSchool: boolean
}

const gias = giasRaw as Record<string, { type: string; religion: string }>

/**
 * Returns the official DfE GIAS classification for a given school URN.
 */
export function classifySchool(
  _name?: string,
  _laEstab?: string,
  urn?: string,
): SchoolClassification {
  if (urn && gias[urn]) {
    const entry = gias[urn]
    const type = entry.type || "Other"
    const religion = entry.religion || "None"
    const isFaith =
      religion !== "None" &&
      religion !== "Does not apply" &&
      religion !== "Not applicable" &&
      religion !== ""

    return {
      type,
      religion,
      isFaithSchool: isFaith,
    }
  }

  return {
    type: "Other",
    religion: "None",
    isFaithSchool: false,
  }
}

/**
 * Checks whether an official DfE school type represents a special school,
 * alternative provision, or pupil referral unit.
 */
export function isSpecialSchool(officialType: string): boolean {
  const lower = (officialType || "").toLowerCase()
  return (
    lower.includes("special") ||
    lower.includes("pupil referral unit") ||
    lower.includes("alternative provision") ||
    lower.includes("secure unit")
  )
}

/**
 * Checks whether an official DfE school type represents a mainstream school
 * (including independent/private mainstream schools and FE/sixth form colleges).
 */
export function isMainstreamSchool(officialType: string): boolean {
  return !isSpecialSchool(officialType)
}

/**
 * Classifies an official GIAS school type into our canonical provision subcategories:
 * Mainstream:
 *  - mainstream_academy (Academy / Free School / UTC / Studio)
 *  - mainstream_college (Further education / Sixth form college)
 *  - mainstream_community (Community school)
 *  - mainstream_va (Voluntary Aided)
 *  - mainstream_vc (Voluntary Controlled)
 *  - mainstream_foundation (Foundation school)
 *  - mainstream_independent (Independent / Private)
 *  - mainstream_other (Other mainstream)
 *
 * Special:
 *  - special_academy (Academy special / Free school special)
 *  - special_maintained (Community/foundation/non-maintained special)
 *  - special_independent (Independent special school)
 *  - special_ap_pru (Alternative provision / PRU / Secure unit)
 */
export function getSchoolSubcategory(officialType: string): string {
  const lower = (officialType || "").toLowerCase()

  if (isSpecialSchool(officialType)) {
    if (lower.includes("independent")) return "special_independent"
    if (lower.includes("academy") || lower.includes("free school")) return "special_academy"
    if (
      lower.includes("pupil referral unit") ||
      lower.includes("alternative provision") ||
      lower.includes("secure unit")
    ) {
      return "special_ap_pru"
    }
    return "special_maintained"
  }

  // Mainstream provision (all non-special schools and colleges)
  if (lower.includes("independent")) return "mainstream_independent"
  if (
    lower.includes("academy") ||
    lower.includes("free school") ||
    lower.includes("university technical college") ||
    lower.includes("studio school") ||
    lower.includes("city technology")
  ) {
    return "mainstream_academy"
  }
  if (lower.includes("further education") || lower.includes("sixth form")) {
    return "mainstream_college"
  }
  if (lower.includes("community")) return "mainstream_community"
  if (lower.includes("voluntary aided")) return "mainstream_va"
  if (lower.includes("voluntary controlled")) return "mainstream_vc"
  if (lower.includes("foundation")) return "mainstream_foundation"
  return "mainstream_other"
}

/**
 * Checks if a school's official type matches the user's multi-selected types.
 * Respects provision segregation: special schools never match mainstream categories.
 */
export function matchesSchoolType(officialType: string, selectedTypes: string[]): boolean {
  if (selectedTypes.length === 0) return true
  const subcategory = getSchoolSubcategory(officialType)
  const isSpecial = isSpecialSchool(officialType)

  if (selectedTypes.includes(subcategory)) return true
  if (selectedTypes.includes("mainstream_other") && !isSpecial) return true

  // Provision-level category matches
  if (selectedTypes.includes("Mainstream School") && !isSpecial) return true
  if (selectedTypes.includes("Special School") && isSpecial) return true

  // Backward compatibility with legacy option labels
  const lower = (officialType || "").toLowerCase()
  return selectedTypes.some((selected) => {
    switch (selected) {
      case "Academy":
        return !isSpecial && (lower.includes("academy") || lower.includes("free school"))
      case "College":
      case "Further Education":
        return !isSpecial && (lower.includes("further education") || lower.includes("sixth form"))
      case "Community":
        return !isSpecial && lower.includes("community")
      case "Voluntary Aided":
        return !isSpecial && lower.includes("voluntary aided")
      case "Voluntary Controlled":
        return !isSpecial && lower.includes("voluntary controlled")
      case "Foundation":
        return !isSpecial && lower.includes("foundation")
      case "Independent":
        return lower.includes("independent")
      case "Special":
        return isSpecial
      default:
        return false
    }
  })
}

/**
 * Checks if a school's official religion matches the user's multi-selected faiths.
 */
export function matchesFaith(
  officialReligion: string,
  isFaithSchool: boolean,
  selectedFaiths: string[],
): boolean {
  if (selectedFaiths.length === 0) return true
  const lower = (officialReligion || "").toLowerCase()
  return selectedFaiths.some((selected) => {
    switch (selected) {
      case "None":
        return (
          !isFaithSchool ||
          lower === "none" ||
          lower === "does not apply" ||
          lower === "not applicable" ||
          lower === ""
        )
      case "Roman Catholic":
        return lower.includes("catholic")
      case "Church of England":
        return lower.includes("church of england") || lower.includes("anglican")
      case "Muslim":
        return lower.includes("muslim") || lower.includes("islam")
      case "Jewish":
        return lower.includes("jewish")
      case "Sikh":
        return lower.includes("sikh")
      case "Hindu":
        return lower.includes("hindu")
      case "Christian":
        return lower.includes("christian")
      default:
        return lower.includes(selected.toLowerCase())
    }
  })
}
