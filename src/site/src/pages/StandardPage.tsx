import { useEffect, useMemo, useState } from 'react'
import {
  formatMonthYear,
  fullName,
  loadResume,
  type ResumeJson,
  type ResumeJsonParseErrorDetails,
  type ResumeValidationResult,
} from '../lib/resume'
import { resolveLogoAlt, resolveLogoUri } from '../lib/logo'
import { useTheme } from '../lib/useTheme'

function PrintButton() {
  return (
    <button className="btn btnPrimary" onClick={() => window.print()}>
      Print / Save PDF
    </button>
  )
}

export default function StandardPage() {
  const { theme } = useTheme()
  const [resume, setResume] = useState<ResumeJson | null>(null)
  const [validation, setValidation] = useState<ResumeValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [parseError, setParseError] = useState<ResumeJsonParseErrorDetails | null>(null)

  useEffect(() => {
    let mounted = true
    loadResume()
      .then((r) => {
        if (!mounted) return
        setValidation(r)
        if (r.ok) setResume(r.resume)
      })
      .catch((e: unknown) => {
        const anyErr = e as any
        const message = e instanceof Error ? e.message : String(e)
        setError(message)
        setParseError(anyErr?.details ?? null)
      })
    return () => {
      mounted = false
    }
  }, [])

  const name = useMemo(() => (resume ? fullName(resume) : ''), [resume])

  if (error) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Could not load resume.json</div>
          <div className="small" style={{ marginBottom: parseError ? 12 : 0 }}>{error}</div>
          {parseError ? (
            <div
              className="pill"
              style={{
                display: 'grid',
                gap: 8,
                alignItems: 'start',
                justifyContent: 'start',
                padding: 12,
                textAlign: 'left',
                background: 'rgba(0,0,0,0.25)',
              }}
            >
              <div style={{ fontWeight: 800 }}>Parse details</div>
              {typeof parseError.line === 'number' && typeof parseError.column === 'number' ? (
                <div className="small" style={{ color: 'var(--muted)' }}>
                  line {parseError.line}, column {parseError.column}
                </div>
              ) : null}
              {parseError.snippet ? (
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: 12,
                    lineHeight: 1.35,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    color: 'rgba(255,255,255,0.92)',
                    userSelect: 'text',
                  }}
                >
                  {parseError.snippet}
                </pre>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  if (!resume) {
    if (validation && !validation.ok) {
      return (
        <div className="container" style={{ padding: '40px 0' }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>resume.json validation failed</div>
            <div className="small" style={{ marginBottom: 12 }}>
              Fix the issues below. The resume will not render until `resume.json` is valid.
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {validation.errors.slice(0, 30).map((i, idx) => (
                <div key={`${i.path}-${idx}`} className="pill" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                    {i.path}
                  </span>
                  <span className="small" style={{ color: 'var(--muted)' }}>
                    {i.message}
                  </span>
                </div>
              ))}
              {validation.errors.length > 30 ? (
                <div className="small">Showing first 30 of {validation.errors.length} errors.</div>
              ) : null}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Loading…</div>
          <div className="small">Fetching `resume.json`</div>
        </div>
      </div>
    )
  }

  const person = resume.personalInfo.person
  const profileSrc = resolveLogoUri(person.picture, theme)
  const profileAlt = resolveLogoAlt(person.picture, 'Profile photo')
  const summary = resume.executiveSummary?.items ?? []
  const prof = resume.proficiencies ?? []
  const experience = resume.experience ?? []

  return (
    <div>
      <main className="standardRoot">
        <div className="standardPage">
          <div className="standardNoPrint" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <PrintButton />
          </div>
          <div className="standardHeader">
            <div>
              <h1 className="standardName">{name}</h1>
              <div className="standardTitle">{person.title}</div>
              <div className="standardMeta">
                <span>Seattle, WA</span>
                {person.email ? <span> • {person.email}</span> : null}
              </div>
            </div>
            {profileSrc ? (
              <img
                className="standardPhoto"
                src={profileSrc}
                alt={profileAlt}
                loading="lazy"
              />
            ) : null}
          </div>

          {summary.length ? (
            <section className="standardSection">
              <h2>Executive summary</h2>
              <div className="standardSummaryGrid">
                {summary.map((s) => (
                  <div key={s.title} className="standardSummaryItem">
                    <div className="standardSummaryTitle">{s.title}</div>
                    <div className="standardSummaryBody">{s.body}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="standardSection">
            <h2>Experience</h2>
            {experience.map((e) => {
              const from = formatMonthYear(e.startDate)
              const to = e.endDate ? formatMonthYear(e.endDate) : 'Present'
              return (
                <div
                  key={`${e.company.displayName}-${e.title}-${e.startDate.year}-${e.startDate.month}`}
                  className="standardRole"
                >
                  <div className="standardRoleTop">
                    <div>
                      <div className="standardRoleTitle">
                        {e.title} — {e.company.displayName}
                      </div>
                      <div className="standardRoleTeam">
                        {e.contractorTo ? `Contractor to ${e.contractorTo} • ` : ''}
                        {e.team ?? ''}
                      </div>
                    </div>
                    <div className="standardRoleDates">
                      {from} — {to}
                    </div>
                  </div>
                  <ul className="standardBullets">
                    {e.dutiesAndAccomplishments.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </section>

          {prof.length ? (
            <section className="standardSection">
              <h2>Skills</h2>
              <div className="standardSkillGroups">
                {prof.map((p, idx) => (
                  <div key={`${p.skillCategoryName ?? 'skills'}-${idx}`} className="standardSkillGroup">
                    <div className="standardSkillGroupTitle">
                      {p.skillCategoryName ?? 'Skills'}
                      {p.level ? ` (${p.level})` : ''}
                      {p.yearsOfExperience ? ` • ${p.yearsOfExperience}y` : ''}
                    </div>
                    <div className="standardSkillsList">{p.skillNames.join(', ')}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {person.hobbies?.length ? (
            <section className="standardSection">
              <h2>Hobbies</h2>
              <div className="standardHobbies">{person.hobbies.join(' • ')}</div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  )
}
