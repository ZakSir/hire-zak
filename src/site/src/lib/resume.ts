import { z } from 'zod'

export type ResumeDate = {
  year: number
  month: number
}

export type ResumeImage = {
  uri: string
  altText?: string
  alt?: string
}

export type ResumeLogo =
  | ResumeImage
  | {
      light?: string
      dark?: string
      invariant?: string
      altText?: string
      alt?: string
    }

export type ResumeCompany = {
  displayName: string
  logo?: ResumeLogo
}

export type TechnologyIcon = {
  agnostic?: string
  light?: string
  dark?: string
}

export type Technology = {
  name: string
  icon: TechnologyIcon
  url?: string
}

export type ResumeExperience = {
  company: ResumeCompany
  contractorTo?: string
  title: string
  team?: string
  startDate: ResumeDate
  endDate: ResumeDate | null
  dutiesAndAccomplishments: string[]
  technologies?: Technology[]
}

export type ResumeSkillCategory = {
  skillCategoryName?: string
  skillNames: string[]
  level?: string
  yearsOfExperience?: number
  favoriteActivities?: string[]
}

export type ResumeSummaryItem = {
  title: string
  body: string
}

export type ResumeJson = {
  personalInfo: {
    person: {
      picture?: ResumeLogo
      givenName: string
      surname: string
      email?: string
      location?: string
      title?: string
      hobbies?: string[]
    }
  }
  executiveSummary?: {
    title?: string
    items?: ResumeSummaryItem[]
  }
  proficiencies?: ResumeSkillCategory[]
  experience?: ResumeExperience[]
}

const ResumeDateSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
})

const ResumeImageSchema = z.object({
  uri: z.string().min(1),
  altText: z.string().optional(),
  alt: z.string().optional(),
})

const ResumeLogoSchema = z.union([
  ResumeImageSchema,
  z.object({
    light: z.string().min(1).optional(),
    dark: z.string().min(1).optional(),
    invariant: z.string().min(1).optional(),
    altText: z.string().optional(),
    alt: z.string().optional(),
  }),
])

const ResumeCompanySchema = z.object({
  displayName: z.string().min(1),
  logo: ResumeLogoSchema.optional(),
})

const ResumeExperienceSchema = z
  .object({
    company: ResumeCompanySchema,
    contractorTo: z.string().optional(),
    title: z.string().min(1),
    team: z.string().optional(),
    startDate: ResumeDateSchema,
    endDate: ResumeDateSchema.nullable(),
    dutiesAndAccomplishments: z.array(z.string().min(1)).min(1),

    // Visualization-friendly (optional)
    tagline: z.string().optional(),
    highlights: z.array(z.string().min(1)).optional(),
    themes: z.array(z.string().min(1)).optional(),
    signals: z.record(z.string(), z.number().min(0).max(1)).optional(),
    impactMetrics: z
      .array(
        z.object({
          label: z.string().min(1),
          value: z.string().min(1),
          unit: z.string().optional(),
          context: z.string().optional(),
          viz: z.string().optional(),
          icon: z.string().optional(),
          before: z.string().optional(),
          after: z.string().optional(),
          sparkData: z.array(z.number()).optional(),
          sparkData2: z.array(z.number()).optional(),
        })
      )
      .optional(),
    initiatives: z
      .array(
        z.object({
          name: z.string().min(1),
          problem: z.string().min(1),
          approach: z.string().min(1),
          outcome: z.string().min(1),
        })
      )
      .optional(),
    stack: z
      .object({
        methods: z.array(z.string().min(1)).optional(),
        libraries: z.array(z.string().min(1)).optional(),
        cloud: z.array(z.string().min(1)).optional(),
        data: z.array(z.string().min(1)).optional(),
        integrations: z.array(z.string().min(1)).optional(),
      })
      .optional(),
    technologies: z
      .array(
        z.object({
          name: z.string().min(1),
          icon: z.object({
            agnostic: z.string().optional(),
            light: z.string().optional(),
            dark: z.string().optional(),
          }),
          url: z.string().min(1).optional(),
        })
      )
      .optional(),
  })
  .superRefine((exp, ctx) => {
    if (exp.endDate) {
      const start = exp.startDate.year * 12 + exp.startDate.month
      const end = exp.endDate.year * 12 + exp.endDate.month
      if (end < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'endDate must be after startDate',
          path: ['endDate'],
        })
      }
    }
  })

const ResumeSkillCategorySchema = z.object({
  skillCategoryName: z.string().optional(),
  skillNames: z.array(z.string().min(1)).min(1),
  level: z.string().optional(),
  yearsOfExperience: z.number().int().min(0).max(80).optional(),
  favoriteActivities: z.array(z.string().min(1)).optional(),
})

const ResumeSummaryItemSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
})

export const ResumeJsonSchema = z.object({
  personalInfo: z.object({
    person: z.object({
      picture: ResumeLogoSchema.optional(),
      givenName: z.string().min(1),
      surname: z.string().min(1),
      email: z.string().optional(),
      location: z.string().optional(),
      title: z.string().optional(),
      hobbies: z.array(z.string().min(1)).optional(),
    }),
  }),
  executiveSummary: z
    .object({
      title: z.string().optional(),
      items: z.array(ResumeSummaryItemSchema).optional(),
    })
    .optional(),
  proficiencies: z.array(ResumeSkillCategorySchema).optional(),
  experience: z.array(ResumeExperienceSchema).optional(),
})

export type ResumeValidationIssue = {
  level: 'error' | 'warning'
  path: string
  message: string
}

export type ResumeJsonParseErrorDetails = {
  message: string
  line?: number
  column?: number
  snippet?: string
}

export type ResumeValidationResult =
  | { ok: true; resume: ResumeJson; warnings: ResumeValidationIssue[] }
  | { ok: false; errors: ResumeValidationIssue[]; warnings: ResumeValidationIssue[] }

function zodPathToString(path: Array<string | number>): string {
  if (!path.length) return '$'
  return '$.' + path.map((p) => (typeof p === 'number' ? `[${p}]` : p)).join('.')
}

function toIssues(level: 'error' | 'warning', issues: z.ZodIssue[]): ResumeValidationIssue[] {
  return issues.map((i) => ({
    level,
    path: zodPathToString(i.path as Array<string | number>),
    message: i.message,
  }))
}

export function validateResumeJson(data: unknown): ResumeValidationResult {
  const parsed = ResumeJsonSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false, errors: toIssues('error', parsed.error.issues), warnings: [] }
  }

  const resume = parsed.data as ResumeJson
  const warnings: ResumeValidationIssue[] = []

  // Non-fatal warnings: help keep content polished.
  const email = resume.personalInfo.person.email
  if (email && !email.includes('@')) {
    warnings.push({ level: 'warning', path: '$.personalInfo.person.email', message: 'email may be invalid' })
  }

  return { ok: true, resume, warnings }
}

export async function loadResume(): Promise<ResumeValidationResult> {
  const response = await fetch(`${import.meta.env.BASE_URL}resume.json`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to load resume.json: ${response.status} ${response.statusText}`)
  }

  // Parse as text first so we can surface a helpful error snippet
  // (response.json() discards line/column context).
  const text = await response.text()
  let raw: unknown
  try {
    raw = JSON.parse(text) as unknown
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)

    const details: ResumeJsonParseErrorDetails = { message }

    const match = message.match(/position\s+(\d+)|line\s+(\d+)\s+column\s+(\d+)/i)
    if (match) {
      if (match[2] && match[3]) {
        details.line = Number(match[2])
        details.column = Number(match[3])
      }
    }

    const posMatch = message.match(/position\s+(\d+)/i)
    const pos = posMatch ? Number(posMatch[1]) : undefined
    if (typeof pos === 'number' && Number.isFinite(pos)) {
      const start = Math.max(0, pos - 180)
      const end = Math.min(text.length, pos + 180)
      const before = text.slice(start, pos)
      const after = text.slice(pos, end)
      // Keep the snippet single-line-ish like console output.
      const esc = (s: string) => s.replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t')
      details.snippet = `${esc(before)}^${esc(after)}`
    }

    throw Object.assign(new Error('resume.json parse error'), { name: 'ResumeJsonParseError', details })
  }

  return validateResumeJson(raw)
}

export function fullName(resume: ResumeJson): string {
  return `${resume.personalInfo.person.givenName} ${resume.personalInfo.person.surname}`
}

export function formatMonthYear(date: ResumeDate): string {
  const d = new Date(Date.UTC(date.year, Math.max(0, (date.month ?? 1) - 1), 1))
  return d.toLocaleString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' })
}
