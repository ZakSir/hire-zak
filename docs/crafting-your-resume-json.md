# Crafting Your `resume.json` — Complete Author's Guide

> A comprehensive, field-by-field guide for populating a `resume.json` file so that every UI feature, card type, visualization, and metric display renders correctly.

---

## Table of Contents

1. [How the Site Works](#how-the-site-works)
2. [File Locations & Workflow](#file-locations--workflow)
3. [Top-Level Structure](#top-level-structure)
4. [personalInfo (Required)](#personalinfo-required)
   - [person](#person)
   - [picture (Theme-Aware Images)](#picture-theme-aware-images)
   - [token (Creative / Non-Rendered)](#token-creative--non-rendered)
5. [executiveSummary (Optional)](#executivesummary-optional)
6. [proficiencies (Optional)](#proficiencies-optional)
7. [experience (Optional)](#experience-optional)
   - [Core Fields](#core-fields)
   - [Extended / Visualization Fields](#extended--visualization-fields)
   - [tagline](#tagline)
   - [highlights](#highlights)
   - [themes](#themes)
   - [signals](#signals)
   - [impactMetrics — Metric Card System](#impactmetrics--metric-card-system)
   - [initiatives](#initiatives)
   - [stack](#stack)
   - [technologies — Icon Strip](#technologies--icon-strip)
8. [Metric Card Types (viz) — Complete Reference](#metric-card-types-viz--complete-reference)
   - [text](#1-text-default)
   - [text-icon](#2-text-icon)
   - [sparkline](#3-sparkline)
   - [dual-sparkline](#4-dual-sparkline)
   - [range-gauge](#5-range-gauge)
   - [tacho](#6-tacho)
   - [speedo](#7-speedo)
   - [before-after](#8-before-after)
9. [Theme-Aware Logo System (LogoVariant)](#theme-aware-logo-system-logovariant)
10. [Automatic Metric Extraction](#automatic-metric-extraction)
11. [Validation & Error Handling](#validation--error-handling)
12. [How Data Feeds Each UI Section](#how-data-feeds-each-ui-section)
    - [Splash Page](#splash-page)
    - [Standard Page](#standard-page)
    - [Career Metrics Section](#career-metrics-section)
    - [Skill Showcase Section](#skill-showcase-section)
    - [Document Title & Open Graph Meta Tags](#document-title--open-graph-meta-tags)
13. [Site Configuration Toggles](#site-configuration-toggles)
14. [Minimal Working Example](#minimal-working-example)
15. [Full-Featured Example](#full-featured-example)
16. [Common Mistakes & Troubleshooting](#common-mistakes--troubleshooting)

---

## How the Site Works

The site is **entirely data-driven**. A single `resume.json` file is the source for every piece of content displayed on screen — your name, title, work history, skills, metrics, logos, and more. There is no CMS, no database, and no hardcoded content (apart from the skill visualization data, explained later).

At runtime, the React app:
1. Fetches `resume.json` from the public directory
2. Parses the raw JSON
3. Validates it against a Zod schema defined in `src/site/src/lib/resume.ts`
4. If valid → renders the Splash Page and Standard Page
5. If invalid → displays a detailed error panel explaining what went wrong

There are **two pages**:
- **Splash Page** (`/`) — An immersive, animated experience with parallax effects, D3 data visualizations, metric cards, technology icon strips, and swoosh animations.
- **Standard Page** (`/standard`) — A clean, traditional resume layout optimized for printing and PDF export.

---

## File Locations & Workflow

There are **two copies** of `resume.json` in the repository:

| Location | Purpose |
|---|---|
| `/resume.json` (repo root) | Source-of-truth for version control |
| `/src/site/public/resume.json` | Served by Vite at runtime — **this is the one the app reads** |

**Workflow**: Edit `/src/site/public/resume.json` for development, and keep the root copy in sync for version control.

To validate your JSON before running the app:
```bash
cd src/site
npm run check:resume
```

This checks that the file is valid JSON (not schema validation — schema validation happens at runtime in the browser and produces detailed on-screen error messages).

---

## Top-Level Structure

```json
{
  "personalInfo": { ... },       // REQUIRED — who you are
  "executiveSummary": { ... },   // Optional — high-level strength areas
  "proficiencies": [ ... ],      // Optional — skill categories
  "experience": [ ... ]          // Optional — work history entries
}
```

Only `personalInfo` is required. All other sections are optional and the site gracefully omits them if absent.

---

## personalInfo (Required)

This is the only **required** top-level field. It provides the identity information used in the hero section, document title, page header, and Open Graph meta tags.

### person

```json
{
  "personalInfo": {
    "person": {
      "givenName": "Jane",
      "surname": "Doe",
      "email": "jane@example.com",
      "location": "San Francisco, CA",
      "title": "Senior Software Engineer — Full-Stack Development",
      "picture": { ... },
      "hobbies": ["Hiking", "Photography", "3D Printing"],
      "locationExact": {
        "lat": 37.7749,
        "long": -122.4194
      }
    }
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `givenName` | string (min 1 char) | **Yes** | First name |
| `surname` | string (min 1 char) | **Yes** | Last name |
| `email` | string | No | Contact email. Rendered as a `mailto:` link in the hero section and footer. A validation warning (non-fatal) is emitted if the value lacks an `@` sign. |
| `location` | string | No | Display location (e.g., "Seattle, WA"). Currently the hero section uses a hardcoded location pill — but this field drives the Standard Page header. |
| `title` | string | No | Professional title. Shown as a subtitle in the hero section and used in the document `<title>` tag and Open Graph meta. |
| `picture` | LogoVariant | No | Profile photo. Supports theme-aware variants. Rendered as a 240×240 rounded image in the Splash Page hero and as a smaller image in the Standard Page header. See [Theme-Aware Logo System](#theme-aware-logo-system-logovariant). |
| `hobbies` | string[] | No | List of hobbies/interests. Displayed as a bullet-separated list at the bottom of the Skills section (Splash Page) and as a dedicated "Hobbies" section on the Standard Page. |
| `locationExact` | `{ lat: number, long: number }` | No | Exact coordinates. **Not rendered by the UI** — exists for potential future map features or external integrations. Not validated by the schema. |

### picture (Theme-Aware Images)

The `picture` field uses the same `LogoVariant` type as company logos. You can provide:

**Simple URI:**
```json
"picture": {
  "uri": "/assets/photos/headshot.jpg",
  "altText": "Headshot of Jane Doe"
}
```

**Theme-aware variants:**
```json
"picture": {
  "light": "/assets/light-mode/headshot-light.jpg",
  "dark": "/assets/dark-mode/headshot-dark.jpg",
  "altText": "Headshot of Jane Doe"
}
```

**Invariant (same image for both themes):**
```json
"picture": {
  "invariant": "/assets/invariant/headshot.jpg",
  "altText": "Headshot of Jane Doe"
}
```

See [Theme-Aware Logo System](#theme-aware-logo-system-logovariant) for the full resolution logic.

### token (Creative / Non-Rendered)

The actual `resume.json` in this repo includes a `token` field containing a JWT-style structure. This is a **creative personal branding element** — it is **not validated**, **not rendered**, and is completely optional. It exists purely as a fun developer-oriented Easter egg.

```json
{
  "personalInfo": {
    "person": { ... },
    "token": {
      "header": { "typ": "JWT", "alg": "HS256" },
      "payload": {
        "aud": "https://yoursite.com/",
        "name": "Jane Doe",
        "scp": ["contact", "interview", "hiring"]
      },
      "signature": "some-base64-string"
    }
  }
}
```

You can safely omit this entirely. If present, it passes through without validation.

---

## executiveSummary (Optional)

A set of high-level strength areas displayed prominently on both pages.

```json
{
  "executiveSummary": {
    "title": "Executive Summary",
    "items": [
      {
        "title": "AI Strategy → Revenue",
        "body": "Shipped two production AI platforms that drove $50M+ first-year revenue..."
      },
      {
        "title": "Engineering Leadership",
        "body": "Leads 13 engineering teams with overlapping dependencies..."
      }
    ]
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | No | Section heading. Not directly displayed as a section title on the Splash Page (the Splash Page uses its own "Executive strengths" heading), but available for future use. |
| `items` | ResumeSummaryItem[] | No | Array of strength areas |

### ResumeSummaryItem

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string (min 1 char) | **Yes** | Short heading for the strength (e.g., "AI Strategy → Revenue") |
| `body` | string (min 1 char) | **Yes** | Longer description paragraph |

### How It Renders

**Splash Page:**
- Displayed under the "Executive strengths" heading in a 2-column grid
- Each item becomes a `floaty-card` with a glassmorphism card background
- Each card gets a decorative D3 mini-visualization in the top-right corner:
  - Card index 0 → **Strategy Sparkline** (exponential growth curve)
  - Card index 1 → **Agent Network** (interconnected node graph)
  - Card index 2 → **Governance Gauge** (tachometer at 95%)
  - Card index 3 → **Team Velocity Speedometer** (needle pegged high)
  - Cards beyond index 3 cycle through these visualizations

**Standard Page:**
- Displayed under an "Executive summary" heading in a 2-column grid with bordered cards

> **Tip**: 4 summary items fill the grid perfectly (2×2). You can use fewer or more — the grid wraps responsively.

---

## proficiencies (Optional)

An array of skill categories displayed on the Standard Page and used as data context for the Splash Page's skill visualization.

```json
{
  "proficiencies": [
    {
      "skillCategoryName": "AI & LLM Engineering",
      "skillNames": ["Agentic AI", "LLM Engineering", "RAG Systems", "Prompt Engineering"],
      "level": "master",
      "yearsOfExperience": 5,
      "favoriteActivities": ["agentic workflows", "multi-model orchestration"]
    },
    {
      "skillCategoryName": "Cloud & Azure",
      "skillNames": ["Azure", "Azure OpenAI", "Azure Functions", "Cosmos DB"],
      "level": "advanced",
      "yearsOfExperience": 12,
      "favoriteActivities": ["platform architecture", "cloud-native design"]
    }
  ]
}
```

### ResumeSkillCategory

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `skillCategoryName` | string | No | — | Category heading (e.g., "Software Engineering"). If omitted, "Skills" is used as the default heading on the Standard Page. |
| `skillNames` | string[] | **Yes** | Min 1 entry, each min 1 char | List of skill names within this category |
| `level` | string | No | — | Proficiency level (e.g., "master", "advanced", "intermediate", "journeyman"). Free-text — no enforced enum. |
| `yearsOfExperience` | number | No | Integer, 0–80 | Years of experience in this category |
| `favoriteActivities` | string[] | No | Each min 1 char | Activities you enjoy within this skill area |

### How It Renders

**Standard Page:**
- Each category becomes a group showing the category name, level (in parentheses), years of experience (with "y" suffix), and a comma-separated list of skill names
- Example output: `Software Engineering (master) • 10y` followed by `C#, TypeScript, Python, JavaScript, ASP.NET, React`

**Splash Page:**
- The Splash Page's skill bars visualization (`SkillShowcase.tsx`) currently uses a **hardcoded `SKILLS` array**, not the `proficiencies` data from `resume.json`. This means editing `proficiencies` will update the Standard Page skills section but **will not** change the animated skill bars on the Splash Page.
- To change the Splash Page skill visualization, you need to edit the `SKILLS` constant in `src/site/src/components/SkillShowcase.tsx`.

> **Important**: The `proficiencies` data is validated but the Splash skill bars are independently configured. If you want both pages to match, manually keep them in sync.

---

## experience (Optional)

An array of work experience entries. This is the most feature-rich section of `resume.json` and drives the immersive job cards on the Splash Page.

**Entries should be ordered from most recent to oldest.** The site renders them in the order provided.

### Core Fields

These are the minimum required fields for each experience entry:

```json
{
  "company": {
    "displayName": "Acme Corp",
    "logo": {
      "invariant": "/assets/invariant/acme-logo.svg",
      "alt": "Acme Corp logo"
    }
  },
  "contractorTo": "Big Client Inc",
  "title": "Senior Software Engineer",
  "team": "Platform Engineering",
  "startDate": { "year": 2021, "month": 6 },
  "endDate": { "year": 2024, "month": 3 },
  "dutiesAndAccomplishments": [
    "Designed and implemented a distributed event processing pipeline handling 50,000 events/second.",
    "Led migration from monolith to microservices, reducing deployment time by 80%.",
    "Mentored 5 junior engineers through pair programming and code review."
  ]
}
```

#### company (Required)

| Field | Type | Required | Description |
|---|---|---|---|
| `displayName` | string (min 1 char) | **Yes** | Company name shown in the job card header |
| `logo` | LogoVariant | No | Company logo. Supports theme-aware variants. See [Theme-Aware Logo System](#theme-aware-logo-system-logovariant). |

#### Other Core Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `contractorTo` | string | No | If you were a contractor, the client company name. Rendered as "(Contractor to X)" next to the company name. |
| `title` | string (min 1 char) | **Yes** | Your job title |
| `team` | string | No | Team or department name. Displayed after the company name with a bullet separator: `"EY • Cybersecurity AI Engineering"` |
| `startDate` | `{ year, month }` | **Yes** | When the role started. `year`: 1900–2100 (integer). `month`: 1–12 (integer). |
| `endDate` | `{ year, month }` or `null` | **Yes** | When the role ended. Set to `null` for your current role — renders as "Present". **Validated**: if not null, must be chronologically after `startDate`. |
| `dutiesAndAccomplishments` | string[] | **Yes** | At least 1 entry, each min 1 char. Bullet points describing your work. On the Splash Page, only the first 4 bullets are shown. On the Standard Page, all bullets are shown. |

#### Date Formatting

Dates are rendered as abbreviated month + year: `{ "year": 2021, "month": 6 }` → **"Jun 2021"**

#### Date Validation

The schema enforces that `endDate` (when not null) must be chronologically after `startDate`. If violated, a validation error is shown:
```
$.experience[0].endDate: endDate must be after startDate
```

### Extended / Visualization Fields

These optional fields unlock the full visual richness of the Splash Page's immersive job cards. Without them, the site still works — it just uses simpler auto-extracted metrics and fewer visual elements.

### tagline

A one-sentence summary of the role that appears as a styled subtitle below the job title.

```json
"tagline": "Own AI Engineering for Cybersecurity — shipped two production platforms, drove $50M+ first-year revenue."
```

| How it renders | Where |
|---|---|
| Styled paragraph below job title and company | Splash Page only |

### highlights

An alternative to `dutiesAndAccomplishments` for providing key achievements. Currently **not rendered** by the UI — it exists as a structured alternative for potential future use or external consumers of the JSON.

```json
"highlights": [
  "Shipped two production AI platforms driving $50M+ first-year revenue.",
  "Lead 13 engineering teams (300 engineers) with overlapping dependencies."
]
```

### themes

An array of thematic tags for the role. Used as tag chips at the bottom of each job card.

```json
"themes": ["Agentic AI", "AI Governance", "Engineering Leadership", "Platform Engineering"]
```

| How it renders | Where |
|---|---|
| Small rounded tag chips at the bottom of the job card | Splash Page only |

Tags are drawn from three sources combined (in this order, deduplicated):
1. **Initiative names** — from `initiatives[].name`
2. **Theme tags** — from `themes[]`
3. **Stack items** — all items from `stack.methods`, `stack.libraries`, `stack.cloud`, `stack.data`, and `stack.integrations`

The total number of displayed tags is capped by `siteConfig.maxTagsPerJob` (default: 12), but only the first 4 are actually displayed in the current card layout.

### signals

A dictionary of signal values (0.0 to 1.0) used for radar/gauge visualizations in the Career Metrics section. The signal names should be consistent across all experience entries for proper comparison.

```json
"signals": {
  "cost": 0.95,
  "speed": 0.9,
  "adoption": 0.75,
  "trust": 0.85,
  "engineering": 0.95
}
```

| Field | Type | Validation | Description |
|---|---|---|---|
| Each key | string | — | Signal dimension name |
| Each value | number | 0.0 to 1.0 | Intensity/strength for that dimension |

**Standard signals used in the Career Metrics section:**
- `cost` — Cost efficiency / reduction impact
- `speed` — Speed / velocity of delivery
- `adoption` — Adoption / reach of your work
- `trust` — Trust / reliability / governance
- `engineering` — Engineering depth / craft

> **Note**: The Career Metrics timeline visualization (`CareerMetrics.tsx`) currently uses **hardcoded role data** (`DEFAULT_ROLES`), not dynamically from `resume.json`. The `signals` field on each experience entry is validated and available for future dynamic use.

### impactMetrics — Metric Card System

This is the **most powerful visual feature** of the job cards. Each metric becomes a D3-powered visualization card displayed in a responsive grid within the job entry.

```json
"impactMetrics": [
  {
    "label": "First-year revenue growth",
    "value": "$50M+",
    "unit": "",
    "context": "With $100M+ in qualified pipeline",
    "viz": "text"
  },
  {
    "label": "Cost reduction range",
    "value": "40-95",
    "unit": "%",
    "context": "Client outcomes across AI-automated workflows",
    "viz": "range-gauge"
  }
]
```

Each metric object has these fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | string (min 1 char) | **Yes** | Short label displayed below the value (e.g., "Build time reduction") |
| `value` | string (min 1 char) | **Yes** | The metric value (e.g., "50", "$5M", "40-95", "100", "Billions"). Always a string, even for numbers. |
| `unit` | string | No | Unit suffix displayed after the value (e.g., "%", " engineers", " FTEs", "/day", " hrs/wk"). **Note**: If the unit is `"%"`, it is **not** appended (to avoid double-showing for gauge types that already display %). For all other units, it is concatenated: `value + unit`. |
| `context` | string | No | Additional context shown as smaller, muted text below the label (e.g., "Globally distributed across 13 squads") |
| `viz` | string | No | The visualization type. Determines which D3 card component renders this metric. See [Metric Card Types](#metric-card-types-viz--complete-reference) below. Defaults to `"text"` if omitted. |
| `icon` | string | No | Icon name for `text-icon` viz type. See available icons below. |
| `before` | string | No | "Before" value for `before-after` viz type |
| `after` | string | No | "After" value for `before-after` viz type |
| `sparkData` | number[] | No | Data points for `sparkline` or `dual-sparkline` viz types. Array of numbers representing the growth curve. |
| `sparkData2` | number[] | No | Second data series for `dual-sparkline` viz type |

If `impactMetrics` is **not provided**, the site falls back to [Automatic Metric Extraction](#automatic-metric-extraction) from `dutiesAndAccomplishments` text.

### initiatives

Structured descriptions of key projects or initiatives within the role. Used for tag generation and available for future detailed rendering.

```json
"initiatives": [
  {
    "name": "Conversational AI Platform",
    "problem": "Regulated environments lacked a purpose-built platform for secure AI interactions.",
    "approach": "Designed and shipped a production conversational AI platform with governance and auditability.",
    "outcome": "Deployed across client engagements; became a core offering."
  }
]
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string (min 1 char) | **Yes** | Initiative name — also used as a tag chip |
| `problem` | string (min 1 char) | **Yes** | What problem was solved |
| `approach` | string (min 1 char) | **Yes** | How it was approached |
| `outcome` | string (min 1 char) | **Yes** | What was achieved |

**How it renders**: Currently, initiative `name` values appear as tag chips at the bottom of job cards on the Splash Page. The full problem/approach/outcome structure is validated and available for future detailed views.

### stack

A categorized summary of technologies and methods used in the role. All sub-fields are optional.

```json
"stack": {
  "methods": ["Agentic AI", "LLMs", "RAG"],
  "libraries": ["LangChain", "LangGraph"],
  "cloud": ["Azure OpenAI", "Azure AI Foundry"],
  "data": ["Cosmos DB", "PostgreSQL"],
  "integrations": ["Microsoft Sentinel", "ServiceNow"]
}
```

| Field | Type | Description |
|---|---|---|
| `methods` | string[] | Methodologies and approaches |
| `libraries` | string[] | Libraries and frameworks |
| `cloud` | string[] | Cloud services and platforms |
| `data` | string[] | Databases and data stores |
| `integrations` | string[] | External integrations |

**How it renders**: All items from all stack categories are flattened and used as tag chips at the bottom of job cards (after initiative names and theme tags).

### technologies — Icon Strip

An array of technology objects with theme-aware icon paths. These render as a horizontal scrolling strip of technology logos within each job card on the Splash Page.

```json
"technologies": [
  {
    "name": "Python",
    "icon": {
      "agnostic": "/assets/icons/agnostic/python.svg"
    }
  },
  {
    "name": "GitHub",
    "icon": {
      "dark": "/assets/icons/dark-mode/GitHub_Invertocat_White.svg",
      "light": "/assets/icons/light-mode/GitHub_Invertocat_Black.svg"
    }
  },
  {
    "name": "Azure",
    "icon": {
      "agnostic": "/assets/icons/agnostic/azure.svg"
    }
  }
]
```

#### Technology Object

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string (min 1 char) | **Yes** | Technology name — shown as a tooltip on hover |
| `icon` | TechnologyIcon | **Yes** | Icon paths (see below) |

#### TechnologyIcon

| Field | Type | Description |
|---|---|---|
| `agnostic` | string | Path to an icon that works in both light and dark themes. If present, this is preferred. |
| `light` | string | Path to the light-mode icon |
| `dark` | string | Path to the dark-mode icon |

**Icon resolution order:**
1. `agnostic` (if present, used in both themes)
2. Theme-matched variant (`dark` for dark mode, `light` for light mode)
3. `light` fallback
4. `dark` fallback

**How it renders**: A horizontal row of small icon images with staggered fade-in animation. Each icon has a tooltip showing the technology name. Icons are loaded lazily.

> **Tip**: Place icon files in `src/site/public/assets/icons/agnostic/`, `src/site/public/assets/icons/dark-mode/`, or `src/site/public/assets/icons/light-mode/`. SVG format is preferred for crisp rendering at any size.

---

## Metric Card Types (viz) — Complete Reference

The `viz` field on each `impactMetrics` entry determines which D3-powered visualization renders for that metric. Each type is a distinct visual component with unique animations and display characteristics.

### 1. `text` (Default)

**The simplest card type.** Displays the value, label, and optional context as plain styled text.

```json
{
  "label": "Production platforms shipped",
  "value": "2",
  "unit": "",
  "context": "Conversational AI + AIETL batch processing",
  "viz": "text"
}
```

**Renders as:**
- Large bold value text
- Smaller label below
- Muted context text below the label (if provided)

**When to use**: Simple numeric or text-based metrics that don't need a chart.

---

### 2. `text-icon`

**A text card with an SVG icon.** The icon appears to the left of the value and label.

```json
{
  "label": "Knowledge graph relationships",
  "value": "Millions",
  "unit": "",
  "context": "Large graph linked to policies, engagements, opportunities",
  "viz": "text-icon",
  "icon": "graph"
}
```

**Available `icon` values:**

| Icon Name | Visual | Best For |
|---|---|---|
| `graph` | Bar chart icon | Graph/data/analytics metrics |
| `key` | Key icon | Encryption/security/key management |
| `lock` | Padlock icon | Security/access control |
| `rocket` | Rocket icon | Launch/growth/velocity |
| `rss` | RSS feed icon | Publishing/feeds/content |
| `shield` | Shield with checkmark | Compliance/protection |
| `docs` | Document icon | Documentation/content |
| `people` | People silhouettes | Team size/user count |
| `bolt` | Lightning bolt | Speed/power/performance |

If the `icon` value doesn't match any known icon, the `graph` icon is used as a fallback.

**When to use**: Metrics where an icon adds visual context (e.g., documents consolidated, keys managed, team size).

---

### 3. `sparkline`

**An animated sparkline chart** showing growth/trend data over time, with an area fill and a pulsing endpoint dot.

```json
{
  "label": "Full-featured assets delivered",
  "value": "64",
  "unit": "",
  "context": "Plus 10 client-ready demos and 200+ technical enablers",
  "viz": "sparkline",
  "sparkData": [2, 8, 16, 24, 35, 44, 52, 58, 64]
}
```

**Required fields:**
- `sparkData`: Array of numbers representing the data curve. The chart scales automatically to the data range. Typical length: 8–12 data points.

**If `sparkData` is omitted**, a default exponential growth curve is used: `[1, 2, 3, 5, 8, 13, 21, 40, 80, 150]`

**Animation**: The sparkline reveals left-to-right with a clip-rect animation over 1.2 seconds using cubic-out easing. A cyan gradient fills the area under the curve, and a small dot marks the endpoint.

**When to use**: Metrics that represent growth, accumulation, or a trend over time.

---

### 4. `dual-sparkline`

**Two overlapping sparkline curves** on the same chart, useful for comparing scales (e.g., 100M resources vs 10M resources).

```json
{
  "label": "Azure resources governed",
  "value": "100M+",
  "unit": "",
  "context": "Two overlapping scales: 100M (world's largest bank) + 10M",
  "viz": "dual-sparkline",
  "sparkData": [0, 5, 12, 25, 40, 55, 70, 85, 100],
  "sparkData2": [0, 0, 1, 2, 3, 5, 7, 9, 10]
}
```

**Required fields:**
- `sparkData`: Primary data series (rendered in **cyan**)
- `sparkData2`: Secondary data series (rendered in **purple**)

Both series share the same Y-axis scale (the maximum across both series). If either is omitted, default data is used.

**When to use**: Comparing two related quantities on different scales that grew together.

---

### 5. `range-gauge`

**A tachometer-style arc gauge showing a range** (e.g., 40–95%). The filled arc spans from the low value to the high value, with a gradient from purple to pink.

```json
{
  "label": "Cost reduction range",
  "value": "40-95",
  "unit": "%",
  "context": "Client outcomes across AI-automated workflows",
  "viz": "range-gauge"
}
```

**How `value` is parsed:**
- The component extracts two numbers from the `value` string using the pattern: `(\d+)\s*[-–]\s*(\d+)`
- Examples: `"40-95"` → lo=40, hi=95; `"20-60"` → lo=20, hi=60
- If only one number is found (e.g., `"80"`), both lo and hi are set to that value

**Animation:**
- The arc fills from the low angle to the high angle over 1.2 seconds
- After the initial animation, the gauge exhibits a subtle organic "revving" jitter — a randomized oscillation that gives it a living, mechanical feel
- The center of the gauge displays the range as text: `"40–95%"`

**Background**: A subtle full-arc background track is drawn behind the colored range

**When to use**: Metrics with a documented range of outcomes (e.g., cost reduction 40–95%, accuracy 85–99%).

---

### 6. `tacho`

**A single-value tachometer gauge** — a 270° arc that fills to the specified percentage with graduated tick marks and a gradient from cyan through purple to pink.

```json
{
  "label": "SLA achievement",
  "value": "100",
  "unit": "%",
  "context": "All factors within team's control",
  "viz": "tacho"
}
```

**How `value` is interpreted:** Parsed as an integer percentage (0–100). The arc fills proportionally.

**Visual features:**
- 270° arc sweep (from 7:30 to 4:30 clock positions)
- Tick marks at 0%, 25%, 50%, 75%, 100% positions
- Segmented gradient: cyan → purple → pink along the arc
- Glow filter on the filled portion
- Center text showing the percentage
- Elastic overshoot animation (bounces slightly past the target before settling)
- Post-animation organic jitter (except at 100%, where the gauge holds steady)

**When to use**: Single percentage metrics — SLA achievement, completion rates, coverage percentages.

---

### 7. `speedo`

**A speedometer with a needle** — designed for "pegged high" metrics like deployment frequency or throughput where you want to convey speed and intensity.

```json
{
  "label": "Deployments per day",
  "value": "100s",
  "unit": "/day",
  "context": "Hundreds of automated deployments daily",
  "viz": "speedo"
}
```

**Visual features:**
- Full 270° arc with a multi-stop gradient: cyan → green → amber → red (like a car speedometer)
- A faint version of the full arc is always visible as a background
- The filled portion sweeps to ~88% (pegged high)
- A needle line sweeps in exact sync with the arc fill
- Center hub dot
- Tick marks at 0%, 25%, 50%, 75%, 100%
- Value text displayed below the hub
- Post-animation organic jitter on the needle

**When to use**: Throughput/velocity/frequency metrics where you want to convey "running hot" — deployments per day, requests per second, builds per hour.

> **Note**: The speedo always pegs to ~88% position regardless of the `value` content. It's a visual metaphor, not a proportional gauge.

---

### 8. `before-after`

**A side-by-side comparison card** showing a before value, an arrow, and an after value.

```json
{
  "label": "Build time reduction",
  "value": "40→8",
  "unit": "min",
  "context": "80% build time reduction",
  "viz": "before-after",
  "before": "40 min",
  "after": "8 min"
}
```

**Required fields:**
- `before`: The "before" value displayed on the left (e.g., "40 min", "125")
- `after`: The "after" value displayed on the right (e.g., "8 min", "40")

If `before` or `after` is omitted, a `"?"` is shown in its place.

**Rendered as:**
```
Before        After
40 min   →    8 min
     Build time reduction
```

**When to use**: Transformation metrics — team size changes, performance improvements, process optimizations.

---

## Theme-Aware Logo System (LogoVariant)

Both `person.picture` and `company.logo` use the same flexible `LogoVariant` type that supports multiple theme-aware image formats.

### Format 1: Simple URI

```json
{
  "uri": "https://example.com/logo.png",
  "altText": "Company Logo"
}
```

The `uri` is used directly regardless of theme. This is the simplest format and works well with full-color logos that look good on both light and dark backgrounds.

### Format 2: Theme Variants

```json
{
  "light": "/assets/light-mode/company-logo-dark.svg",
  "dark": "/assets/dark-mode/company-logo-light.svg",
  "altText": "Company Logo"
}
```

Different images for light and dark themes. The system selects the appropriate one based on the user's system theme preference.

### Format 3: Invariant

```json
{
  "invariant": "/assets/invariant/company-logo.svg",
  "alt": "Company Logo"
}
```

A single image that works in both themes. Preferred over `uri` when you want to use the variant system but have a universal logo.

### Format 4: Mixed (All Fields)

```json
{
  "light": "/assets/light-mode/logo-light.svg",
  "dark": "/assets/dark-mode/logo-dark.svg",
  "invariant": "/assets/invariant/logo.svg",
  "altText": "Company Logo"
}
```

You can provide all fields. The resolution logic picks the best match.

### Resolution Order

The `resolveLogoUri()` function in `src/site/src/lib/logo.ts` resolves logos in this priority order:

1. **`uri`** — If the `uri` field exists, use it directly (simple format)
2. **`invariant`** — If present, use it (works for both themes)
3. **Theme match** — Use `dark` for dark theme, `light` for light theme
4. **Opposite fallback** — If the theme-matched variant is missing, try the other (`light` → `dark`, `dark` → `light`)
5. **`undefined`** — If nothing matches, no image is rendered

### Alt Text

Both `altText` and `alt` are accepted (for compatibility). `altText` is checked first, then `alt`. If neither is provided, a fallback string is used (typically the company display name or "Profile photo").

### Path Normalization

The logo system normalizes all paths:
- URLs starting with `http://`, `https://`, or `data:` pass through unchanged
- Paths containing `/assets/` are normalized to start from `/assets/`
- Relative paths get a leading `/` added

This means all of these are equivalent:
```
"/assets/icons/agnostic/python.svg"
"src/site/public/assets/icons/agnostic/python.svg"
"/src/site/src/assets/icons/agnostic/python.svg"
"assets/icons/agnostic/python.svg"
```

---

## Automatic Metric Extraction

When an experience entry **does not include `impactMetrics`**, the site automatically scans the `dutiesAndAccomplishments` text and extracts inline metrics using regex pattern matching.

### What Gets Extracted

The metric extraction engine (`src/site/src/lib/metrics.ts`) finds these patterns:

| Pattern | Examples |
|---|---|
| **Percentages** | `40%`, `3.5%`, `80%` |
| **Multipliers / shorthand** | `2x`, `10K`, `5M`, `1.2B` |
| **Time units** | `200ms`, `3s`, `2hr`, `5 hours`, `30 min` |
| **Counts with units** | `80 users`, `12 engineers`, `500 requests`, `300 engineers`, `10,000+ documents` |
| **Dollar amounts** | `$5M`, `$120K`, `$200M+` |

### What Does NOT Get Extracted

- Bare numbers without units (e.g., just `80` with no context)
- Numbers embedded in compound words or identifiers

### Context Detection

For each extracted metric, the engine tries to label it:
1. Looks **after** the number for context words (e.g., `40% reduction in cycle time` → label: "reduction in cycle time")
2. Looks **before** the number (e.g., `reduced cycle time by 40%` → label: "reduced cycle time")
3. Falls back to `"impact"` if no context is found

### Inline Metric Highlighting

In addition to card extraction, the `highlightMetrics()` function scans each accomplishment bullet and wraps detected metrics in a highlighted `<span>` with the CSS class `metricInline`, giving them a distinct visual emphasis (typically a bright cyan color) within the text.

### When to Use Auto-Extraction vs. Explicit impactMetrics

| Scenario | Recommendation |
|---|---|
| Quick setup, few metrics in text | Rely on auto-extraction |
| You want specific visualizations (gauges, sparklines) | Use `impactMetrics` with `viz` types |
| You want control over labels and context | Use `impactMetrics` |
| Historical roles with minimal data | Let auto-extraction handle it |
| Feature roles you want to showcase | Use full `impactMetrics` with diverse `viz` types |

When `impactMetrics` is provided, it **completely replaces** auto-extraction — the explicit metrics are used for the card display, and auto-extraction is skipped for card generation (though inline highlighting still applies to the bullet text).

---

## Validation & Error Handling

### Schema Validation (Zod)

The full schema is defined in `src/site/src/lib/resume.ts` using Zod. At runtime, the app:

1. Fetches `resume.json`
2. Parses it as text (to preserve line/column info for error reporting)
3. Runs `JSON.parse()` — if this fails, a parse error panel is shown
4. Runs Zod schema validation — if this fails, a validation error panel is shown
5. If both pass, the resume renders

### JSON Parse Errors

If `resume.json` is malformed JSON (missing commas, trailing commas, unterminated strings, etc.), the app shows:
- The error message from `JSON.parse()`
- Line and column numbers (if the engine provides them)
- A code snippet showing the error location with a `^` caret pointer

### Schema Validation Errors

If the JSON is valid but doesn't match the expected schema, up to 30 errors are listed showing:
- The JSON path (e.g., `$.experience[0].endDate`)
- The error message (e.g., "endDate must be after startDate")

### Non-Fatal Warnings

Some issues produce warnings instead of errors:
- Email without an `@` sign → warning, resume still renders

### Key Validation Rules

| Rule | Constraint |
|---|---|
| `personalInfo.person.givenName` | Required, min 1 character |
| `personalInfo.person.surname` | Required, min 1 character |
| `experience[].company.displayName` | Required, min 1 character |
| `experience[].title` | Required, min 1 character |
| `experience[].dutiesAndAccomplishments` | Min 1 entry, each min 1 character |
| `experience[].startDate.year` | Integer, 1900–2100 |
| `experience[].startDate.month` | Integer, 1–12 |
| `experience[].endDate` | If not null, must be after startDate |
| `experience[].signals` values | 0.0 to 1.0 |
| `proficiencies[].skillNames` | Min 1 entry, each min 1 character |
| `proficiencies[].yearsOfExperience` | Integer, 0–80 |

---

## How Data Feeds Each UI Section

### Splash Page

| UI Section | Data Source |
|---|---|
| Hero name (h1) | `personalInfo.person.givenName` + `surname` |
| Hero subtitle | `personalInfo.person.title` |
| Hero photo | `personalInfo.person.picture` (240×240, rounded) |
| Email button | `personalInfo.person.email` (shows/hides based on presence) |
| Executive strengths grid | `executiveSummary.items[]` (floaty cards + D3 mini-vizs) |
| Experience section | `experience[]` (immersive full-width alternating cards) |
| Job logo | `experience[].company.logo` (floating logo at top of card) |
| Job dates | `experience[].startDate` / `endDate` (formatted with arrow) |
| Job title | `experience[].title` (large heading) |
| Job company line | `company.displayName` + `contractorTo` + `team` |
| Job tagline | `experience[].tagline` (styled subtitle) |
| Job metric cards | `experience[].impactMetrics[]` OR auto-extracted metrics |
| Technology icons strip | `experience[].technologies[]` (horizontal icon row) |
| Accomplishment bullets | `experience[].dutiesAndAccomplishments` (first 4, with inline metric highlighting) |
| Tag chips | `initiatives[].name` + `themes[]` + `stack.*` (first 4 shown) |
| Skills section bars | **Hardcoded** `SKILLS` array in `SkillShowcase.tsx` |
| Hobbies card | `personalInfo.person.hobbies` (bullet-separated) |
| Career metrics (D3) | **Hardcoded** `DEFAULT_ROLES` + `DEFAULT_STATS` in `CareerMetrics.tsx` |
| Let's talk footer card | `personalInfo.person` — name, title, email |
| ChatGPT CTA | **Hardcoded** URL in `ChatGptCta.tsx` |

### Standard Page

| UI Section | Data Source |
|---|---|
| Header name | `personalInfo.person.givenName` + `surname` |
| Header title | `personalInfo.person.title` |
| Header location & email | Hardcoded "Seattle, WA" + `person.email` |
| Header photo | `personalInfo.person.picture` |
| Executive summary grid | `executiveSummary.items[]` |
| Experience entries | `experience[]` — full traditional resume format |
| Role header | `title` — `company.displayName` |
| Role team line | `contractorTo` + `team` |
| Role dates | `startDate` — `endDate` (or "Present") |
| Role bullets | **All** `dutiesAndAccomplishments` (not truncated) |
| Skills section | `proficiencies[]` — grouped by category |
| Hobbies section | `personalInfo.person.hobbies` |

### Career Metrics Section

The Career Metrics section (controlled by `siteConfig.showCareerMetrics`) displays two D3 visualizations:

1. **Career Timeline** — A horizontal swimlane Gantt chart showing company eras with thick gradient bars
2. **Hero Stats** — Large animated counter tiles with micro-sparkline accents

**Important**: Both visualizations currently use **hardcoded data** in `CareerMetrics.tsx` (`DEFAULT_ROLES` and `DEFAULT_STATS`). They are not dynamically generated from `resume.json`. To customize them, edit those constants directly.

### Skill Showcase Section

The skill bars on the Splash Page use a **hardcoded `SKILLS` array** in `SkillShowcase.tsx` with enriched data including categories, levels, and highlight flags. To customize:

1. Edit the `SKILLS` array in `src/site/src/components/SkillShowcase.tsx`
2. Update `CATEGORY_COLORS` and `LEVEL_VALUES` if you add new categories or levels

The skill visualization supports three display modes (controlled by `siteConfig`):
- **Skill Bars** (`showSkillBars: true`) — Animated horizontal progress bars grouped by category, with particle effects
- **Skill Wheel** (`showSkillWheel: false`) — Radial D3 visualization
- **Skill Cloud** (`showSkillCloud: false`) — Floating tag cloud

### Document Title & Open Graph Meta Tags

At **build time**, the Vite plugin `/src/site/vite-plugin-resume-meta.ts` reads `resume.json` and injects:
- `<title>` tag: `"{Name} – resume.json – {Title}"`
- Open Graph tags: `og:title`, `og:description`, `og:image`, `og:url`
- Twitter Card tags: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- `<meta name="description">` using the first executive summary item's body text

At **runtime**, the `<title>` is also set dynamically via `document.title` as soon as the resume data loads.

The OG image uses `personalInfo.person.picture` (resolved to an absolute URL using `VITE_SITE_URL` environment variable).

---

## Site Configuration Toggles

The file `src/site/src/lib/config.ts` provides toggles for visual features:

```typescript
export const siteConfig = {
  enableBlobBackground: false,    // Floating blob background animation
  enableSwooshField: false,       // Parallax swoosh effects
  maxTagsPerJob: 12,              // Max tag chips per job card
  showSkillWheel: false,          // Radial D3 skill wheel
  showSkillBars: true,            // Animated horizontal skill bars
  showSkillCloud: false,          // Floating skill cloud
  showCareerMetrics: true,        // D3 career metrics (timeline + hero stats)
}
```

These don't affect `resume.json` but control which visual components are rendered.

---

## Minimal Working Example

The absolute minimum `resume.json` that will pass validation and render:

```json
{
  "personalInfo": {
    "person": {
      "givenName": "Jane",
      "surname": "Doe"
    }
  }
}
```

This renders a bare-bones page with just the name in the hero section. No photo, no title, no email, no experience, no skills.

---

## Full-Featured Example

A single experience entry showcasing every field:

```json
{
  "personalInfo": {
    "person": {
      "givenName": "Jane",
      "surname": "Doe",
      "email": "jane@example.com",
      "location": "San Francisco, CA",
      "title": "AI Engineering Lead — Production ML Systems · Agentic AI · Platform Engineering",
      "picture": {
        "light": "/assets/light-mode/headshot-light.jpg",
        "dark": "/assets/dark-mode/headshot-dark.jpg",
        "altText": "Headshot of Jane Doe"
      },
      "hobbies": ["Rock Climbing", "Open Source", "Woodworking"]
    }
  },
  "executiveSummary": {
    "title": "Executive Summary",
    "items": [
      {
        "title": "AI Platform Leadership",
        "body": "Shipped production ML platforms serving 10M daily predictions with 99.9% uptime."
      },
      {
        "title": "Engineering Scale",
        "body": "Led distributed teams of 50+ engineers across 3 time zones building microservices at scale."
      },
      {
        "title": "Cost Optimization",
        "body": "Drove 60% infrastructure cost reduction through autoscaling and spot instance strategies."
      },
      {
        "title": "Technical Innovation",
        "body": "Pioneered internal ML frameworks now used by 200+ engineers across the organization."
      }
    ]
  },
  "proficiencies": [
    {
      "skillCategoryName": "Machine Learning",
      "skillNames": ["PyTorch", "TensorFlow", "scikit-learn", "MLflow", "Feature Engineering"],
      "level": "master",
      "yearsOfExperience": 8,
      "favoriteActivities": ["model architecture", "training optimization"]
    },
    {
      "skillCategoryName": "Cloud Infrastructure",
      "skillNames": ["AWS", "Kubernetes", "Terraform", "Docker"],
      "level": "advanced",
      "yearsOfExperience": 6,
      "favoriteActivities": ["infrastructure as code", "cost optimization"]
    }
  ],
  "experience": [
    {
      "company": {
        "displayName": "TechCo",
        "logo": {
          "invariant": "/assets/invariant/techco-logo.svg",
          "alt": "TechCo corporate logo"
        }
      },
      "title": "AI Engineering Lead",
      "team": "ML Platform",
      "startDate": { "year": 2022, "month": 1 },
      "endDate": null,
      "tagline": "Built and shipped the company's first production ML platform, serving 10M daily predictions and driving $20M ARR.",
      "themes": ["ML Platform", "Agentic AI", "Cost Optimization", "Team Leadership"],
      "signals": {
        "cost": 0.9,
        "speed": 0.85,
        "adoption": 0.8,
        "trust": 0.75,
        "engineering": 0.95
      },
      "impactMetrics": [
        {
          "label": "Daily predictions served",
          "value": "10M",
          "unit": "",
          "context": "99.9% uptime SLA",
          "viz": "text"
        },
        {
          "label": "Annual recurring revenue",
          "value": "$20M",
          "unit": "",
          "context": "From ML-powered product features",
          "viz": "text"
        },
        {
          "label": "Model accuracy improvement",
          "value": "85-97",
          "unit": "%",
          "context": "Across core prediction models",
          "viz": "range-gauge"
        },
        {
          "label": "Training time reduction",
          "value": "48→4",
          "unit": "hrs",
          "context": "Through distributed training pipeline",
          "viz": "before-after",
          "before": "48 hrs",
          "after": "4 hrs"
        },
        {
          "label": "Infrastructure cost reduction",
          "value": "60",
          "unit": "%",
          "context": "Autoscaling + spot instances",
          "viz": "tacho"
        },
        {
          "label": "Model deployments per week",
          "value": "50+",
          "unit": "/week",
          "context": "Continuous ML deployment pipeline",
          "viz": "speedo"
        },
        {
          "label": "Model experiments tracked",
          "value": "12,000",
          "unit": "",
          "context": "MLflow-tracked experiments across 12 teams",
          "viz": "sparkline",
          "sparkData": [50, 200, 800, 1500, 3000, 5000, 7500, 10000, 12000]
        },
        {
          "label": "Engineers using platform",
          "value": "200+",
          "unit": "",
          "context": "Self-service ML platform adoption",
          "viz": "text-icon",
          "icon": "people"
        }
      ],
      "initiatives": [
        {
          "name": "ML Platform v2",
          "problem": "ML teams reinvented infrastructure for every model, slowing time-to-production.",
          "approach": "Built a self-service platform with standardized training, evaluation, and deployment pipelines.",
          "outcome": "200+ engineers onboarded; model deployment time reduced from weeks to hours."
        },
        {
          "name": "Distributed Training Pipeline",
          "problem": "Large model training took 48+ hours on single instances.",
          "approach": "Implemented multi-GPU distributed training with automatic checkpointing and fault recovery.",
          "outcome": "12x training speedup; enabled models previously impossible to train."
        }
      ],
      "stack": {
        "methods": ["MLOps", "Agentic AI", "Feature Engineering"],
        "libraries": ["PyTorch", "MLflow", "Ray"],
        "cloud": ["AWS SageMaker", "EKS", "S3"],
        "data": ["Snowflake", "Redis", "PostgreSQL"],
        "integrations": ["Databricks", "GitHub Actions"]
      },
      "technologies": [
        {
          "name": "Python",
          "icon": { "agnostic": "/assets/icons/agnostic/python.svg" }
        },
        {
          "name": "Kubernetes",
          "icon": { "agnostic": "/assets/icons/agnostic/kubernetes.svg" }
        },
        {
          "name": "Docker",
          "icon": { "agnostic": "/assets/icons/agnostic/docker.svg" }
        }
      ],
      "dutiesAndAccomplishments": [
        "Architected and shipped the company's ML platform serving 10M daily predictions with 99.9% uptime.",
        "Led a team of 15 ML engineers and 8 platform engineers across 3 time zones.",
        "Drove 60% infrastructure cost reduction through autoscaling, spot instances, and resource optimization.",
        "Implemented distributed training pipeline reducing model training from 48 hours to 4 hours.",
        "Established MLOps practices: CI/CD for models, A/B testing framework, automated monitoring and alerting."
      ]
    }
  ]
}
```

---

## Common Mistakes & Troubleshooting

### 1. JSON Syntax Errors

**Problem**: Trailing commas, missing quotes, or unterminated strings.
**Fix**: Use a JSON validator or run `npm run check:resume` from the `src/site` directory.

### 2. `endDate` Before `startDate`

**Problem**: Schema error `endDate must be after startDate`.
**Fix**: Ensure `endDate` year/month is chronologically after `startDate`. For current roles, use `null`.

### 3. Empty Required Arrays

**Problem**: `dutiesAndAccomplishments` or `skillNames` is an empty array `[]`.
**Fix**: Must contain at least 1 entry, each with at least 1 character.

### 4. Skills Not Showing on Splash Page

**Problem**: You updated `proficiencies` but the Splash skill bars didn't change.
**Cause**: The Splash Page's skill bars use the hardcoded `SKILLS` array in `SkillShowcase.tsx`, not `resume.json`.
**Fix**: Edit `src/site/src/components/SkillShowcase.tsx` to update the Splash Page skills.

### 5. Metric Cards Not Appearing

**Problem**: No metric cards on a job entry.
**Cause**: No `impactMetrics` provided AND no extractable metrics in `dutiesAndAccomplishments`.
**Fix**: Either add `impactMetrics` or include metrics with units in your bullet text (e.g., "reduced build time by 80%", "saved $5M annually").

### 6. Logo Not Appearing

**Problem**: Company or profile logo not showing.
**Cause**: File path is wrong or the image file doesn't exist in `src/site/public/`.
**Fix**: Ensure the path in your JSON resolves to a file in `src/site/public/`. For `/assets/icons/agnostic/python.svg`, the file should exist at `src/site/public/assets/icons/agnostic/python.svg`.

### 7. Technology Icons Missing in One Theme

**Problem**: Icons show in dark mode but disappear in light mode (or vice versa).
**Cause**: Only one theme variant provided without a fallback.
**Fix**: Provide `agnostic` for universal icons, or provide both `light` and `dark` paths. The system falls back to the opposite theme if one is missing, so having at least one variant always works.

### 8. Career Metrics / Timeline Not Matching resume.json

**Problem**: The career timeline or hero stats show different data than your resume.
**Cause**: These sections use hardcoded data in `CareerMetrics.tsx`.
**Fix**: Edit `DEFAULT_ROLES` and `DEFAULT_STATS` in `src/site/src/components/CareerMetrics.tsx`.

### 9. Tags Not Showing

**Problem**: Tag chips at bottom of job cards aren't appearing.
**Cause**: No `initiatives`, `themes`, or `stack` data provided.
**Fix**: Add at least one of these fields to your experience entry.

### 10. ChatGPT Button URL

**Problem**: The "Ask on ChatGPT" button links to the wrong GPT.
**Cause**: The URL is hardcoded in `ChatGptCta.tsx`.
**Fix**: Edit the `CHATGPT_URL` constant in `src/site/src/components/ChatGptCta.tsx`.

---

## Quick Reference: Field → UI Feature Map

| resume.json Field | Splash Page Feature | Standard Page Feature |
|---|---|---|
| `personalInfo.person.givenName` + `surname` | Hero heading | Header name |
| `personalInfo.person.title` | Hero subtitle | Header subtitle |
| `personalInfo.person.email` | Email button (hero + footer) | Header meta |
| `personalInfo.person.picture` | 240×240 rounded hero photo | Header photo |
| `personalInfo.person.hobbies` | "Outside work" card in Skills section | "Hobbies" section |
| `executiveSummary.items[]` | Floaty cards with D3 mini-vizs | Bordered 2-col grid |
| `proficiencies[]` | *(not used — see SkillShowcase.tsx)* | Grouped skill lists |
| `experience[].company.logo` | Floating logo in job header | Not shown |
| `experience[].title` | Large job title heading | Role title |
| `experience[].company.displayName` | Company name line | Role header |
| `experience[].contractorTo` | "(Contractor to X)" | "(Contractor to X)" |
| `experience[].team` | "• Team" after company | Team line |
| `experience[].startDate` / `endDate` | "Jun 2021 → Present" with arrow | "Jun 2021 — Present" |
| `experience[].tagline` | Styled paragraph below title | Not shown |
| `experience[].impactMetrics[]` | D3 metric card grid | Not shown |
| `experience[].technologies[]` | Horizontal icon strip | Not shown |
| `experience[].dutiesAndAccomplishments` | First 4 bullets (highlighted) | All bullets |
| `experience[].initiatives[]` | Tag chips (name only) | Not shown |
| `experience[].themes[]` | Tag chips | Not shown |
| `experience[].stack.*` | Tag chips | Not shown |
| `experience[].signals` | *(available but currently hardcoded in CareerMetrics)* | Not shown |
