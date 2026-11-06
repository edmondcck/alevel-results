import { describe, expect, it } from "vitest"
import {
  classifySchool,
  getSchoolSubcategory,
  isMainstreamSchool,
  isSpecialSchool,
  matchesFaith,
  matchesSchoolType,
} from "./schoolInfo"

describe("schoolInfo with official GIAS data", () => {
  it("classifies Eden Boys' School, Bolton as Free school and Muslim", () => {
    const info = classifySchool("Eden Boys' School, Bolton", "3504000", "140959")
    expect(info.type).toBe("Free schools")
    expect(info.religion).toBe("Muslim")
    expect(info.isFaithSchool).toBe(true)
  })

  it("classifies Canon Slade School as Academy converter and Church of England", () => {
    const info = classifySchool("Canon Slade School", "3505401", "144044")
    expect(info.type).toBe("Academy converter")
    expect(info.religion).toBe("Church of England")
    expect(info.isFaithSchool).toBe(true)
  })

  it("classifies Bolton Sixth Form College and Salford City College as Further education (mainstream_college)", () => {
    const bsfc = classifySchool("Bolton Sixth Form College", "3508602", "131867")
    expect(bsfc.type).toBe("Further education")
    expect(bsfc.isFaithSchool).toBe(false)
    expect(getSchoolSubcategory(bsfc.type)).toBe("mainstream_college")
    expect(matchesSchoolType(bsfc.type, ["mainstream_college"])).toBe(true)
    expect(matchesSchoolType(bsfc.type, ["College"])).toBe(true)

    const scc = classifySchool("Salford City College", "3558005", "130509")
    expect(scc.type).toBe("Further education")
    expect(getSchoolSubcategory(scc.type)).toBe("mainstream_college")
  })

  it("classifies Bolton School Girls' Division as Other independent school and non-faith", () => {
    const info = classifySchool("Bolton School Girls' Division", "3506015", "105272")
    expect(info.type).toBe("Other independent school")
    expect(info.religion).toBe("None")
    expect(info.isFaithSchool).toBe(false)
    expect(matchesSchoolType(info.type, ["Independent"])).toBe(true)
  })

  it("classifies Bolton Islamic Girls School as Other independent school and Islam", () => {
    const info = classifySchool("Bolton Islamic Girls School", "3506001", "138498")
    expect(info.type).toBe("Other independent school")
    expect(info.religion).toBe("Islam")
    expect(info.isFaithSchool).toBe(true)
    expect(matchesSchoolType(info.type, ["Independent"])).toBe(true)
    expect(matchesFaith(info.religion, info.isFaithSchool, ["Muslim"])).toBe(true)
  })

  it("correctly matches multi-select school types", () => {
    expect(matchesSchoolType("Free schools", ["mainstream_academy"])).toBe(true)
    expect(matchesSchoolType("Academy converter", ["mainstream_academy"])).toBe(true)
    expect(matchesSchoolType("Further education", ["mainstream_college"])).toBe(true)
    expect(matchesSchoolType("Sixth form centres", ["mainstream_college"])).toBe(true)
    expect(matchesSchoolType("Community school", ["mainstream_community"])).toBe(true)
    expect(matchesSchoolType("Community school", ["mainstream_academy"])).toBe(false)
    expect(matchesSchoolType("Voluntary aided school", ["mainstream_va"])).toBe(true)
    // Legacy support
    expect(matchesSchoolType("Free schools", ["Academy"])).toBe(true)
    expect(matchesSchoolType("Community school", ["Community"])).toBe(true)
  })

  it("classifies mainstream test examples correctly", () => {
    const kearsley = classifySchool("Kearsley Academy", "3506907", "136135")
    expect(kearsley.type).toBe("Academy sponsor led")
    expect(isSpecialSchool(kearsley.type)).toBe(false)
    expect(isMainstreamSchool(kearsley.type)).toBe(true)
    expect(getSchoolSubcategory(kearsley.type)).toBe("mainstream_academy")
    expect(matchesSchoolType(kearsley.type, ["mainstream_academy"])).toBe(true)
    expect(matchesSchoolType(kearsley.type, ["special_academy"])).toBe(false)

    const canonSlade = classifySchool("Canon Slade School", "3505401", "144044")
    expect(canonSlade.type).toBe("Academy converter")
    expect(isSpecialSchool(canonSlade.type)).toBe(false)
    expect(isMainstreamSchool(canonSlade.type)).toBe(true)
    expect(getSchoolSubcategory(canonSlade.type)).toBe("mainstream_academy")
    expect(matchesSchoolType(canonSlade.type, ["mainstream_academy"])).toBe(true)

    const stAmbrose = classifySchool("St Ambrose Barlow RC High School", "3555400", "105989")
    expect(stAmbrose.type).toBe("Voluntary aided school")
    expect(isSpecialSchool(stAmbrose.type)).toBe(false)
    expect(isMainstreamSchool(stAmbrose.type)).toBe(true)
    expect(getSchoolSubcategory(stAmbrose.type)).toBe("mainstream_va")
    expect(matchesSchoolType(stAmbrose.type, ["mainstream_va"])).toBe(true)
    expect(matchesSchoolType(stAmbrose.type, ["special_academy"])).toBe(false)
  })

  it("classifies special school test examples correctly", () => {
    const leverPark = classifySchool("Lever Park School", "3507006", "142766")
    expect(leverPark.type).toBe("Academy special sponsor led")
    expect(isSpecialSchool(leverPark.type)).toBe(true)
    expect(isMainstreamSchool(leverPark.type)).toBe(false)
    expect(getSchoolSubcategory(leverPark.type)).toBe("special_academy")
    expect(matchesSchoolType(leverPark.type, ["mainstream_academy"])).toBe(false)
    expect(matchesSchoolType(leverPark.type, ["Academy"])).toBe(false)
    expect(matchesSchoolType(leverPark.type, ["special_academy"])).toBe(true)

    const oakwood = classifySchool("Oakwood Academy", "3557025", "138130")
    expect(oakwood.type).toBe("Academy special converter")
    expect(isSpecialSchool(oakwood.type)).toBe(true)
    expect(isMainstreamSchool(oakwood.type)).toBe(false)
    expect(getSchoolSubcategory(oakwood.type)).toBe("special_academy")
    expect(matchesSchoolType(oakwood.type, ["mainstream_academy"])).toBe(false)
    expect(matchesSchoolType(oakwood.type, ["Academy"])).toBe(false)
    expect(matchesSchoolType(oakwood.type, ["special_academy"])).toBe(true)

    const changingLives = classifySchool("Changing Lives", undefined, "149213")
    expect(changingLives.type).toBe("Other independent special school")
    expect(isSpecialSchool(changingLives.type)).toBe(true)
    expect(isMainstreamSchool(changingLives.type)).toBe(false)
    expect(getSchoolSubcategory(changingLives.type)).toBe("special_independent")
    expect(matchesSchoolType(changingLives.type, ["mainstream_independent"])).toBe(false)
    expect(matchesSchoolType(changingLives.type, ["special_independent"])).toBe(true)
  })

  it("correctly matches multi-select faiths", () => {
    expect(matchesFaith("Muslim", true, ["Muslim"])).toBe(true)
    expect(matchesFaith("Church of England", true, ["Church of England"])).toBe(true)
    expect(matchesFaith("Does not apply", false, ["None"])).toBe(true)
    expect(matchesFaith("None", false, ["None"])).toBe(true)
    expect(matchesFaith("Muslim", true, ["Church of England"])).toBe(false)
  })
})
