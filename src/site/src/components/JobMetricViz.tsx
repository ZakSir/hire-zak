import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useTheme } from '../lib/useTheme'

/* ═══════════════════════════════════════════════════════════════════════════
   JOB METRIC VIZ — per-job metric cards with mixed viz types
   
   Each metric carries a `viz` hint that determines rendering:
     • sparkline       – value card with exponential sparkline graphic
     • text            – simple text stat card (value + label)
     • text-icon       – text card with an SVG icon
     • range-gauge     – tachometer-style gauge showing a range (e.g. 40-95%)
     • tacho           – single-value tachometer gauge
     • speedo          – speedometer with needle pegged high
     • before-after    – two numbers side by side with arrow
     • dual-sparkline  – two overlapping sparklines
   ═══════════════════════════════════════════════════════════════════════════ */

export type MetricInput = {
  value: string
  label: string
  unit?: string
  context?: string
  viz?: string
  icon?: string
  before?: string
  after?: string
  sparkData?: number[]
  sparkData2?: number[]
}

// ── Sparkline Card ─────────────────────────────────────────────────────

function SparklineCard({ metric, index }: { metric: MetricInput; index: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const idRef = useRef(`jmv-spark-${Math.random().toString(36).slice(2, 8)}`)
  const data = metric.sparkData ?? [1, 2, 3, 5, 8, 13, 21, 40, 80, 150]

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const w = 120, h = 36
    svg.attr('viewBox', `0 0 ${w} ${h}`)

    const xS = d3.scaleLinear().domain([0, data.length - 1]).range([2, w - 2])
    const yS = d3.scaleLinear().domain([0, d3.max(data)!]).range([h - 2, 2])

    const lineFn = d3.line<number>().x((_, i) => xS(i)).y(d => yS(d)).curve(d3.curveMonotoneX)
    const areaFn = d3.area<number>().x((_, i) => xS(i)).y0(h).y1(d => yS(d)).curve(d3.curveMonotoneX)

    const defs = svg.append('defs')
    const grad = defs.append('linearGradient').attr('id', idRef.current)
      .attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1')
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#22d3ee').attr('stop-opacity', 0.3)
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#22d3ee').attr('stop-opacity', 0)

    // Clip for reveal
    const clip = defs.append('clipPath').attr('id', `${idRef.current}-clip`)
    const clipRect = clip.append('rect').attr('x', 0).attr('y', 0).attr('width', 0).attr('height', h)

    const g = svg.append('g').attr('clip-path', `url(#${idRef.current}-clip)`)
    g.append('path').datum(data).attr('d', areaFn).attr('fill', `url(#${idRef.current})`)
    g.append('path').datum(data).attr('d', lineFn).attr('fill', 'none').attr('stroke', '#22d3ee').attr('stroke-width', 1.5)
    g.append('circle').attr('cx', xS(data.length - 1)).attr('cy', yS(data[data.length - 1])).attr('r', 2.5).attr('fill', '#22d3ee')

    clipRect.transition().delay(index * 100 + 200).duration(1200).ease(d3.easeCubicOut).attr('width', w)
  }, [data, index])

  return (
    <div className="jmv-card jmv-sparkline-card">
      <div className="jmv-card-value">{metric.value}{metric.unit && metric.unit !== '%' ? metric.unit : ''}</div>
      <svg ref={svgRef} className="jmv-sparkline-svg" />
      <div className="jmv-card-label">{metric.label}</div>
    </div>
  )
}

// ── Dual Sparkline Card ────────────────────────────────────────────────

function DualSparklineCard({ metric, index }: { metric: MetricInput; index: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const idRef = useRef(`jmv-dual-${Math.random().toString(36).slice(2, 8)}`)
  const data1 = metric.sparkData ?? [0, 1, 2, 5, 10, 30, 60, 80, 100]
  const data2 = metric.sparkData2 ?? [0, 0, 1, 2, 3, 5, 8, 9, 10]

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const w = 120, h = 36
    svg.attr('viewBox', `0 0 ${w} ${h}`)

    const maxVal = Math.max(d3.max(data1)!, d3.max(data2)!)
    const xS = d3.scaleLinear().domain([0, Math.max(data1.length, data2.length) - 1]).range([2, w - 2])
    const yS = d3.scaleLinear().domain([0, maxVal]).range([h - 2, 2])

    const lineFn = d3.line<number>().x((_, i) => xS(i)).y(d => yS(d)).curve(d3.curveMonotoneX)

    const defs = svg.append('defs')
    const clip = defs.append('clipPath').attr('id', `${idRef.current}-clip`)
    const clipRect = clip.append('rect').attr('x', 0).attr('y', 0).attr('width', 0).attr('height', h)

    const g = svg.append('g').attr('clip-path', `url(#${idRef.current}-clip)`)

    // First sparkline (larger — cyan)
    g.append('path').datum(data1).attr('d', lineFn).attr('fill', 'none').attr('stroke', '#22d3ee').attr('stroke-width', 1.5).attr('opacity', 0.9)
    // Second sparkline (smaller — purple)
    g.append('path').datum(data2).attr('d', lineFn).attr('fill', 'none').attr('stroke', '#8b5cf6').attr('stroke-width', 1.5).attr('opacity', 0.9)

    g.append('circle').attr('cx', xS(data1.length - 1)).attr('cy', yS(data1[data1.length - 1])).attr('r', 2).attr('fill', '#22d3ee')
    g.append('circle').attr('cx', xS(data2.length - 1)).attr('cy', yS(data2[data2.length - 1])).attr('r', 2).attr('fill', '#8b5cf6')

    clipRect.transition().delay(index * 100 + 200).duration(1200).ease(d3.easeCubicOut).attr('width', w)
  }, [data1, data2, index])

  return (
    <div className="jmv-card jmv-sparkline-card">
      <div className="jmv-card-value">{metric.value}{metric.unit && metric.unit !== '%' ? metric.unit : ''}</div>
      <svg ref={svgRef} className="jmv-sparkline-svg" />
      <div className="jmv-card-label">{metric.label}</div>
    </div>
  )
}

// ── Text Card ──────────────────────────────────────────────────────────

function TextCard({ metric }: { metric: MetricInput }) {
  return (
    <div className="jmv-card jmv-text-card">
      <div className="jmv-card-value">{metric.value}{metric.unit || ''}</div>
      <div className="jmv-card-label">{metric.label}</div>
      {metric.context && <div className="jmv-card-context">{metric.context}</div>}
    </div>
  )
}

// ── Text Card with Icon ────────────────────────────────────────────────

const ICONS: Record<string, string> = {
  graph: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-8h2v8zm-8 0H5v-4h2v4z',
  key: 'M12.65 10A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
  lock: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
  rocket: 'M9.19 6.35c-2.04 2.29-3.44 5.58-3.57 5.89L2 10.69l4.05-4.05c.47-.47 1.15-.68 1.81-.55l1.33.26zM11.17 17s3.74-1.55 5.89-3.7c5.4-5.4 4.5-9.62 4.21-10.57-.95-.29-5.17-1.19-10.57 4.21C8.55 9.09 7 12.83 7 12.83L11.17 17zM14.65 21.38l-1.55-3.62c.31-.13 3.6-1.53 5.89-3.57l.26 1.33c.13.66-.08 1.34-.55 1.81l-4.05 4.05zM14.5 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
  rss: 'M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z',
  shield: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z',
  docs: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  people: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z',
  bolt: 'M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z',
}

function TextIconCard({ metric }: { metric: MetricInput }) {
  const iconPath = ICONS[metric.icon || 'graph'] || ICONS.graph
  return (
    <div className="jmv-card jmv-text-icon-card">
      <svg viewBox="0 0 24 24" className="jmv-icon">
        <path d={iconPath} fill="currentColor" />
      </svg>
      <div>
        <div className="jmv-card-value">{metric.value}{metric.unit || ''}</div>
        <div className="jmv-card-label">{metric.label}</div>
      </div>
    </div>
  )
}

// ── Before/After Card ──────────────────────────────────────────────────

function BeforeAfterCard({ metric }: { metric: MetricInput }) {
  return (
    <div className="jmv-card jmv-before-after-card">
      <div className="jmv-ba-row">
        <div className="jmv-ba-side jmv-ba-before">
          <div className="jmv-ba-label">Before</div>
          <div className="jmv-ba-value">{metric.before || '?'}</div>
        </div>
        <div className="jmv-ba-arrow">→</div>
        <div className="jmv-ba-side jmv-ba-after">
          <div className="jmv-ba-label">After</div>
          <div className="jmv-ba-value">{metric.after || '?'}</div>
        </div>
      </div>
      <div className="jmv-card-label">{metric.label}</div>
    </div>
  )
}

// ── Range Gauge (tachometer for ranges like 40-95%) ────────────────────

function RangeGauge({ metric, index }: { metric: MetricInput; index: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const parsed = parseRange(metric.value)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const size = 100, strokeW = 8
    const radius = (size - strokeW * 2) / 2
    const cx = size / 2, cy = size / 2 + 8

    svg.attr('viewBox', `0 0 ${size} ${size}`)

    const defs = svg.append('defs')
    const grad = defs.append('linearGradient').attr('id', `rg-${index}`)
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%')
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#8b5cf6')
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#ff2bd6')

    const glow = defs.append('filter').attr('id', `rg-glow-${index}`)
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
    svg.append('path').attr('d', bgArc({}) as string).attr('transform', `translate(${cx},${cy})`).attr('fill', isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)')

    // Range band
    const loAngle = startAngle + (parsed.lo / 100) * totalSweep
    const hiAngle = startAngle + (parsed.hi / 100) * totalSweep
    const rangeArc = d3.arc<any>().innerRadius(radius - strokeW / 2).outerRadius(radius + strokeW / 2).cornerRadius(strokeW / 2)

    const rangePath = svg.append('path').attr('transform', `translate(${cx},${cy})`)
      .attr('fill', `url(#rg-${index})`).attr('filter', `url(#rg-glow-${index})`)
      .attr('d', rangeArc({ startAngle: loAngle, endAngle: loAngle }) as string)

    rangePath.transition().delay(index * 120 + 200).duration(1200).ease(d3.easeCubicOut)
      .attrTween('d', () => {
        const interp = d3.interpolate(loAngle, hiAngle)
        return (t: number) => rangeArc({ startAngle: loAngle, endAngle: interp(t) }) as string
      })

    // Center text
    svg.append('text').attr('x', cx).attr('y', cy - 2).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('fill', isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)').attr('font-size', '13px').attr('font-weight', 900)
      .text(`${parsed.lo}–${parsed.hi}%`)

    // Subtle revving oscillation at low framerate (~15fps)
    const jitterAmp = totalSweep * 0.018
    let revInterval: ReturnType<typeof setInterval>
    function revTick() {
      const jitter = Math.sin(Date.now() / 320) * jitterAmp * (0.5 + 0.5 * Math.sin(Date.now() / 210))
      rangePath.attr('d', rangeArc({ startAngle: loAngle + jitter * 0.3, endAngle: hiAngle + jitter }) as string)
    }
    const revTimer = setTimeout(() => { revInterval = setInterval(revTick, 66) }, index * 120 + 200 + 1200)
    return () => { clearTimeout(revTimer); clearInterval(revInterval) }
  }, [parsed, index, isDark])

  return (
    <div className="jmv-card jmv-gauge-card">
      <svg ref={svgRef} className="jmv-gauge-svg" />
      <div className="jmv-card-label">{metric.label}</div>
    </div>
  )
}

// ── Tachometer Gauge (single percentage) ───────────────────────────────

function TachoGauge({ metric, index }: { metric: MetricInput; index: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const value = parseInt(metric.value) || 0
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const size = 100, strokeW = 8
    const radius = (size - strokeW * 2) / 2
    const cx = size / 2, cy = size / 2 + 8

    svg.attr('viewBox', `0 0 ${size} ${size}`)

    const defs = svg.append('defs')
    const grad = defs.append('linearGradient').attr('id', `tg-${index}`)
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%')
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#22d3ee')
    grad.append('stop').attr('offset', '50%').attr('stop-color', '#8b5cf6')
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#ff2bd6')

    const glow = defs.append('filter').attr('id', `tg-glow-${index}`)
      .attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%')
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')
    const merge = glow.append('feMerge')
    merge.append('feMergeNode').attr('in', 'blur')
    merge.append('feMergeNode').attr('in', 'SourceGraphic')

    const startAngle = -Math.PI * 0.75
    const totalSweep = Math.PI * 1.5

    // Background
    const bgArc = d3.arc<any>().innerRadius(radius - strokeW / 2).outerRadius(radius + strokeW / 2)
      .startAngle(startAngle).endAngle(startAngle + totalSweep).cornerRadius(strokeW / 2)
    svg.append('path').attr('d', bgArc({}) as string).attr('transform', `translate(${cx},${cy})`).attr('fill', isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)')

    // Tick marks
    ;[0, 25, 50, 75, 100].forEach(t => {
      const angle = startAngle + (t / 100) * totalSweep - Math.PI / 2
      const r1 = radius + strokeW / 2 + 2, r2 = r1 + 4
      svg.append('line')
        .attr('x1', cx + Math.cos(angle) * r1).attr('y1', cy + Math.sin(angle) * r1)
        .attr('x2', cx + Math.cos(angle) * r2).attr('y2', cy + Math.sin(angle) * r2)
        .attr('stroke', isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)').attr('stroke-width', 1)
    })

    const percent = Math.min(value / 100, 1)
    const targetEnd = startAngle + totalSweep * percent
    const fgArc = d3.arc<any>().innerRadius(radius - strokeW / 2).outerRadius(radius + strokeW / 2)
      .startAngle(startAngle).cornerRadius(strokeW / 2)

    const path = svg.append('path').attr('transform', `translate(${cx},${cy})`)
      .attr('fill', `url(#tg-${index})`).attr('filter', `url(#tg-glow-${index})`)
      .attr('d', fgArc({ endAngle: startAngle }) as string)

    path.transition().delay(index * 120 + 200).duration(1400)
      .ease(d3.easeElasticOut.amplitude(0.8).period(0.45))
      .attrTween('d', () => {
        const interp = d3.interpolate(startAngle, targetEnd)
        return (t: number) => fgArc({ endAngle: interp(t) }) as string
      })

    // Needle dot
    const dotAngle = targetEnd - Math.PI / 2
    svg.append('circle')
      .attr('cx', cx + Math.cos(startAngle - Math.PI / 2) * radius)
      .attr('cy', cy + Math.sin(startAngle - Math.PI / 2) * radius)
      .attr('r', 4).attr('fill', '#ff2bd6').attr('opacity', 0)
      .transition().delay(index * 120 + 200).duration(1400)
      .ease(d3.easeElasticOut.amplitude(0.8).period(0.45))
      .attr('cx', cx + Math.cos(dotAngle) * radius).attr('cy', cy + Math.sin(dotAngle) * radius).attr('opacity', 1)

    svg.append('text').attr('x', cx).attr('y', cy + 2).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('fill', isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)').attr('font-size', '16px').attr('font-weight', 900).text(`${value}%`)

    // Subtle revving oscillation at low framerate — skip for 100% (perfect scores shouldn't jitter)
    if (value >= 100) return
    const dot = svg.select<SVGCircleElement>('circle')
    const jitterAmp = totalSweep * 0.02
    let revInterval: ReturnType<typeof setInterval>
    function revTick() {
      const jitter = Math.sin(Date.now() / 280) * jitterAmp * (0.5 + 0.5 * Math.sin(Date.now() / 190))
      const curEnd = targetEnd + jitter
      const curDotAngle = curEnd - Math.PI / 2
      path.attr('d', fgArc({ endAngle: curEnd }) as string)
      dot.attr('cx', cx + Math.cos(curDotAngle) * radius).attr('cy', cy + Math.sin(curDotAngle) * radius)
    }
    const revTimer = setTimeout(() => { revInterval = setInterval(revTick, 66) }, index * 120 + 200 + 1400)
    return () => { clearTimeout(revTimer); clearInterval(revInterval) }
  }, [value, index, isDark])

  return (
    <div className="jmv-card jmv-gauge-card">
      <svg ref={svgRef} className="jmv-gauge-svg" />
      <div className="jmv-card-label">{metric.label}</div>
    </div>
  )
}

// ── Speedometer (needle pegged high — for "100s /day" type metrics) ────

function SpeedoGauge({ metric, index }: { metric: MetricInput; index: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  // Position as 0-1 (0.85 = pegged high)
  const position = 0.88
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const size = 100, strokeW = 8
    const radius = (size - strokeW * 2) / 2
    const cx = size / 2, cy = size / 2 + 8

    svg.attr('viewBox', `0 0 ${size} ${size}`)

    const defs = svg.append('defs')
    // Green-to-red gradient for speedo
    const grad = defs.append('linearGradient').attr('id', `spd-${index}`)
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%')
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#22d3ee')
    grad.append('stop').attr('offset', '40%').attr('stop-color', '#10b981')
    grad.append('stop').attr('offset', '70%').attr('stop-color', '#f59e0b')
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#ef4444')

    const glow = defs.append('filter').attr('id', `spd-glow-${index}`)
      .attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%')
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')
    const merge = glow.append('feMerge')
    merge.append('feMergeNode').attr('in', 'blur')
    merge.append('feMergeNode').attr('in', 'SourceGraphic')

    const startAngle = -Math.PI * 0.75
    const totalSweep = Math.PI * 1.5

    // Full background arc
    const bgArc = d3.arc<any>().innerRadius(radius - strokeW / 2).outerRadius(radius + strokeW / 2)
      .startAngle(startAngle).endAngle(startAngle + totalSweep).cornerRadius(strokeW / 2)
    svg.append('path').attr('d', bgArc({}) as string).attr('transform', `translate(${cx},${cy})`)
      .attr('fill', `url(#spd-${index})`).attr('opacity', 0.2)

    // Colored fill arc up to needle position
    const fillArc = d3.arc<any>().innerRadius(radius - strokeW / 2).outerRadius(radius + strokeW / 2)
      .startAngle(startAngle).cornerRadius(strokeW / 2)
    const targetEnd = startAngle + totalSweep * position

    const fillPath = svg.append('path').attr('transform', `translate(${cx},${cy})`)
      .attr('fill', `url(#spd-${index})`).attr('filter', `url(#spd-glow-${index})`)
      .attr('d', fillArc({ endAngle: startAngle }) as string)

    fillPath.transition().delay(index * 120 + 200).duration(1800).ease(d3.easeCubicOut)
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
        .attr('stroke', isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)').attr('stroke-width', 1)
    })

    // Needle
    const needleLen = radius - 6
    const needleAngle = targetEnd - Math.PI / 2
    const needle = svg.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('x2', cx).attr('y2', cy)
      .attr('stroke', isDark ? '#fff' : '#1e293b').attr('stroke-width', 2).attr('stroke-linecap', 'round')
      .attr('opacity', 0)

    needle.transition().delay(index * 120 + 200).duration(1800).ease(d3.easeCubicOut)
      .attr('x2', cx + Math.cos(needleAngle) * needleLen)
      .attr('y2', cy + Math.sin(needleAngle) * needleLen)
      .attr('opacity', 0.9)

    // Center hub
    svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 4).attr('fill', isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)')

    // Value text
    svg.append('text').attr('x', cx).attr('y', cy + 20).attr('text-anchor', 'middle')
      .attr('fill', isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)').attr('font-size', '10px').attr('font-weight', 800)
      .text(metric.value + (metric.unit || ''))

    // Subtle revving oscillation at low framerate
    const jitterAmp = totalSweep * 0.025
    let revInterval: ReturnType<typeof setInterval>
    function revTick() {
      const jitter = Math.sin(Date.now() / 300) * jitterAmp * (0.6 + 0.4 * Math.sin(Date.now() / 170))
      const curEnd = targetEnd + jitter
      const curAngle = curEnd - Math.PI / 2
      fillPath.attr('d', fillArc({ endAngle: curEnd }) as string)
      needle.attr('x2', cx + Math.cos(curAngle) * needleLen).attr('y2', cy + Math.sin(curAngle) * needleLen)
    }
    // Start revving after initial animation finishes
    const revTimer = setTimeout(() => { revInterval = setInterval(revTick, 66) }, index * 120 + 200 + 1800)
    return () => { clearTimeout(revTimer); clearInterval(revInterval) }
  }, [position, index, metric, isDark])

  return (
    <div className="jmv-card jmv-gauge-card">
      <svg ref={svgRef} className="jmv-gauge-svg" />
      <div className="jmv-card-label">{metric.label}</div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────

function parseRange(value: string): { lo: number; hi: number } {
  const match = value.replace(/[~,]/g, '').match(/(\d+)\s*[-–]\s*(\d+)/)
  if (match) return { lo: parseInt(match[1]), hi: parseInt(match[2]) }
  const single = value.match(/(\d+)/)
  return { lo: parseInt(single?.[1] || '0'), hi: parseInt(single?.[1] || '0') }
}

// ── Viz router ─────────────────────────────────────────────────────────

function MetricVizItem({ metric, index }: { metric: MetricInput; index: number }) {
  switch (metric.viz) {
    case 'sparkline': return <SparklineCard metric={metric} index={index} />
    case 'dual-sparkline': return <DualSparklineCard metric={metric} index={index} />
    case 'text': return <TextCard metric={metric} />
    case 'text-icon': return <TextIconCard metric={metric} />
    case 'range-gauge': return <RangeGauge metric={metric} index={index} />
    case 'tacho': return <TachoGauge metric={metric} index={index} />
    case 'speedo': return <SpeedoGauge metric={metric} index={index} />
    case 'before-after': return <BeforeAfterCard metric={metric} />
    default: return <TextCard metric={metric} />
  }
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════

export default function JobMetricViz({ metrics }: { metrics: MetricInput[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setIsVisible(true); obs.disconnect() } },
      { threshold: 0.2 },
    )
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  if (!metrics.length) return null

  return (
    <div ref={containerRef} className={`jmv-container ${isVisible ? 'visible' : ''}`}>
      <div className="jmv-grid">
        {metrics.map((m, i) => (
          <MetricVizItem key={`${m.label}-${i}`} metric={m} index={i} />
        ))}
      </div>
    </div>
  )
}
