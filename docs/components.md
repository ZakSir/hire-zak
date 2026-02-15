# Component Reference

> Detailed API documentation for every React component in the hire-zak site.

---

## Layout Components

### `SiteShell`

**File**: `src/site/src/components/SiteShell.tsx`

The root layout wrapper for all routes. Renders the persistent top navigation bar and background effects, with a React Router `<Outlet />` for page content.

#### Behavior
- Reads the current route via `useLocation()`
- Disables `MatrixBackground` and `SwooshField` on the `/standard` route (for clean print view)
- Renders two navigation links: "Splash" (`/`) and "Standard / Print" (`/standard`)
- All child pages render inside the `<Outlet />`

#### Structure
```
<div>
  <MatrixBackground enabled={!isStandard} />
  <SwooshField enabled={!isStandard} />
  <div (relative z-index layer)>
    <header.topNav>
      <Link to="/">Splash</Link>
      <Link to="/standard">Standard / Print</Link>
    </header>
    <Outlet />
  </div>
</div>
```

#### Notes
- The `topNav` header has `className="standardNoPrint"` — it's hidden when printing the Standard page
- Background effects sit at negative z-index behind the content layer

---

## Page Components

### `SplashPage`

**File**: `src/site/src/pages/SplashPage.tsx`  
**Route**: `/`

The immersive animated resume experience. This is the largest component (~540 lines).

#### State
| State | Type | Description |
|-------|------|-------------|
| `resume` | `ResumeJson \| null` | Parsed and validated resume data |
| `validation` | `ResumeValidationResult \| null` | Validation result (ok/errors) |
| `error` | `string \| null` | Fatal error message |
| `parseError` | `ResumeJsonParseErrorDetails \| null` | JSON parse error details |
| `scrollY` | `number` | Current scroll position (for parallax) |
| `blobTime` | `number` | Elapsed time in seconds (for blob animation) |

#### Hooks Used
- `useTheme()` — for theme-aware logo resolution
- `useInView()` — for scroll-triggered section reveals
- `useMemo()` — for parallax transform and blob CSS variable calculations

#### Sub-Components

**`Section`** — Internal wrapper for content sections:
- Props: `id?`, `eyebrow?`, `title`, `children`
- Adds fade-in animation via `useInView`
- Renders optional eyebrow pill, h2 title, reveal line, and content

**`TimelineItem`** — Individual job card in the immersive timeline:
- Props: `exp` (ResumeExperience), `id`, `index`
- Alternates left/right based on `index % 2`
- Renders: background number, floating orb, company logo, dates, title, tagline, stat cards, accomplishments (with metric highlighting), and tags
- Limits tags to `siteConfig.maxTagsPerJob`
- Falls back to text-extracted metrics when `impactMetrics` is not provided

#### Rendering Flow
1. Loading state → "Loading…" card
2. Error state → Error card with parse details (line/column/snippet)
3. Validation failure → Error panel with up to 30 issues listed
4. Success → Full page:
   - Blob background (if enabled)
   - Hero section (name, title, photo, CTA buttons, parallax)
   - Executive Summary section (2-column floaty cards)
   - Experience intro heading
   - Immersive timeline (full-width alternating job cards)
   - Skills section (`SkillBars` component)
   - Hobbies section
   - "Let's Talk" CTA section
   - MacTerminal showcase
   - Footer

---

### `StandardPage`

**File**: `src/site/src/pages/StandardPage.tsx`  
**Route**: `/standard`

A clean, print-optimized resume layout designed for PDF export.

#### State
Same state shape as `SplashPage` (resume, validation, error, parseError).

#### Sub-Components

**`PrintButton`** — Simple button calling `window.print()`

#### Rendering
- White background card (920px max-width)
- Header: name, title, location, email, profile photo
- Executive summary in 2-column bordered grid
- Experience list with dates, company, team, and bulleted accomplishments
- Skills grouped by category with level and years of experience
- Hobbies joined with bullet separators (`•`)

#### Print Behavior
- Elements with `className="standardNoPrint"` are hidden (including the Print button itself and the top nav)
- `standard.css` includes `@media print` rules for clean output

---

## Visual Effect Components

### `MatrixBackground`

**File**: `src/site/src/components/MatrixBackground.tsx`

A full-viewport `<canvas>` element rendering falling katakana characters.

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Whether to render the animation |

#### Technical Details
- **Character set**: Katakana (ｱ-ﾝ) + digits + uppercase Latin
- **Font**: `14px ui-monospace` system monospace stack
- **Animation rate**: Fixed 24fps cadence (independent of display refresh rate)
- **Fall speed**: 0.40 units per tick (deliberately slow, cinematic)
- **DPR handling**: Renders at `Math.min(2, devicePixelRatio)` for retina support
- **Overwrite effect**: 10% chance a character overwrites in-place (like the film)
- **Head characters**: 5.5% chance of a brighter "head" character

#### Theme Colors
| Theme | Fade | Ink | Ink2 | Head |
|-------|------|-----|------|------|
| Dark | `rgba(0,0,0,0.32)` | `rgba(255,43,214,0.16)` | `rgba(21,244,255,0.14)` | `rgba(255,255,255,0.26)` |
| Light | `rgba(255,255,255,0.26)` | `rgba(139,92,246,0.18)` | `rgba(21,244,255,0.16)` | `rgba(10,10,18,0.22)` |

#### Accessibility
- Automatically disabled when `prefers-reduced-motion: reduce` is set
- Canvas element has `aria-hidden="true"`
- Overall opacity: 0.34 (subtle background effect)

---

### `SwooshField`

**File**: `src/site/src/components/SwooshField.tsx`

Parallax gradient swoosh overlay responding to mouse position and scroll depth.

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Whether to render the effect |

#### Technical Details
- Tracks `pointermove` and `scroll` events
- Uses critically-damped spring physics: `curX += (targetX - curX) * (1 - e^(-k*dt))`
- Drives 6 CSS custom properties: `--sx`, `--sy`, `--s1`, `--s2`, `--s3`, `--sp`
- Movement increases as the user scrolls deeper (`--sp` ranges from 0 to 1)
- Renders 4 swoosh elements (`swooshA` through `swooshD`) + sparkle dust

#### CSS Structure
```html
<div class="swooshField">
  <div class="swoosh swooshA" />
  <div class="swoosh swooshB" />
  <div class="swoosh swooshC" />
  <div class="swoosh swooshD" />
  <div class="sparkleDust" />
</div>
```

#### Accessibility
- Disabled when `prefers-reduced-motion: reduce` is set
- Element has `aria-hidden="true"`
- Uses `mix-blend-mode: screen` for non-destructive overlay

---

### `MacTerminal`

**File**: `src/site/src/components/MacTerminal.tsx`

A realistic macOS terminal simulator that cycles through demo commands.

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `'Terminal — zsh'` | Title bar text |

#### Demo Commands
The component cycles through 7 pre-configured command demos:

| Command | Output Type | Pause |
|---------|------------|-------|
| `git log --oneline --author="Zak" \| head -5` | 5 commit lines | 3.5s |
| `gh pr list --author @me --state merged --limit 3` | 3 merged PRs | 3.2s |
| `npm info @zakfargo/mcp-tools` | Package info | 3.8s |
| `az cognitiveservices account list` | 3 Azure resources | 2.8s |
| `docker images \| grep "ai-"` | 4 Docker images | 3.0s |
| `pytest tests/ -v --tb=no \| tail -5` | Test results (147 passed) | 4.0s |
| `kubectl get pods -n ai-prod` | 3 running pods | 2.6s |

#### Animation Timing
- **Typing speed**: 35–80ms per character (randomized for realism)
- **Pre-output pause**: 300ms
- **Output line stagger**: 80–200ms between lines
- **Post-output pause**: 2.5–4.0s (configurable per demo)
- **Cursor blink**: 520ms interval

#### Line Types
| Type | CSS Class | Color |
|------|-----------|-------|
| `prompt` | `macPrompt` | Prompt text color |
| `out` | (default) | Standard output |
| `success` | `macSuccess` | Green-tinted |
| `info` | `macInfo` | Blue-tinted |
| `warn` | `macWarn` | Yellow-tinted |

---

### `MetricsBanner`

**File**: `src/site/src/components/MetricsBanner.tsx`

D3-powered animated metric display with arc gauges and progress bars.

#### Props
| Prop | Type | Description |
|------|------|-------------|
| `metrics` | `MetricData[]` | Array of metric objects |

#### `MetricData` Type
```typescript
type MetricData = {
  value: string       // Raw metric string, e.g., "40%", "$5M"
  label: string       // Description, e.g., "reduction in build time"
  numericValue?: number
  suffix?: string
}
```

#### Layout
- First 3 metrics → **Arc gauges** (D3 SVG arcs)
- Remaining metrics (up to 3 more) → **Bar charts** (HTML + CSS)
- Background particle effects (12 particles)

#### Arc Gauge Details
- 270° arc sweep (±135° from top)
- Background track: `rgba(255,255,255,0.08)`
- Foreground: linear gradient using `--brand` → `--brand2` → `--brand3`
- Glow filter via SVG `feGaussianBlur`
- Entry animation: `easeElasticOut` D3 transition (1500ms, staggered by 150ms)

#### Number Animation
- `easeOutExpo` easing over 1800ms
- Staggered delays per metric (index × 150ms + 300ms)
- Handles dollar prefixes and percentage suffixes

---

## Skill Visualization Components

### `SkillShowcase`

**File**: `src/site/src/components/SkillShowcase.tsx`

Container component exporting three visualization modes plus a combined showcase.

#### Exports
| Export | Type | Description |
|--------|------|-------------|
| `SkillBars` | Component | Animated progress bars (default) |
| `SkillWheel` | Component | Radial D3 mastery map |
| `SkillCloud` | Component | Floating tag cloud |
| `default` (SkillShowcase) | Component | All three combined |

#### `SKILLS` Data
A hardcoded array of 33 skills across 5 categories:

| Category | Color | Count | Example Skills |
|----------|-------|-------|---------------|
| AI & LLMs | `#22d3ee` (cyan) | 10 | Agentic AI, RAG Systems, LangChain |
| Governance | `#8b5cf6` (purple) | 5 | AI Governance, NIST AI RMF, Model Risk |
| Cloud | `#3b82f6` (blue) | 8 | Azure, Azure OpenAI, Azure Policy |
| Languages | `#10b981` (green) | 5 | Python, TypeScript, C#, React |
| Leadership | `#ff2bd6` (pink) | 4 | Engineering Leadership, AI Strategy |

Each skill has: `name`, `category`, `level` (`'master'|'advanced'|'intermediate'`), and optional `highlight` flag.

#### `SkillBars` Details
- Groups skills by category (max 6 per category)
- Each bar animates from 0% to mastery width on scroll-into-view
- Particle intro burst: 30 particles with random position/size/color/delay
- Staggered category card entrance: `--swoosh-delay` CSS variable
- Per-bar fly-in: `--fly-delay` CSS variable
- Shimmer overlay on filled bars
- Star (★) indicator for highlighted skills

#### `SkillWheel` Details
- 500×500 SVG viewbox with D3 radial layout
- Skills radiate from center at distances proportional to mastery (50–220px)
- Center circle with "SKILLS" label
- Connecting lines from center ring (radius 55) to skill nodes
- Elastic entrance animations per skill node
- Labels shown only for highlighted skills
- Category color legend in top-left

#### `SkillCloud` Details
- Filters to highlighted/master skills (max 18)
- Each skill rendered as a floating `<div>` with CSS animations
- Staggered `animationDelay` per skill
- Hero skills get additional emphasis class

---

### `SkillConstellation`

**File**: `src/site/src/components/SkillConstellation.tsx`

Force-directed D3 graph for skill visualization.

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `skills` | `Array<{ name, weight?, group? }>` | — | Skill data |
| `height` | `number` | `420` | SVG height |
| `title` | `string` | `'Skill constellation'` | Heading text |

#### Force Simulation
- `forceManyBody`: strength -44
- `forceCenter`: centered in viewport
- `forceLink`: distance 24–76px, strength 0.25–0.80
- `forceCollide`: radius + 6px padding

#### Node Sizing
- Radius: 8–24px based on weight (normalized to max)
- Max 42 nodes displayed
- Max 140 links

#### Link Generation
- Alphabetical neighbors (k=1,2)
- Same-group connections
- De-duplicated

#### Interactions
- **Drag**: D3 drag behavior with alpha reheat
- **Hover**: Highlights node, dims unconnected nodes/links, shows labels
- **Camera parallax**: `pointermove` translates the SVG group (±10px, ±8px)

#### Coloring
Uses a deterministic hash of the group name:
| Hash mod 4 | Color |
|------------|-------|
| 0 | `rgba(34,211,238,0.85)` (cyan) |
| 1 | `rgba(255,43,214,0.78)` (pink) |
| 2 | `rgba(139,92,246,0.78)` (purple) |
| 3 | `rgba(255,210,31,0.55)` (yellow) |

#### Accessibility
- Pre-runs 120 ticks if `prefers-reduced-motion` (no animation)
- Responsive to window resize

---

## Navigation Components

### `StickyNavRail`

**File**: `src/site/src/components/StickyNavRail.tsx`

Fixed-position vertical dot navigation for the Splash page.

#### Props
| Prop | Type | Description |
|------|------|-------------|
| `sections` | `TimelineSection[]` | Section definitions |

#### `TimelineSection` Type
```typescript
type TimelineSection = {
  id: string       // Element ID to observe and scroll to
  label: string    // Display text for the nav dot
  type: 'main' | 'job'  // Main section vs nested job
  date?: string    // Date label for job dots
}
```

#### Behavior
- Creates an `IntersectionObserver` per section (`threshold: 0.3`, `rootMargin: '-20% 0px -60% 0px'`)
- Tracks `activeId` state — updates when a section enters view
- Job dots appear nested under the "Experience" section
- Experience section shows as active when any job is active
- Click handler: `element.scrollIntoView({ behavior: 'smooth', block: 'start' })`

#### Accessibility
- `<nav>` element with `aria-label="Page navigation"`
- Active items have `aria-current="true"`
- All dots are `<button>` elements (keyboard accessible)
