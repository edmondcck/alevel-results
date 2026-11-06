import { describe, expect, it } from "vitest"
import { buildPupilGroups } from "./pupilGroups"
import type { FilterMeta } from "./ees"

describe("buildPupilGroups", () => {
  it("sorts Disadvantaged with Not Disadvantaged first and Exam cohort in track order", () => {
    const mockFilters: FilterMeta[] = [
      {
        id: "f_disadv",
        column: "disadvantage_status",
        label: "Disadvantaged status",
        hint: "",
        options: [
          { id: "opt_dis", label: "Disadvantaged" },
          { id: "opt_not_dis", label: "Not disadvantaged" },
          { id: "opt_tot_dis", label: "Total" },
        ],
      },
      {
        id: "f_cohort",
        column: "exam_cohort",
        label: "Exam cohort",
        hint: "",
        options: [
          { id: "opt_em", label: "E/M measures" },
          { id: "opt_tech", label: "Tech level" },
          { id: "opt_alevel", label: "A level" },
          { id: "opt_app", label: "Applied general" },
          { id: "opt_acad", label: "Academic" },
          { id: "opt_cert", label: "Technical certificate" },
        ],
      },
    ]

    const groups = buildPupilGroups(mockFilters)

    // Baseline ("All pupils") matches Total + A level
    expect(groups[0].match).toEqual({
      f_disadv: "opt_tot_dis",
      f_cohort: "opt_alevel",
    })

    // Check Disadvantaged ordering: "Not disadvantaged" then "Disadvantaged"
    const disadvGroups = groups.filter((g) => g.category === "Disadvantaged status")
    expect(disadvGroups.map((g) => g.label)).toEqual([
      "Not disadvantaged",
      "Disadvantaged",
    ])

    // Check Exam cohort ordering
    const cohortGroups = groups.filter((g) => g.category === "Exam cohort")
    expect(cohortGroups.map((g) => g.label)).toEqual([
      "Academic",
      "Applied general",
      "Tech level",
      "Technical certificate",
      "English & maths retakes",
    ])
  })
})
