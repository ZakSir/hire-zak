import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  formatMonthYear,
  fullName,
  loadResume,
  type ResumeExperience,
  type ResumeJson,
  type ResumeJsonParseErrorDetails,
  type ResumeValidationResult,
} from '../lib/resume'
import { resolveLogoAlt, resolveLogoUri } from '../lib/logo'
import { useInView } from '../lib/useInView'
import { useTheme } from '../lib/useTheme'
import { extractMetrics, highlightMetrics } from '../lib/metrics'
import { siteConfig } from '../lib/config'
import MacTerminal from '../components/MacTerminal'
import { SkillBars } from '../components/SkillShowcase'
import CareerMetrics from '../components/CareerMetrics'
import JobMetricViz from '../components/JobMetricViz'
import ChatGptCta from '../components/ChatGptCta'
import ExecStrengthViz from '../components/ExecStrengthViz'

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string
  eyebrow?: string
  title: string
  children: React.ReactNode
}) {
  const { ref, visible } = useInView<HTMLDivElement>()

  return (
    <section id={id} style={{ padding: '48px 0' }}>
      <div ref={ref} className={`fadeIn ${visible ? 'visible' : ''}`}>
        {eyebrow ? (
          <div className="pill staggerChild" style={{ display: 'inline-flex', marginBottom: 16 }}>
            <span className="small" style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>
              {eyebrow}
            </span>
          </div>
        ) : null}
        <h2 className="staggerChild" style={{ margin: '0 0 16px 0', fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>{title}</h2>
        <div className="revealLine staggerChild" style={{ margin: '24px 0 36px' }} />
        <div className="staggerChild">{children}</div>
      </div>
    </section>
  )
}

function ExecStrengthCard({ item, index }: { item: { title: string; body: string }; index: number }) {
  const { ref, visible } = useInView<HTMLDivElement>(0.25)

  return (
    <div ref={ref} className="floaty-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '1.05rem' }}>{item.title}</div>
          <div className="muted" style={{ lineHeight: 1.65 }}>{item.body}</div>
        </div>
        <div className="exec-viz-slot" style={{ flexShrink: 0, marginTop: -8, marginRight: -8, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <ExecStrengthViz cardIndex={index} visible={visible} />
        </div>
      </div>
    </div>
  )
}

function TimelineItem({ exp, id, index }: { exp: ResumeExperience; id: string; index: number }) {
  const { theme } = useTheme()
  const { ref, visible } = useInView<HTMLDivElement>()
  const from = formatMonthYear(exp.startDate)
  const to = exp.endDate ? formatMonthYear(exp.endDate) : 'Present'
  const logoSrc = resolveLogoUri(exp.company.logo, theme)
  const logoAlt = resolveLogoAlt(exp.company.logo, exp.company.displayName)

  const allText = exp.dutiesAndAccomplishments.join(' ')
  const textMetrics = extractMetrics(allText)

  // Prefer structured impactMetrics, fall back to text extraction
  const impactMetrics = (exp as any).impactMetrics as
    | Array<{ label: string; value: string; unit?: string; context?: string; viz?: string; icon?: string; before?: string; after?: string; sparkData?: number[]; sparkData2?: number[] }>
    | undefined
  
  // Convert impactMetrics to banner format, or use extracted text metrics
  const bannerMetrics = impactMetrics?.length 
    ? impactMetrics.map(m => ({ 
        value: `${m.value}${m.unit || ''}`, 
        label: m.label 
      }))
    : textMetrics.map(m => ({ value: m.raw, label: m.context || 'impact' }))

  const initiatives = (exp as any).initiatives as
    | Array<{ name: string; problem: string; approach: string; outcome: string }>
    | undefined
  const themes = ((exp as any).themes as string[] | undefined) ?? []
  const tagline = (exp as any).tagline as string | undefined
  const stack = (exp as any).stack as
    | {
        methods?: string[]
        libraries?: string[]
        cloud?: string[]
        data?: string[]
        integrations?: string[]
      }
    | undefined
  
  // Limit tags based on config
  const allTags = [
    ...(initiatives?.map(p => ({ text: p.name, type: 'initiative' })) ?? []),
    ...themes.map(t => ({ text: t, type: 'theme' })),
    ...[...(stack?.methods ?? []), ...(stack?.libraries ?? []), ...(stack?.cloud ?? []), ...(stack?.data ?? []), ...(stack?.integrations ?? [])].map(t => ({ text: t, type: 'stack' })),
  ].slice(0, siteConfig.maxTagsPerJob)

  const isEven = index % 2 === 0

  return (
    <section 
      id={id} 
      className={`immersive-job ${isEven ? 'job-left' : 'job-right'}`}
      aria-label={`${exp.title} at ${exp.company.displayName}`}
    >
      {/* Large background number */}
      <div className="job-bg-number">{String(index + 1).padStart(2, '0')}</div>
      
      {/* Floating decorative orb */}
      <div className={`job-orb ${isEven ? 'orb-right' : 'orb-left'}`} />
      
      <div ref={ref} className={`job-content fadeIn ${visible ? 'visible' : ''}`}>
        {/* Logo + dates row */}
        <div className="job-header-row">
          {logoSrc ? (
            <div className="job-logo-float">
              <img src={logoSrc} alt={logoAlt} loading="lazy" />
            </div>
          ) : null}
          
          <div className="job-dates-float">
            <span>{from}</span>
            <span className="date-divider">→</span>
            <span>{to}</span>
          </div>
        </div>

        <h3 className="job-title-big">{exp.title}</h3>
        
        <div className="job-company">
          {exp.company.displayName}
          {exp.contractorTo ? ` (Contractor to ${exp.contractorTo})` : ''}
          {exp.team ? ` • ${exp.team}` : ''}
        </div>

        {tagline ? (
          <p className="job-tagline">{tagline}</p>
        ) : null}

        {/* Metrics as D3 graphics */}
        {impactMetrics && impactMetrics.length > 0 ? (
          <JobMetricViz metrics={impactMetrics.map(m => ({
            value: m.value,
            label: m.label,
            unit: m.unit,
            context: m.context,
            viz: m.viz,
            icon: m.icon,
            before: m.before,
            after: m.after,
            sparkData: m.sparkData,
            sparkData2: m.sparkData2,
          }))} />
        ) : bannerMetrics.length > 0 ? (
          <JobMetricViz metrics={bannerMetrics.slice(0, 3).map(m => ({
            value: m.value,
            label: m.label,
          }))} />
        ) : null}

        {/* Technology icons */}
        {exp.technologies && exp.technologies.length > 0 && (
          <div className="job-tech-icons">
            {exp.technologies.map((tech, i) => {
              const src = tech.icon.agnostic
                ?? (theme === 'dark' ? tech.icon.dark : tech.icon.light)
                ?? tech.icon.light
                ?? tech.icon.dark
              return src ? (
                <div
                  key={tech.name}
                  className="tech-icon-item"
                  title={tech.name}
                  style={{ transitionDelay: `${400 + i * 30}ms` }}
                >
                  <img src={src} alt={tech.name} loading="lazy" />
                </div>
              ) : null
            })}
          </div>
        )}

        {/* Accomplishments */}
        <div className="job-accomplishments">
          {exp.dutiesAndAccomplishments.slice(0, 4).map((d, i) => {
            const { parts } = highlightMetrics(d)
            return (
              <div key={i} className="accomplishment-item">
                <span className="accomplishment-bullet">▸</span>
                <span>
                  {parts.map((p, idx) =>
                    p.isMetric ? (
                      <span key={idx} className="metricInline">{p.t}</span>
                    ) : (
                      <span key={idx}>{p.t}</span>
                    )
                  )}
                </span>
              </div>
            )
          })}
        </div>

        {/* Tags as subtle chips */}
        {allTags.length > 0 && (
          <div className="job-tags">
            {allTags.slice(0, 4).map((tag) => (
              <span key={tag.text} className="job-tag">{tag.text}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default function SplashPage() {
  const { theme } = useTheme()
  const [resume, setResume] = useState<ResumeJson | null>(null)
  const [validation, setValidation] = useState<ResumeValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [parseError, setParseError] = useState<ResumeJsonParseErrorDetails | null>(null)
  const blobFieldRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const profileParallaxRef = useRef<HTMLDivElement>(null)

  // Reduced motion detection
  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  }, [])

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

    const onScroll = () => {
      const sy = window.scrollY || 0
      const heroEl = heroRef.current
      if (heroEl) {
        const t = Math.min(50, sy * 0.08)
        heroEl.style.transform = `translateY(${t}px)`
      }
      const profileEl = profileParallaxRef.current
      if (profileEl) {
        const t2 = Math.min(36, sy * 0.06)
        profileEl.style.transform = `translateY(${t2}px)`
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    // Time-based blob animation (independent of scroll) — throttled to ~24fps
    let raf = 0
    if (!reducedMotion) {
      const start = performance.now()
      let lastFrame = 0
      const tick = (now: number) => {
        raf = requestAnimationFrame(tick)
        if (now - lastFrame < 42) return // ~24fps throttle
        lastFrame = now
        const elapsed = (now - start) / 1000
        const blobEl = blobFieldRef.current
        if (blobEl) {
          const t = elapsed * 0.12
          const wobble = (off: number) => Math.sin((t + off) * Math.PI * 2)
          const wobble2 = (off: number) => Math.cos((t + off) * Math.PI * 2)
          const s = blobEl.style
          s.setProperty('--b1x', `${Math.round(wobble(0) * 36)}px`)
          s.setProperty('--b1y', `${Math.round(wobble2(0.3) * 28)}px`)
          s.setProperty('--b2x', `${Math.round(wobble2(0.5) * -42)}px`)
          s.setProperty('--b2y', `${Math.round(wobble(0.8) * 32)}px`)
          s.setProperty('--b3x', `${Math.round(wobble(1.2) * 30)}px`)
          s.setProperty('--b3y', `${Math.round(wobble2(1.6) * -26)}px`)
        }
      }
      raf = requestAnimationFrame(tick)
    }

    return () => {
      mounted = false
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [reducedMotion])

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
          <div className="card glass" data-layer={2} style={{ padding: 18 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>resume.json validation failed</div>
            <div className="small" style={{ marginBottom: 12 }}>
              Fix the issues below. The site will not render until `resume.json` is valid.
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

  const name = fullName(resume)
  const person = resume.personalInfo.person
  const profileSrc = resolveLogoUri(person.picture, theme)
  const profileAlt = resolveLogoAlt(person.picture, 'Profile photo')
  const summary = resume.executiveSummary?.items ?? []
  const experience = resume.experience ?? []

  return (
    <div>
      {siteConfig.enableBlobBackground && (
        <div ref={blobFieldRef} className="blobField" aria-hidden="true">
          <div className="blob blobA" style={{ ['--bx' as any]: 'var(--b1x)', ['--by' as any]: 'var(--b1y)', ['--bs' as any]: 1.02 }} />
          <div className="blob blobB" style={{ ['--bx' as any]: 'var(--b2x)', ['--by' as any]: 'var(--b2y)', ['--bs' as any]: 1.06 }} />
          <div className="blob blobC" style={{ ['--bx' as any]: 'var(--b3x)', ['--by' as any]: 'var(--b3y)', ['--bs' as any]: 1.04 }} />
        </div>
      )}
      <main>
        <section style={{ padding: '72px 0 52px' }}>
          <div className="container">
            <div
              className="card glass"
              data-layer={2}
              style={{
                padding: 28,
                overflow: 'hidden',
                background:
                  'radial-gradient(900px 480px at 10% 20%, color-mix(in srgb, var(--brand) 42%, transparent), transparent 55%), radial-gradient(700px 420px at 90% -10%, color-mix(in srgb, var(--brand2) 26%, transparent), transparent 60%), rgba(255,255,255,0.04)',
              }}
            >
              <div className="grid2" style={{ alignItems: 'center' }}>
                <div ref={heroRef}>
                  <div className="pill" style={{ display: 'inline-flex', marginBottom: 14 }}>
                    <span className="small" style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>
                      Seattle, WA
                    </span>
                  </div>
                  <h1 style={{ margin: 0, fontSize: 'clamp(2.4rem, 4.2vw, 3.6rem)', lineHeight: 1.05 }}>
                    {name}
                  </h1>
                  <p className="muted" style={{ margin: '12px 0 18px', fontSize: '1.08rem', lineHeight: 1.55 }}>
                    {person.title ?? ''}
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Link className="btn btnPrimary" to="/standard">
                      View standard resume
                    </Link>
                    {person.email ? (
                      <a className="btn btnPrimary" href={`mailto:${person.email}`}>
                        Email
                      </a>
                    ) : null}
                    <ChatGptCta />
                  </div>
                </div>

                <div className="hero-photo-wrapper" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {profileSrc ? (
                    <div ref={profileParallaxRef}>
                      <img
                        src={profileSrc}
                        alt={profileAlt}
                        style={{
                          width: 240,
                          height: 240,
                          borderRadius: 26,
                          objectFit: 'cover',
                          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Executive Summary - contained */}
        <div className="container">
          <Section id="section-summary" eyebrow="Why" title="Executive strengths">
            <div className="grid2" style={{ gap: 24 }}>
              {summary.map((i, idx) => (
                <ExecStrengthCard key={i.title} item={i} index={idx} />
              ))}
            </div>
          </Section>
        </div>

        {/* IMMERSIVE EXPERIENCE - Full width, no constraints */}
        <section id="section-experience" className="experience-intro">
          <div className="container">
            <div className="pill" style={{ display: 'inline-flex', marginBottom: 16 }}>
              <span className="small" style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>
                Work
              </span>
            </div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)' }}>Experience</h2>
            <div className="revealLine" style={{ margin: '24px 0 36px' }} />
            <div className="muted" style={{ fontSize: '1.1rem', maxWidth: 600 }}>
              Scroll through my career journey. Each role alternates left and right for an immersive experience.
            </div>
          </div>
        </section>

        <div className="immersive-experience-wrapper">
          {experience.map((e, i) => (
            <TimelineItem 
              key={`${e.company.displayName}-${e.title}-${e.startDate.year}-${e.startDate.month}`} 
              exp={e}
              id={`job-${i}`}
              index={i}
            />
          ))}
        </div>

        {/* Skills - contained */}
        <div className="container">
          <Section id="section-skills" eyebrow="Skills" title="Tools & proficiencies">
            <SkillBars />

            {person.hobbies?.length ? (
              <div style={{ marginTop: 16 }} className="floaty-card">
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Outside work</div>
                <div className="muted" style={{ lineHeight: 1.6 }}>
                  {person.hobbies.join(' • ')}
                </div>
              </div>
            ) : null}
          </Section>
        </div>

        {/* Career metrics — D3 visualizations */}
        {siteConfig.showCareerMetrics && (
          <div className="container">
            <Section id="section-metrics" eyebrow="Impact" title="Career by the numbers">
              <CareerMetrics />
            </Section>
          </div>
        )}


        <div id="lets-talk" />
        <section className="marketing-section" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <div className="container">
            <div className="lets-talk-layout">
              <div className="lets-talk-orb-bg" aria-hidden="true">
                <div className="gradient-orb" />
              </div>
              <div className="lets-talk-content">
                <div className="pill" style={{ display: 'inline-flex', marginBottom: 14 }}>
                  <span className="small" style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>
                    Next
                  </span>
                </div>
                <h2 style={{ margin: '0 0 16px 0', fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>Let's talk</h2>
                <div className="floaty-card" style={{ marginTop: 24 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{name}</div>
                  <div className="muted" style={{ marginTop: 4 }}>{person.title}</div>
                  <div className="small" style={{ marginTop: 8, color: 'var(--muted2)' }}>
                    Seattle, WA
                  </div>
                  <div className="lets-talk-actions">
                    <Link className="btn" to="/standard">
                      Open standard resume
                    </Link>
                    {person.email ? (
                      <a className="btn btnPrimary" href={`mailto:${person.email}`}>
                        Email {person.email}
                      </a>
                    ) : null}
                    <div className="lets-talk-chatgpt">
                      <ChatGptCta variant="banner" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Terminal showcase — hidden for now
        <section className="terminal-section" style={{ padding: '40px 0 60px' }}>
          <div className="container">
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              <MacTerminal />
            </div>
          </div>
        </section>
        */}

        <footer style={{ padding: '30px 0 42px' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <div className="small" style={{ color: 'var(--muted2)' }}>Powered by <a href="/resume.json" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)', textDecoration: 'underline' }}>resume.json</a> • Built for Azure Static Websites</div>
          </div>
        </footer>
      </main>
    </div>
  )
}
