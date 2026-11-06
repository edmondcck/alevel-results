# A-Level School & College Performance & Trends

> 🌐 **Live Web App**: The application is live and accessible at **[https://alevel-results.pages.dev](https://alevel-results.pages.dev)**

A modern web application for exploring 16 to 19 (A-Level, Academic, Applied General, and Technical) performance data, institution characteristics, and year-on-year trends for schools, sixth forms, and colleges in England. Data is queried live from the Department for Education (DfE) [Explore Education Statistics (EES) API](https://api.education.gov.uk/statistics/docs/) and enriched with official institution types and religious character from [Get Information About Schools (GIAS)](https://get-information-schools.service.gov.uk/).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [School Performance Data Architecture & Metrics](#school-performance-data-architecture--metrics)
  - [1. API Architecture & Query Model](#1-api-architecture--query-model)
  - [2. Core Headline 16 to 19 Measures](#2-core-headline-16-to-19-measures)
  - [3. Demographic & Qualification Cohort Breakdowns](#3-demographic--qualification-cohort-breakdowns)
  - [4. Data Normalization & Suppression Handling](#4-data-normalization--suppression-handling)
  - [5. Geographic Local Authority Detection ("Near me")](#5-geographic-local-authority-detection-near-me)
- [School Classification Architecture & Logic](#school-classification-architecture--logic)
  - [1. Data Sources](#1-data-sources)
  - [2. School Provision Classification Logic](#2-school-provision-classification-logic)
  - [3. Filter vs. Column Customization State](#3-filter-vs-column-customization-state)
  - [4. Religious Character vs. Religious Ethos](#4-religious-character-vs-religious-ethos)
- [Getting Started](#getting-started)
  - [1. Install Dependencies](#1-install-dependencies)
  - [2. (Optional) Refresh Official GIAS & 2023-24 Supplement Data](#2-optional-refresh-official-gias--2023-24-supplement-data)
  - [3. Run Local Development Server](#3-run-local-development-server)
- [Build & Preview](#build--preview)
  - [Build for Production](#build-for-production)
  - [Preview Production Build Locally](#preview-production-build-locally)
- [Deploying to Cloudflare](#deploying-to-cloudflare)
  - [Option A: Deploy via Wrangler CLI (Fastest)](#option-a-deploy-via-wrangler-cli-fastest)
  - [Option B: Continuous Deployment via Git (Recommended for Production)](#option-b-continuous-deployment-via-git-recommended-for-production)
- [Testing & Linting](#testing--linting)
- [Design System](#design-system)
- [License](#license)

---

## Features

- **School & College Performance Tables**: Multi-select filtering by Local Authority, pupil demographic groups & qualification cohorts (`A level`, `Academic`, `Applied general`, `Tech level`, `Technical certificate`, `Disadvantaged`, `Not disadvantaged`), academic year, institution type (including Sixth Form and FE Colleges), religious character, and customizable metric columns.
- **Inline Qualitative Grade Badges**: Automatically fetches and displays official qualitative letter grades (`A*`–`E`, `Dist*`–`Pass`) alongside numeric `APS per entry` and `Best 3 A levels` scores.
- **State Mainstream Default & Dual Reset**: Defaults to state-funded mainstream schools and sixth form / FE colleges. A one-click **Reset filters** button restores filter selectors and sorting to defaults without touching custom columns or selected Local Authorities and Year. A dedicated **Reset columns** button appears to restore column layout independently.
- **Cross-Page Synchronization**: Filter selections (LAs, pupil groups / cohorts, school types, and religious character) seamlessly carry forward when switching between the Performance Table and the Dashboard.
- **Sorting & Measure Explanations**: Interactive sorting by any numeric or qualitative measure (APS per entry, Best 3 A levels, % AAB+ in facilitating subjects, Value Added, % Retained, 16–18 cohort size, etc.) with in-app explanatory tooltips.
- **Historical Dashboard**: Multi-institution trend charts over time (`2021-22` to `2024-25`) powered by Recharts, with full support for Local Authority, pupil group / cohort, institution type, and faith filtering.
- **Design System**: Frosted glass interface with light/dark theme support, smooth typography, and accessible keyboard navigation.

---

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Lucide Icons + Radix UI primitives
- **Data & State**: TanStack React Query (client-side caching & request deduplication)
- **Routing**: React Router (HashRouter for compatibility with static hosting)
- **Deployment Target**: Cloudflare Pages / Static CDN

---

## School Performance Data Architecture & Metrics

The application directly interfaces with the UK Department for Education (DfE) **Explore Education Statistics (EES)** API to deliver real-time, authentic 16 to 19 (Key Stage 5) results.

### 1. API Architecture & Query Model
- **Endpoint**: DfE EES Data API (`/api/v1/data-sets/{datasetId}/query`)
- **Dataset ID**: `019c2960-81e3-70c2-8d65-72c3718ae4fd` (*Schools and colleges - performance*, from the [16 to 19 performance 2024-25 release](https://explore-education-statistics.service.gov.uk/find-statistics/16-to-19-performance/2024-25)), supplemented with `2023-24` institution-level values for `Best 3 A levels` and `% AAB+ (facilitating)` from the [16 to 19 performance 2023-24 release](https://explore-education-statistics.service.gov.uk/find-statistics/16-to-19-performance/2023-24) (`subjectId: 74052b52-ef04-4d43-a5c4-08dd978934b7`).
- **Query Strategy**: Data is queried dynamically by combining criteria:
  - **Locations**: Selected Local Authorities (`LA` codes, e.g. Bolton, Manchester, Salford) and associated schools/colleges (`SCH`).
  - **Time Periods**: Specific academic years (`2021/2022`, `2022/2023`, `2023/2024`, `2024/2025`).
  - **Indicators**: Selected metric IDs (APS per entry, Best 3 A levels, % AAB+, Value added, % Retained, etc.).
- **Caching & Resilience**: Managed by TanStack Query with in-memory caching and request deduplication. If API requests fail, users are presented with retry controls alongside fallback offline fixtures.

#### Why `2023-24` "Best 3" & "% AAB+" Data Must Be Preloaded
On Explore Education Statistics, the **2024-25** and **2023-24** releases are served by two different backend APIs:
1. **2024-25 Public REST API v1 (`api.education.gov.uk/statistics/v1`)**:
   - Serves 4 academic years of rows (`2021-22` to `2024-25`) in a single dataset (`019c2960-81e3-70c2-8d65-72c3718ae4fd`) with full browser CORS support (`Access-Control-Allow-Origin: *`).
   - Core time-series metrics (`APS per entry`, `% retained`, `16–18 students`, and `Value added`) are populated across multiple years directly in this dataset.
   - However, DfE only populated the supplementary single-year columns (`APS per 'Best 3' entries`, `APS per 'Best 3' entries (grade)`, and `% achieving ≥ AAB for a minimum of 2 facilitating subjects`) for the latest year (`2024-25`) and marked `2021-22`–`2023-24` rows as `"z"`.
2. **2023-24 Internal TableBuilder API (`data.explore-education-statistics.service.gov.uk/api`)**:
   - The 2023-24 institution-level dataset (*16 to 18 institution level 2024 final data - Schools and colleges (performance)*, `releaseVersionId: 19157c8c-c75f-4bef-ba68-c3dd3b6d1d96`, `subjectId: 74052b52-ef04-4d43-a5c4-08dd978934b7`) contains the `2023-24` school-level values for `Best 3 A levels` and `% AAB+`, but is flagged `"isApiEnabled": false` (`"publicApiDataSetId": null`) on the Public REST API v1.
   - It is only accessible through EES's internal TableBuilder API (`POST /api/tablebuilder/release/{releaseVersionId}`), which **does not allow cross-origin browser requests** (blocks CORS `OPTIONS` preflight requests).
   - Earlier EES releases (`2021-22` and `2022-23`) only published National, Regional, and Local Authority aggregate datasets, with no school/institution-level datasets on EES.

| Feature | **2024-25 Release** (Primary Live API) | **2023-24 Release** (Preloaded Supplement) |
| :--- | :--- | :--- |
| **API Base URL** | `https://api.education.gov.uk/statistics/v1` (Public API v1) | `https://data.explore-education-statistics.service.gov.uk/api` (Internal TableBuilder API) |
| **Enabled on Public API v1?** | Yes (`isApiEnabled: true`, ID `019c2960-81e3-70c2-8d65-72c3718ae4fd`) | No (`isApiEnabled: false`, `subjectId: 74052b52-ef04-4d43-a5c4-08dd978934b7`) |
| **Browser CORS Support?** | **Yes** (`Access-Control-Allow-Origin: *`) — queried live from the browser in `src/lib/ees.ts` | **No** (rejects cross-origin browser `OPTIONS` preflight requests) |
| **Data Coverage** | All `2021-22` to `2024-25` multi-year metrics, plus `2024-25` `Best 3` & `% AAB+` | `2023-24` school-level `Best 3` & `% AAB+` (extracted via `scripts/fetch-202324-best3-aab.mjs` into `src/data/best3-aab-202324.json` and merged into `2023/2024` rows at runtime) |

### 2. Core Headline 16 to 19 Measures

| Metric | DfE Definition & Calculation | Notes / Availability |
| :--- | :--- | :--- |
| **APS per entry** | Average point score per qualification entry (`0–60` scale where `A* = 60`, `A = 50`, `B = 40`, `C = 30`, `D = 20`, `E = 10`). | Available across all 4 years (`2021-22` to `2024-25`), paired with qualitative grade (`APS per entry (grade)`). |
| **Best 3 A levels** | Average point score across a student's best 3 A-level entries (`0–60` scale), paired with qualitative grade (`APS per 'Best 3' entries (grade)`). | Key university admissions benchmark; available from `2023-24` onwards (`2023-24` merged from the 2023-24 EES institution-level release; `2021-22` and `2022-23` EES releases did not publish school-level datasets). |
| **% AAB+ (facilitating)** | Percentage of A-level students achieving grades `AAB` or higher, including at least two facilitating subjects. | Available from `2023-24` onwards (`2023-24` merged from the 2023-24 EES institution-level release; `2021-22` and `2022-23` EES releases did not publish school-level datasets). |
| **Value added** | Progress score comparing students' 16–18 outcomes against peers nationally with similar GCSE prior attainment (`+0.50` = half a grade higher per entry). | Published from `2023-24` onwards (suspended in `2021-22` and `2022-23` due to COVID GCSE assessment changes). |
| **% Retained** | Percentage of students who completed their main 16–18 study programme at the institution. | Available across all 4 years (`2021-22` to `2024-25`). |
| **16–18 students** | Total number of students at the end of 16–18 study at the institution. | Available across all 4 years (`2021-22` to `2024-25`). |

### 3. Demographic & Qualification Cohort Breakdowns
The DfE EES dataset publishes institution performance along two filter dimensions, modeled with **A level + Total** as the baseline (`All pupils`):
- **Disadvantaged Status** (`Q7Awb`): Students eligible for Pupil Premium / free school meals in KS4. Ordered as `Not disadvantaged` → `Disadvantaged`.
- **Exam Cohort** (`98L4v`): Qualification track breakdown. Ordered logically as `Academic` → `Applied general` → `Tech level` → `Technical certificate` → `English & maths retakes` (`E/M measures`), with `A level` as the default baseline.

The frontend dynamically matches and nests multiple group/cohort selections under each institution in the table.

### 4. Data Normalization & Suppression Handling
DfE datasets utilize special suppression codes to protect student privacy:
- `c`: Suppressed to prevent identification of individual students (e.g. low cohort counts).
- `z`: Not applicable or metric not calculated for that institution/cohort.
- `x` / `u` / `low`: Not available, low reliability, or rounds to zero.
- Suppression codes are safely parsed and always sorted to the bottom in both ascending and descending directions, while numeric scores and qualitative grades (`A*`–`U`, `Dist*`–`Pass`) sort in true academic order.

### 5. Geographic Local Authority Detection ("Near me")
An opt-in **"Near me"** button (`LocateFixed` icon) is positioned to the right of the "Local authorities" label using high-precision browser GPS + reverse geocoding:
1. **Device GPS / Triangulation**: Obtains the user's coordinates `(lat, lon)` via `navigator.geolocation.getCurrentPosition()`.
2. **Reverse Geocoding**: Queries the open-source [postcodes.io](https://postcodes.io/) API to resolve coordinates to the nearest UK administrative district and its official ONS GSS code (`E08xxxxxx`).
3. **Local Authority Matching**: Direct O(1) matching against the dataset's `locations.options[].code`. If the user is currently located in a council present in the dataset (e.g. Bolton, Salford, Manchester), it automatically selects that authority; if located outside the covered area, it displays a friendly status notice.

---

## School Classification Architecture & Logic

All school and college classification data is sourced directly from official Department for Education (DfE) registers. The application strictly prohibits heuristic guessing, name-matching regex, or handcrafted tables.

### 1. Data Sources

| Source | Role | Mapping Key |
| :--- | :--- | :--- |
| **DfE Explore Education Statistics (EES)** | Performance metrics, pupil groups, qualification cohorts, local authorities, and institution listings. | `URN` / `laEstab` |
| **DfE Get Information About Schools (GIAS)** | Authoritative register of all open and closed educational establishments in England. | `URN` (Unique Reference Number) |

### 2. School Provision Classification Logic

Institutions are mapped by their official DfE `URN` to the GIAS `TypeOfEstablishment (name)` field. Rather than classifying purely by legal/funding model, institutions are categorized by **educational provision** into two distinct categories: **Mainstream School** and **Special School**:

- **Provision Segregation Rule**: Any institution established for special educational needs, alternative provision, or pupil referral units is strictly classified under **Special School**. All other educational institutions (including sixth form colleges, further education colleges, and independent schools) are classified under **Mainstream School**. This prevents special academies from being mistakenly lumped in with mainstream academies.

#### A. Mainstream School
- **Academy / Free School**: Mainstream academy converter, academy sponsor-led, 16–19 academies, free schools (including 16–19 free schools), university technical colleges (UTCs), and studio schools (e.g. *Canon Slade School*, *Rivington and Blackrod High School*).
- **FE / Sixth Form College**: Further education colleges and designated sixth form colleges/centres (e.g. *Bolton Sixth Form College*, *Bolton College*, *Salford City College*).
- **Community school**: Mainstream local authority maintained community schools (e.g. *Turton School*).
- **Voluntary Aided (VA)**: Mainstream state schools supported by a foundation or trust (e.g. *Thornleigh Salesian College*).
- **Voluntary Controlled (VC)**: Mainstream maintained schools where the local authority runs the school but a trust owns the land.
- **Foundation school**: Mainstream maintained schools run by a governing body or foundation.
- **Independent / Private**: Mainstream registered independent day and boarding schools (e.g. *Bolton School Girls' Division*, *Bolton School Boys' Division*).

#### B. Special School
- **Special academy**: Academy special converter, academy special sponsor-led, and special free schools (e.g. *Lever Park School*, *Oakwood Academy*).
- **Maintained special school**: Local authority maintained community special schools, foundation special schools, and non-maintained special schools.
- **Independent special school**: Registered independent schools specifically catering to special educational needs (e.g. *Changing Lives*).
- **Alternative provision / PRU**: Pupil referral units, academy alternative provision converters/sponsor-led, and secure units.

---

### 3. Filter vs. Column Customization State
- **"Reset filters"**: Resets data filters (Pupil Groups & Cohorts, School Types, Religious Character) and indicator sorting back to their defaults. It **never** resets selected columns.
- **"Reset columns"**: Displayed immediately to the right of "Reset filters" whenever custom columns are applied, allowing users to restore the default column layout independently.

---

### 4. Religious Character vs. Religious Ethos

Under UK educational law, faith designation depends on the institution's legal status:

- **State-Funded Schools (`ReligiousCharacter`)**:
  Under Section 69(3) of the *School Standards and Framework Act 1998* (SSFA 1998) and Section 124B for academies, faith status is a statutory designation order. This legal order confers statutory admissions priorities, collective worship rules, and denominational RE rights. In GIAS, over 9,500 state faith schools have their faith recorded under **`ReligiousCharacter (name)`**, while their `ReligiousEthos` is officially set to `"Does not apply"`.
- **Independent & Free Schools (`ReligiousEthos`)**:
  Independent schools are not governed by SSFA 1998 designation orders, so their `ReligiousCharacter` is officially recorded as `"None"` or `"Does not apply"`. Instead, the DfE records their official faith affiliation under **`ReligiousEthos (name)`** (e.g. *Islam*, *Jewish*, *Christian*).
- **Hierarchical Fallback Resolution**:
  The extraction pipeline uses a robust hybrid rule:
  1. Primary: Use **`ReligiousCharacter (name)`** (authoritative for state schools).
  2. Fallback: If `ReligiousCharacter` is `"None"`, `"Does not apply"`, or empty, fall back to **`ReligiousEthos (name)`** (authoritative for independent and free schools).

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. (Optional) Refresh Official GIAS & 2023-24 Supplement Data
The project includes a pre-compiled, compact GIAS extract in `src/data/gias.json` and the 2023-24 EES supplement for `Best 3 A levels` and `% AAB+` in `src/data/best3-aab-202324.json`. To refresh them directly from the DfE:
```bash
node scripts/fetch-gias.mjs
node scripts/fetch-202324-best3-aab.mjs
```

### 3. Run Local Development Server
Start Vite with Hot Module Reload (HMR):
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Build & Preview

### Build for Production
Validates TypeScript and compiles optimized production assets into the `dist/` directory:
```bash
npm run build
```

### Preview Production Build Locally
Boot a local server to test the exact production output from `dist/`:
```bash
npm run preview
```
Open the URL shown in terminal (usually [http://localhost:4173](http://localhost:4173)).

---

## Deploying to Cloudflare

Because this application compiles to static assets and uses hash-based routing (`#/` and `#/dashboard`), it can be hosted on **Cloudflare Pages** with zero backend configuration.

### Option A: Deploy via Wrangler CLI (Fastest)

1. Authenticate with Cloudflare (first time only):
   ```bash
   npx wrangler login
   ```

2. Build and deploy `dist/`:
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name=alevel-results
   ```

Cloudflare will deploy your build and return a live preview and production URL (e.g., `https://alevel-results.pages.dev`).

### Option B: Continuous Deployment via Git (Recommended for Production)

1. Push your repository to **GitHub** or **GitLab**.
2. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Compute (Workers & Pages)** > **Create application** > **Pages** tab.
3. Select **Connect to Git** and authorize your repository.
4. Set the following build configuration:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Click **Save and Deploy**. Cloudflare will automatically build and deploy every time you push to your repository.

---

## Testing & Linting

```bash
# Run unit tests with Vitest
npm run test

# Run ESLint
npm run lint
```

---

## Design System

The visual design system of this application (Editorial Academic Glassmorphism) is documented in [UI_DESIGN.md](UI_DESIGN.md). It contains:
- OKLCH color palettes (Light warm ivory & dark midnight indigo)
- Typography pairing rules (Fraunces serif display + Inter geometric sans with tabular numerals)
- Ambient background layer and specular frosted glass tokens
- Reusable component anatomy (PageHero, Field wrappers, popovers, badges, table optimization rules)
- Checklist for porting the design system into new projects

---

## License

This project is licensed under the [MIT License](LICENSE) by [Edmond Chan](https://github.com/edmondcck).

### Data Attribution
Public sector data is provided by the Department for Education (DfE) via [Explore Education Statistics](https://explore-education-statistics.service.gov.uk/) and [Get Information About Schools](https://get-information-schools.service.gov.uk/), licensed under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).

