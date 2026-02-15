# `resume.json` Schema Reference

> Complete reference for the `resume.json` data model that drives the hire-zak site.

---

## Overview

The site is entirely data-driven. Every piece of content — name, title, experience, skills — comes from a single `resume.json` file located at `src/site/public/resume.json`. The file is fetched at runtime by the React app, parsed, and validated against a Zod schema defined in `src/site/src/lib/resume.ts`.

There are **two copies** of `resume.json`:
1. **`/resume.json`** (repo root) — Source-of-truth for version control
2. **`/src/site/public/resume.json`** — Served by Vite at runtime (copy this from root when updating)

---

## Top-Level Structure

```typescript
type ResumeJson = {
  personalInfo: PersonalInfo       // Required — who you are
  executiveSummary?: ExecutiveSummary  // Optional — high-level strengths
  proficiencies?: SkillCategory[]     // Optional — technical skills
  experience?: Experience[]           // Optional — work history
}
```

---

## `personalInfo` (Required)

Contains basic identity information. This is the only required top-level field.

```typescript
type PersonalInfo = {
  person: {
    givenName: string       // Required, min 1 char
    surname: string         // Required, min 1 char
    picture?: LogoVariant   // Profile photo (theme-aware)
    email?: string          // Contact email
    location?: string       // e.g., "Seattle, Washington"
    title?: string          // e.g., "Security Innovation Senior Principal"
    hobbies?: string[]      // e.g., ["Welding (GMAW, GTAW)", "Home Automation"]
  }
}
```

### Example

```json
{
  "personalInfo": {
    "person": {
      "givenName": "Zak",
      "surname": "Fargo",
      "email": "zak@hirezak.com",
      "location": "Seattle, Washington",
      "title": "Security Innovation Senior Principal",
      "picture": {
        "uri": "https://hirezak.blob.core.windows.net/public/Zak-Resume-Shot.png",
        "altText": "Face Picture of Zak Fargo"
      },
      "hobbies": [
        "Welding (GMAW, GTAW)",
        "Borosilicate Flameworking",
        "Electrical Engineering",
        "Home Automation"
      ]
    }
  }
}
```

### Additional `personalInfo` Fields (Non-Rendered)

The actual `resume.json` also contains a `token` field with a JWT-style structure. This is **not validated by the schema** and is not rendered by the site — it exists as a creative personal branding element.

---

## `executiveSummary` (Optional)

A set of high-level strength areas displayed on both the Splash and Standard pages.

```typescript
type ExecutiveSummary = {
  title?: string                    // Section heading (default: "Executive Summary")
  items?: ResumeSummaryItem[]       // Strength areas
}

type ResumeSummaryItem = {
  title: string    // Required, min 1 char — e.g., "Business Solutioning"
  body: string     // Required, min 1 char — longer description
}
```

### Example

```json
{
  "executiveSummary": {
    "title": "Executive Summary",
    "items": [
      {
        "title": "Software Engineering",
        "body": "A Master Software Engineer, Zak is experienced across software delivery domains..."
      },
      {
        "title": "Security",
        "body": "The world of security is constantly changing..."
      }
    ]
  }
}
```

### Rendering
- **Splash Page**: Displayed in a 2-column grid of "floaty-card" elements under the "Executive strengths" section
- **Standard Page**: Displayed in a 2-column grid with bordered cards

---

## `proficiencies` (Optional)

An array of skill categories displayed on both pages.

```typescript
type ResumeSkillCategory = {
  skillCategoryName?: string      // e.g., "Software Engineering"
  skillNames: string[]            // Required, min 1 — e.g., ["csharp", "typescript"]
  level?: string                  // e.g., "master", "journeyman"
  yearsOfExperience?: number      // 0–80, integer
  favoriteActivities?: string[]   // e.g., ["framework development", "refactoring"]
}
```

### Zod Validation Rules
- `skillNames` must contain at least 1 entry, each min 1 char
- `yearsOfExperience` must be an integer between 0 and 80

### Example

```json
{
  "proficiencies": [
    {
      "skillCategoryName": "Software Engineering",
      "skillNames": ["csharp", "javascript", "html5", "css", "typescript"],
      "level": "master",
      "yearsOfExperience": 10,
      "favoriteActivities": ["framework development", "refactoring", "automation"]
    },
    {
      "skillCategoryName": "Modern Application Infrastructure",
      "skillNames": ["CI/CD Deployment", "Kubernetes", "Docker"],
      "level": "journeyman",
      "yearsOfExperience": 4
    }
  ]
}
```

### Rendering
- **Splash Page**: Used as a data source but the main skill visualization uses the hardcoded `SKILLS` array in `SkillShowcase.tsx`
- **Standard Page**: Rendered as grouped skill lists with level and years of experience

---

## `experience` (Optional)

An array of work experience entries, ordered from most recent to oldest.

### Core Fields

```typescript
type ResumeExperience = {
  company: ResumeCompany           // Required — employer info
  contractorTo?: string            // If contracting, the client company name
  title: string                    // Required, min 1 char — job title
  team?: string                    // Team or department name
  startDate: ResumeDate            // Required — when the role started
  endDate: ResumeDate | null       // null = currently in this role ("Present")
  dutiesAndAccomplishments: string[] // Required, min 1 entry — bullet points
}

type ResumeCompany = {
  displayName: string              // Required, min 1 char
  logo?: LogoVariant               // Company logo (theme-aware)
}

type ResumeDate = {
  year: number                     // 1900–2100, integer
  month: number                    // 1–12, integer
}
```

### Extended Fields (Optional, Visualization-Friendly)

These fields enhance the Splash Page's immersive job cards but are not required:

```typescript
// Additional experience fields
{
  tagline?: string                 // One-line summary of the role
  highlights?: string[]            // Key highlights (alternative to duties)
  themes?: string[]                // Thematic tags, e.g., ["Cloud Security", "DevOps"]
  signals?: Record<string, number> // 0–1 range signals for radar/gauge charts
  
  impactMetrics?: Array<{
    label: string                  // e.g., "Build time reduction"
    value: string                  // e.g., "80"
    unit?: string                  // e.g., "%"
    context?: string               // e.g., "across all pipelines"
  }>
  
  initiatives?: Array<{
    name: string                   // e.g., "Azure Policy Governance"
    problem: string                // What problem was solved
    approach: string               // How it was approached
    outcome: string                // What was achieved
  }>
  
  stack?: {
    methods?: string[]             // e.g., ["Agile", "DevOps"]
    libraries?: string[]           // e.g., ["React", "ASP.NET"]
    cloud?: string[]               // e.g., ["Azure KeyVault", "CosmosDB"]
    data?: string[]                // e.g., ["Azure DataLake", "SQL"]
    integrations?: string[]        // e.g., ["Service Bus", "Event Grid"]
  }
}
```

### Zod Validation Rules
- `endDate` (if not null) must be chronologically after `startDate` — enforced via a `superRefine` cross-field check
- `dutiesAndAccomplishments` must have at least 1 entry, each min 1 char
- `signals` values must be between 0 and 1

### Example (Core Only)

```json
{
  "company": {
    "displayName": "Microsoft",
    "logo": {
      "uri": "https://hirezak.blob.core.windows.net/public/microsoft-logo.png",
      "alt": "Microsoft Corporate Logo"
    }
  },
  "title": "Software Engineer II",
  "team": "Enterprise Cloud / Enterprise Analytics and Tools",
  "startDate": { "year": 2014, "month": 4 },
  "endDate": { "year": 2018, "month": 4 },
  "dutiesAndAccomplishments": [
    "Designed end to end business automation solutions.",
    "Created custom MediaWiki private deployment with high automation.",
    "Reduced headcount with self-service automation engine."
  ]
}
```

### Example (With Extended Fields)

```json
{
  "company": { "displayName": "Accenture" },
  "title": "Security Innovation Senior Principal",
  "team": "Cloud Security",
  "startDate": { "year": 2021, "month": 6 },
  "endDate": null,
  "tagline": "Leading cloud security innovation and AI-driven governance",
  "themes": ["Cloud Security", "AI Governance", "DevSecOps"],
  "impactMetrics": [
    { "label": "Policy coverage", "value": "95", "unit": "%" },
    { "label": "Team size", "value": "8", "unit": " engineers" }
  ],
  "initiatives": [
    {
      "name": "Azure Policy Governance",
      "problem": "No centralized cloud governance",
      "approach": "Custom Azure Policy framework with automated deployment",
      "outcome": "Enterprise-wide policy compliance with automated reporting"
    }
  ],
  "stack": {
    "libraries": ["ASP.NET", "TypeScript", "Knockout.JS"],
    "cloud": ["Azure DevOps", "Azure Web Apps", "Azure Function Apps", "Azure CosmosDB"],
    "integrations": ["Azure Service Bus"]
  },
  "dutiesAndAccomplishments": [
    "Managed development of Knowledge Management System...",
    "Created and Ran 'Code Camp' training program..."
  ]
}
```

### Rendering
- **Splash Page**: Each experience entry becomes an immersive full-width card with:
  - Floating company logo
  - Date range with arrow
  - Large title and company/team info
  - Tagline (if provided)
  - Stat cards from `impactMetrics` or auto-extracted text metrics
  - Accomplishment bullets with highlighted inline metrics
  - Tags from initiatives, themes, and stack (limited by `maxTagsPerJob`)
- **Standard Page**: Traditional format with title-company-dates header and bulleted list

---

## `LogoVariant` Type

Both `person.picture` and `company.logo` support theme-aware resolution:

### Simple URI Format
```json
{
  "uri": "https://example.com/logo.png",
  "altText": "Company Logo"
}
```

### Theme-Variant Format
```json
{
  "light": "/assets/light-mode/company-logo.png",
  "dark": "/assets/dark-mode/company-logo.png",
  "invariant": "/assets/invariant/company-logo.png",
  "altText": "Company Logo"
}
```

### Resolution Order (in `logo.ts`)
1. If `uri` field exists → use it directly
2. If `invariant` exists → use it (works in both themes)
3. Use theme-matched variant (`dark` or `light`)
4. Fall back to the opposite theme variant
5. Return `undefined` if nothing matches

### Path Normalization
The `logo.ts` module normalizes paths:
- URLs starting with `http://`, `https://`, or `data:` are passed through
- Paths containing `/assets/` are normalized to start from `/assets/`
- Relative paths get a leading `/` added

---

## Metric Auto-Extraction

When `impactMetrics` is not provided in an experience entry, the site automatically extracts metrics from `dutiesAndAccomplishments` text using regex patterns in `metrics.ts`.

### Matched Patterns
- **Percentages**: `40%`, `3.5%`
- **Multipliers**: `2x`, `10K`, `5M`
- **Time units**: `200ms`, `3s`, `2hr`, `30 min`
- **Counts with units**: `80 users`, `12 engineers`, `500 requests`
- **Dollar amounts**: `$5M`, `$120K`

### Not Matched
- Bare numbers without context (e.g., just `80` with no unit)

### Context Extraction
The engine looks at surrounding words to provide a label:
- After the number: "40% **reduction in cycle time**"
- Before the number: "**reduced cycle time** by 40%"
- Fallback label: "impact"

---

## Validation Error Display

When `resume.json` fails validation, both pages show an error panel:

### JSON Parse Errors
- Error message from `JSON.parse()`
- Line and column numbers (if available)
- Code snippet showing the error location with a `^` caret

### Zod Schema Errors
- Up to 30 errors displayed
- Each shows the JSON path (e.g., `$.experience[0].endDate`) and error message
- Non-fatal warnings (e.g., invalid email format) are tracked separately

---

## Adding New Fields

1. **Add the TypeScript type** to the appropriate type in `resume.ts`
2. **Add the Zod schema field** — use `.optional()` for backward compatibility
3. **Update the consuming component(s)** in `SplashPage.tsx` or `StandardPage.tsx`
4. **Update both copies of `resume.json`** (root and `src/site/public/`)
5. **Run validation**: `npm run site:check:resume`

> ⚠️ Always make new fields optional to avoid breaking the site for existing `resume.json` files.
