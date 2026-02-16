import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useTheme } from '../lib/useTheme'

/* ═══════════════════════════════════════════════════════════════════════════
   CAREER METRICS — D3-powered aggregate visualizations
   Two visuals:
     1. CareerTimeline – horizontal swimlane timeline with company eras
     2. HeroStats      – big animated counter tiles with micro-sparkline accents
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Types ──────────────────────────────────────────────────────────────────

type Signal = { cost: number; speed: number; adoption: number; trust: number; engineering: number }

export type CareerRole = {
  company: string
  title: string
  shortTitle: string
  startYear: number
  endYear: number
  signals: Signal
  peopleTouched: number
  teamSize: number
  logoUrl: string
  logoUrlLight?: string
  milestone?: string
}

export type AggregateStats = {
  agentsShipped: number
  engineersLed: number
  resourcesGoverned: number
  keysManaged: number
  ftesReassigned: number
  appsSecured: number
  costReductionRange: string
  assessmentWeeks: number
}

// ── Constants ──────────────────────────────────────────────────────────────

// ── Default data ─────────────────────────────────────────────────────────

export const DEFAULT_ROLES: CareerRole[] = [
  {
    company: 'VMC', title: 'Tier II Support Engineer', shortTitle: 'Tier II',
    startYear: 2009.75, endYear: 2010.42,  // Oct 2009 – May 2010
    signals: { cost: 0.7, speed: 0.65, adoption: 0.7, trust: 0.6, engineering: 0.55 },
    peopleTouched: 300, teamSize: 0,
    logoUrl: '/assets/dark-mode/volt-logo.svg',
    logoUrlLight: '/assets/light-mode/volt-logo.svg',
    milestone: '3,000 hrs/wk saved',
  },
  {
    company: 'Insight Global', title: 'Critical Incident Manager', shortTitle: 'CIM',
    startYear: 2010.42, endYear: 2011.25,  // May 2010 – Mar 2011
    signals: { cost: 0.6, speed: 0.75, adoption: 0.65, trust: 0.8, engineering: 0.55 },
    peopleTouched: 10_000_000, teamSize: 0,
    logoUrl: '/assets/dark-mode/insight-global.svg',
    logoUrlLight: '/assets/light-mode/insight-global.svg',
    milestone: '10M seats · 100% SLA',
  },
  {
    company: 'Dexian', title: 'Service Engineer', shortTitle: 'Svc Eng',
    startYear: 2011.25, endYear: 2013.75,  // Mar 2011 – Sep 2013
    signals: { cost: 0.7, speed: 0.7, adoption: 0.75, trust: 0.65, engineering: 0.7 },
    peopleTouched: 400, teamSize: 0,
    logoUrl: '/assets/dark-mode/dexian-dark-mode.webp',
    logoUrlLight: '/assets/light-mode/dexian-light-mode.webp',
    milestone: '400+ users',
  },
  {
    company: 'Microsoft', title: 'Software Engineer I', shortTitle: 'SWE I',
    startYear: 2013.75, endYear: 2015.0,   // Sep 2013 – Jan 2015
    signals: { cost: 0.6, speed: 0.85, adoption: 0.7, trust: 0.6, engineering: 0.8 },
    peopleTouched: 0, teamSize: 0,
    logoUrl: '/assets/invariant/microsoft.svg',
    milestone: '80% faster builds',
  },
  {
    company: 'Microsoft', title: 'Software Engineer II', shortTitle: 'SWE II',
    startYear: 2015.0, endYear: 2018.58,   // Jan 2015 – Jul 2018
    signals: { cost: 0.85, speed: 0.8, adoption: 0.75, trust: 0.65, engineering: 0.85 },
    peopleTouched: 2000, teamSize: 125,
    logoUrl: '/assets/invariant/microsoft.svg',
    milestone: '85/125 FTEs · 100s deploys/day',
  },
  {
    company: 'Accenture', title: 'Security Innovation Principal', shortTitle: 'Principal',
    startYear: 2018.58, endYear: 2021.83,  // Jul 2018 – Oct 2021
    signals: { cost: 0.7, speed: 0.75, adoption: 0.8, trust: 0.85, engineering: 0.8 },
    peopleTouched: 1000, teamSize: 8,
    logoUrl: '/assets/invariant/accenture-logo-bare.svg',
    milestone: '100M resources · 100K keys',
  },
  {
    company: 'Accenture', title: 'Sr. Principal', shortTitle: 'Sr. Principal',
    startYear: 2021.83, endYear: 2025.0,   // Oct 2021 – Jan 2025
    signals: { cost: 0.75, speed: 0.8, adoption: 0.8, trust: 0.7, engineering: 0.85 },
    peopleTouched: 1000, teamSize: 0,
    logoUrl: '/assets/invariant/accenture-logo-bare.svg',
    milestone: '1K-asset graph · 1000s trained',
  },
  {
    company: 'EY', title: 'AI Engineering Lead', shortTitle: 'AI Lead',
    startYear: 2025.0, endYear: 2026.17,   // Jan 2025 – Feb 2026 (current)
    signals: { cost: 0.95, speed: 0.9, adoption: 0.75, trust: 0.85, engineering: 0.95 },
    peopleTouched: 0, teamSize: 300,
    logoUrl: '/assets/dark-mode/ey-logo.svg',
    logoUrlLight: '/assets/light-mode/ey-logo.svg',
    milestone: '100 agents · 40-95% cost ↓',
  },
]

export const DEFAULT_STATS: AggregateStats = {
  agentsShipped: 100,
  engineersLed: 300,
  resourcesGoverned: 100,
  keysManaged: 100,
  ftesReassigned: 85,
  appsSecured: 5000,
  costReductionRange: '40-95',
  assessmentWeeks: 5,
}

// ══════════════════════════════════════════════════════════════════════════
// 1. CAREER TIMELINE — Gantt chart with thick interlocking bars
//    One bar per role; same-company roles share a vertical offset
// ══════════════════════════════════════════════════════════════════════════

function CareerTimeline({ roles, isDark }: { roles: CareerRole[]; isDark: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setIsVisible(true); obs.disconnect() } },
      { threshold: 0.15 },
    )
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  const xMin = Math.min(...roles.map(r => r.startYear))
  const xMax = Math.max(...roles.map(r => r.endYear))
  const span = xMax - xMin
  const pct = (year: number) => ((year - xMin) / span) * 100

  // Assign a company index to each role (same company = same index)
  const companyOrder: string[] = []
  for (const r of roles) {
    if (!companyOrder.includes(r.company)) companyOrder.push(r.company)
  }
  // Map each role to its company lane index
  const roleLane = roles.map(r => companyOrder.indexOf(r.company))

  // Colors per ROLE (not per company) so multi-role companies get distinct shades
  const roleColors = [
    { from: '#22d3ee', to: '#38bdf8' },   // VMC – Tier II
    { from: '#38bdf8', to: '#6366f1' },   // Insight Global – CIM
    { from: '#6366f1', to: '#8b5cf6' },   // Dexian – Svc Eng
    { from: '#818cf8', to: '#a855f7' },   // Microsoft – SWE I
    { from: '#a78bfa', to: '#c084fc' },   // Microsoft – SWE II (lighter purple)
    { from: '#d946ef', to: '#f0abfc' },   // Accenture – Principal
    { from: '#ec4899', to: '#ff2bd6' },   // Accenture – Sr. Principal (shifted pink)
    { from: '#ff2bd6', to: '#f43f5e' },   // EY – AI Lead
  ]

  // Year ticks every 2 years
  const ticks: number[] = []
  for (let y = Math.ceil(xMin); y <= Math.floor(xMax); y++) {
    if (y % 2 === 0) ticks.push(y)
  }

  // Interlocking by COMPANY lane (not per-role)
  // N = number of unique companies
  // step = chartH / (N + 1), barH = 2 * step, min barH = 30
  const N = companyOrder.length
  const MIN_BAR_H = 30
  const DESIRED_H = 280
  const rawStep = Math.max(MIN_BAR_H / 2, DESIRED_H / (N + 1))
  const barH = Math.max(MIN_BAR_H, 2 * rawStep)
  const stepPx = barH / 2
  const CHART_H = stepPx * (N + 1) // total height to fit all bars

  return (
    <div
      ref={containerRef}
      className={`career-timeline ${isVisible ? 'career-timeline--visible' : ''}`}
    >
      {/* Bar zone */}
      <div className="ct-gantt" style={{ height: `${CHART_H}px` }}>
        {/* Gridlines */}
        {ticks.map(y => (
          <div key={y} className="ct-gridline" style={{ left: `${pct(y)}%` }} />
        ))}

        {/* One bar per role — same company shares vertical offset */}
        {roles.map((role, i) => {
          const lane = roleLane[i]
          const colors = roleColors[i % roleColors.length]
          const logoSrc = (!isDark && role.logoUrlLight) ? role.logoUrlLight : role.logoUrl
          const left = pct(role.startYear)
          const width = pct(role.endYear) - left
          const top = lane * stepPx

          return (
            <div
              key={`${role.shortTitle}-${role.startYear}`}
              className="ct-bar-group"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                top: `${top}px`,
                height: `${barH}px`,
                zIndex: lane + 1,
                animationDelay: `${0.1 + i * 0.07}s`,
              }}
            >
              {/* Logo */}
              <div className="ct-bar-logo">
                <img src={logoSrc} alt={role.company} />
              </div>

              {/* The thick bar */}
              <div
                className="ct-bar"
                style={{
                  background: `linear-gradient(180deg, ${colors.from}, ${colors.to})`,
                }}
              />

              {/* Label below */}
              <div className="ct-bar-label">
                <span className="ct-bar-title">{role.shortTitle}</span>
                {role.milestone && (
                  <span className="ct-bar-ms">{role.milestone}</span>
                )}
              </div>
            </div>
          )
        })}

        {/* NOW flag at the right edge */}
        <div
          className="ct-now-flag"
          style={{
            left: `${pct(xMax)}%`,
            zIndex: N + 2,
          }}
        >
          <span className="ct-now-label">Now</span>
          <div className="ct-now-line" />
        </div>
      </div>

      {/* Year axis */}
      <div className="ct-axis">
        {ticks.map(y => (
          <span key={y} className="ct-axis-tick" style={{ left: `${pct(y)}%` }}>
            '{String(y).slice(2)}
          </span>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 2. HERO STATS — big animated counters with micro-sparklines
// ══════════════════════════════════════════════════════════════════════════

function AnimatedCounter({ target, suffix, delay }: { target: number; suffix: string; delay: number }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect() } }, { threshold: 0.5 })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const timeout = setTimeout(() => {
      const duration = 2000
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1)
        const eased = t < 1 ? 1 - Math.pow(2, -10 * t) : 1
        setValue(Math.round(target * eased))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(timeout)
  }, [started, target, delay])

  return (
    <div ref={ref} className="hero-stat-number">
      {value.toLocaleString()}{suffix}
    </div>
  )
}

function MicroSparkline({ data, color }: { data: number[]; color: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const idRef = useRef(`spark-${Math.random().toString(36).slice(2, 8)}`)

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const w = 80, h = 28
    svg.attr('viewBox', `0 0 ${w} ${h}`)

    const xScale = d3.scaleLinear().domain([0, data.length - 1]).range([2, w - 2])
    const yScale = d3.scaleLinear().domain([0, d3.max(data)!]).range([h - 2, 2])

    const lineFn = d3.line<number>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d))
      .curve(d3.curveMonotoneX)

    const areaFn = d3.area<number>()
      .x((_, i) => xScale(i))
      .y0(h)
      .y1(d => yScale(d))
      .curve(d3.curveMonotoneX)

    const localDefs = svg.append('defs')
    const grad = localDefs.append('linearGradient').attr('id', idRef.current)
      .attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1')
    grad.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.3)
    grad.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0)

    svg.append('path').datum(data).attr('d', areaFn).attr('fill', `url(#${idRef.current})`)
    svg.append('path').datum(data).attr('d', lineFn).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1.5)

    svg.append('circle')
      .attr('cx', xScale(data.length - 1))
      .attr('cy', yScale(data[data.length - 1]))
      .attr('r', 2.5)
      .attr('fill', color)
  }, [data, color])

  return <svg ref={svgRef} className="micro-sparkline" />
}

// ── Hero Tachometer Tile — D3 gauge pegged near the limit ───────────────

function HeroTacho({ value, suffix, label, color, index }: {
  value: number; suffix: string; label: string; color: string; index: number
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [started, setStarted] = useState(false)
  const tileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tileRef.current) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect() } }, { threshold: 0.5 })
    obs.observe(tileRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!svgRef.current || !started) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const size = 100, strokeW = 8
    const radius = (size - strokeW * 2) / 2
    const cx = size / 2, cy = size / 2 + 8

    svg.attr('viewBox', `0 0 ${size} ${size}`)

    const defs = svg.append('defs')
    // Multi-color gradient like SpeedoGauge
    const grad = defs.append('linearGradient').attr('id', `ht-${index}`)
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%')
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#22d3ee')
    grad.append('stop').attr('offset', '40%').attr('stop-color', '#10b981')
    grad.append('stop').attr('offset', '70%').attr('stop-color', '#f59e0b')
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#ef4444')

    const glow = defs.append('filter').attr('id', `ht-glow-${index}`)
      .attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%')
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')
    const merge = glow.append('feMerge')
    merge.append('feMergeNode').attr('in', 'blur')
    merge.append('feMergeNode').attr('in', 'SourceGraphic')

    const startAngle = -Math.PI * 0.75
    const totalSweep = Math.PI * 1.5
    const percent = 0.92 // pegged near max

    // Full background arc with gradient at low opacity (like speedo)
    const bgArc = d3.arc<any>().innerRadius(radius - strokeW / 2).outerRadius(radius + strokeW / 2)
      .startAngle(startAngle).endAngle(startAngle + totalSweep).cornerRadius(strokeW / 2)
    svg.append('path').attr('d', bgArc({}) as string).attr('transform', `translate(${cx},${cy})`)
      .attr('fill', `url(#ht-${index})`).attr('opacity', 0.2)

    // Colored fill arc up to needle position
    const fillArc = d3.arc<any>().innerRadius(radius - strokeW / 2).outerRadius(radius + strokeW / 2)
      .startAngle(startAngle).cornerRadius(strokeW / 2)
    const targetEnd = startAngle + totalSweep * percent

    const fillPath = svg.append('path').attr('transform', `translate(${cx},${cy})`)
      .attr('fill', `url(#ht-${index})`).attr('filter', `url(#ht-glow-${index})`)
      .attr('d', fillArc({ endAngle: startAngle }) as string)

    fillPath.transition().delay(index * 150 + 300).duration(1800).ease(d3.easeCubicOut)
      .attrTween('d', () => {
        const interp = d3.interpolate(startAngle, targetEnd)
        return (t: number) => fillArc({ endAngle: interp(t) }) as string
      })

    // Tick marks
    ;[0, 25, 50, 75, 100].forEach(t => {
      const angle = startAngle + (t / 100) * totalSweep - Math.PI / 2
      const r1 = radius + strokeW / 2 + 2, r2 = r1 + 4
      svg.append('line')
        .attr('x1', cx + Math.cos(angle) * r1).attr('y1', cy + Math.sin(angle) * r1)
        .attr('x2', cx + Math.cos(angle) * r2).attr('y2', cy + Math.sin(angle) * r2)
        .attr('stroke', 'rgba(255,255,255,0.2)').attr('stroke-width', 1)
    })

    // Needle
    const needleLen = radius - 6
    const needleAngle = targetEnd - Math.PI / 2
    const needle = svg.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('x2', cx).attr('y2', cy)
      .attr('stroke', '#fff').attr('stroke-width', 2).attr('stroke-linecap', 'round')
      .attr('opacity', 0)

    needle.transition().delay(index * 150 + 300).duration(1800).ease(d3.easeCubicOut)
      .attr('x2', cx + Math.cos(needleAngle) * needleLen)
      .attr('y2', cy + Math.sin(needleAngle) * needleLen)
      .attr('opacity', 0.9)

    // Center hub
    svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 4)
      .attr('fill', 'rgba(255,255,255,0.8)')

    // Randomized revving — noise seeds for organic feel
    const seedA = 230 + index * 71 + (value % 50) * 3
    const seedB = 140 + index * 59 + (value % 30) * 5
    const jitterAmp = totalSweep * (0.020 + (index % 4) * 0.004)
    let revInterval: ReturnType<typeof setInterval>
    function revTick() {
      const t = Date.now()
      const jitter = Math.sin(t / seedA) * jitterAmp * (0.6 + 0.4 * Math.sin(t / seedB))
        + Math.sin(t / 181) * jitterAmp * 0.2
      const curEnd = targetEnd + jitter
      const curAngle = curEnd - Math.PI / 2
      fillPath.attr('d', fillArc({ endAngle: curEnd }) as string)
      needle.attr('x2', cx + Math.cos(curAngle) * needleLen).attr('y2', cy + Math.sin(curAngle) * needleLen)
    }
    const revTimer = setTimeout(() => { revInterval = setInterval(revTick, 66) }, index * 150 + 300 + 1800)
    return () => { clearTimeout(revTimer); clearInterval(revInterval) }
  }, [started, value, suffix, color, index])

  return (
    <div ref={tileRef} className="hero-stat-tile hero-stat-tile--tacho">
      <div className="hero-stat-tile-inner">
        <svg ref={svgRef} className="hero-tacho-svg" width="100" height="100" />
        <div className="hero-stat-number">
          {value.toLocaleString()}{suffix}
        </div>
        <div className="hero-stat-label">{label}</div>
      </div>
    </div>
  )
}

// ── Hero Icon Tile — stat with SVG icon ──────────────────────────────────

const HERO_ICONS: Record<string, string> = {
  lightbulb: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 0 1 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z',
  robot: 'M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zM16 17H8v-2h8v2zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z',
}

function HeroIconTile({ value, suffix, label, icon, color, delay }: {
  value: number; suffix: string; label: string; icon: string; color: string; delay: number
}) {
  const [displayVal, setDisplayVal] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect() } }, { threshold: 0.5 })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const timeout = setTimeout(() => {
      const duration = 2000
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1)
        const eased = t < 1 ? 1 - Math.pow(2, -10 * t) : 1
        setDisplayVal(Math.round(value * eased))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(timeout)
  }, [started, value, delay])

  const iconPath = HERO_ICONS[icon] || HERO_ICONS.lightbulb

  return (
    <div ref={ref} className="hero-stat-tile hero-stat-tile--icon">
      <div className="hero-stat-tile-inner">
        <div className="hero-icon-row">
          <svg viewBox="0 0 24 24" className="hero-tile-icon" style={{ color }}>
            <path d={iconPath} fill="currentColor" />
          </svg>
          <div className="hero-icon-text">
            <div className="hero-stat-number">
              {displayVal.toLocaleString()}{suffix}
            </div>
            <div className="hero-stat-label">{label}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Hero Before/After Tile — cross-out style ─────────────────────────────

function HeroBeforeAfterTile({ beforeText, afterText, label, color, delay }: {
  beforeText: string; afterText: string; label: string; color: string; delay: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect() } }, { threshold: 0.5 })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className={`hero-stat-tile hero-stat-tile--before-after ${started ? 'hero-stat-tile--revealed' : ''}`}>
      <div className="hero-stat-tile-inner">
        <div className="hero-ba-row" style={{ transitionDelay: `${delay}ms` }}>
          <span className="hero-ba-before" style={{ textDecorationColor: color }}>{beforeText}</span>
          <span className="hero-ba-arrow">→</span>
          <span className="hero-ba-after">{afterText}</span>
        </div>
        <div className="hero-stat-label">{label}</div>
      </div>
    </div>
  )
}

// ── Range Gauge Tile — for 40-95% style ranges ──────────────────────────

function HeroRangeGaugeTile({ rangeStr, label, color, index }: {
  rangeStr: string; label: string; color: string; index: number
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tileRef = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)

  const match = rangeStr.match(/(\d+)\s*[-–]\s*(\d+)/)
  const lo = match ? parseInt(match[1]) : 0
  const hi = match ? parseInt(match[2]) : 0

  useEffect(() => {
    if (!tileRef.current) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect() } }, { threshold: 0.5 })
    obs.observe(tileRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!svgRef.current || !started) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const size = 80, strokeW = 7
    const radius = (size - strokeW * 2) / 2
    const cx = size / 2, cy = size / 2 + 6

    svg.attr('viewBox', `0 0 ${size} ${size}`)

    const defs = svg.append('defs')
    const grad = defs.append('linearGradient').attr('id', `hrg-${index}`)
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%')
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#8b5cf6')
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#ff2bd6')

    const glow = defs.append('filter').attr('id', `hrg-glow-${index}`)
      .attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%')
    glow.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'blur')
    const merge = glow.append('feMerge')
    merge.append('feMergeNode').attr('in', 'blur')
    merge.append('feMergeNode').attr('in', 'SourceGraphic')

    const startAngle = -Math.PI * 0.75
    const totalSweep = Math.PI * 1.5

    // Background
    const bgArc = d3.arc<any>().innerRadius(radius - strokeW / 2).outerRadius(radius + strokeW / 2)
      .startAngle(startAngle).endAngle(startAngle + totalSweep).cornerRadius(strokeW / 2)
    svg.append('path').attr('d', bgArc({}) as string).attr('transform', `translate(${cx},${cy})`)
      .attr('fill', 'rgba(255,255,255,0.06)')

    // Range band
    const loAngle = startAngle + (lo / 100) * totalSweep
    const hiAngle = startAngle + (hi / 100) * totalSweep
    const rangeArc = d3.arc<any>().innerRadius(radius - strokeW / 2).outerRadius(radius + strokeW / 2).cornerRadius(strokeW / 2)

    const rangePath = svg.append('path').attr('transform', `translate(${cx},${cy})`)
      .attr('fill', `url(#hrg-${index})`).attr('filter', `url(#hrg-glow-${index})`)
      .attr('d', rangeArc({ startAngle: loAngle, endAngle: loAngle }) as string)

    rangePath.transition().delay(index * 150 + 300).duration(1200).ease(d3.easeCubicOut)
      .attrTween('d', () => {
        const interp = d3.interpolate(loAngle, hiAngle)
        return (t: number) => rangeArc({ startAngle: loAngle, endAngle: interp(t) }) as string
      })

    // Center text
    svg.append('text').attr('x', cx).attr('y', cy).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('fill', 'rgba(255,255,255,0.9)').attr('font-size', '12px').attr('font-weight', 900)
      .text(`${lo}–${hi}%`)

    // Randomized revving — noise seeds for organic feel
    const seedA = 260 + index * 79 + (lo * 3) % 100
    const seedB = 170 + index * 47 + (hi * 5) % 90
    const jitterAmp = totalSweep * (0.012 + (index % 3) * 0.003)
    let revInterval: ReturnType<typeof setInterval>
    function revTick() {
      const t = Date.now()
      const jitter = Math.sin(t / seedA) * jitterAmp * (0.5 + 0.5 * Math.sin(t / seedB))
        + Math.sin(t / 157) * jitterAmp * 0.3
      rangePath.attr('d', rangeArc({ startAngle: loAngle + jitter * 0.3, endAngle: hiAngle + jitter }) as string)
    }
    const revTimer = setTimeout(() => { revInterval = setInterval(revTick, 66) }, index * 150 + 300 + 1200)
    return () => { clearTimeout(revTimer); clearInterval(revInterval) }
  }, [started, lo, hi, color, index])

  return (
    <div ref={tileRef} className="hero-stat-tile hero-stat-tile--tacho">
      <div className="hero-stat-tile-inner">
        <svg ref={svgRef} className="hero-tacho-svg" width="80" height="80" />
        <div className="hero-stat-label">{label}</div>
      </div>
    </div>
  )
}

function HeroStats({ stats }: { stats: AggregateStats }) {
  return (
    <div className="hero-stats-grid">
      {/* 1. AI Agents shipped — robot icon */}
      <HeroIconTile
        value={stats.agentsShipped} suffix="" label="AI Agents shipped"
        icon="robot" color="#22d3ee" delay={300}
      />
      {/* 2. Engineers led — lightbulb icon */}
      <HeroIconTile
        value={stats.engineersLed} suffix="" label="Engineers led"
        icon="lightbulb" color="#8b5cf6" delay={500}
      />
      {/* 3. Azure resources governed — tachometer pegged high */}
      <HeroTacho
        value={stats.resourcesGoverned} suffix="M" label="Azure resources governed"
        color="#ff2bd6" index={2}
      />
      {/* 4. Crypto keys managed — sparkline (classic) */}
      <div className="hero-stat-tile">
        <div className="hero-stat-tile-inner">
          <MicroSparkline data={[0, 0, 0, 0, 0, 5, 30, 60, 100]} color="#10b981" />
          <AnimatedCounter target={stats.keysManaged} suffix="K" delay={900} />
          <div className="hero-stat-label">Crypto keys managed</div>
        </div>
      </div>
      {/* 5. FTEs reassigned — sparkline (classic) */}
      <div className="hero-stat-tile">
        <div className="hero-stat-tile-inner">
          <MicroSparkline data={[0, 0, 0, 0, 10, 30, 50, 70, 85]} color="#f59e0b" />
          <AnimatedCounter target={stats.ftesReassigned} suffix="" delay={1100} />
          <div className="hero-stat-label">FTEs reassigned</div>
        </div>
      </div>
      {/* 6. Apps under HSM — tachometer pegged high */}
      <HeroTacho
        value={stats.appsSecured} suffix="" label="Apps under HSM"
        color="#ef4444" index={5}
      />
      {/* 7. 40-95% cost reduction — range gauge */}
      <HeroRangeGaugeTile
        rangeStr={stats.costReductionRange} label="Cost reduction"
        color="#3b82f6" index={6}
      />
      {/* 8. 6mo→5wk assessments — before/after cross-out */}
      <HeroBeforeAfterTile
        beforeText="6 mo" afterText="5 wks" label="Assessment timeline"
        color="#14b8a6" delay={1500}
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════

export default function CareerMetrics({
  roles = DEFAULT_ROLES,
  stats = DEFAULT_STATS,
}: {
  roles?: CareerRole[]
  stats?: AggregateStats
}) {
  const { theme } = useTheme()
  const isDark = theme !== 'light'

  return (
    <div className="career-metrics">
      <HeroStats stats={stats} />
      <div className="career-metrics-visuals">
        <div className="career-metrics-visual-card career-metrics-visual-card--full">
          <CareerTimeline roles={roles} isDark={isDark} />
        </div>
      </div>
    </div>
  )
}
