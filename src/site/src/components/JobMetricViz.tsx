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

/**
 * Build a segmented arc group where the gradient truly follows the arc path.
 *
 * Uses NON-OVERLAPPING arc slices so the colour at every point along the arc
 * is correct.  Rounded caps at start and end are drawn as small circles that
 * blend seamlessly with their adjacent segment (same colour).
 *
 * Call `updateSegments(endAngle)` to animate / update the visible portion.
 */
function createSegmentedArc(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  opts: {
    cx: number; cy: number; innerR: number; outerR: number
    arcStart: number; arcEnd: number; segments: number
    colorStops: { offset: number; color: string }[]
    filterUrl?: string
  }
) {
  const { cx, cy, innerR, outerR, arcStart, arcEnd, segments, colorStops, filterUrl } = opts
  const totalSweep = arcEnd - arcStart
  const strokeW = outerR - innerR

  // Build a d3 colour interpolator from the stops
  const colorScale = d3.scaleLinear<string>()
    .domain(colorStops.map(s => s.offset))
    .range(colorStops.map(s => s.color))
    .clamp(true)

  const g = svg.append('g').attr('transform', `translate(${cx},${cy})`)
  if (filterUrl) g.attr('filter', filterUrl)

  const midR = (innerR + outerR) / 2
  const capR = strokeW / 2
  const segEps = 0.004          // tiny angular overlap to prevent AA seams

  // ── Non-overlapping arc segments ─────────────────────────────────────
  // Each segment covers [t0, t1] of the sweep with the gradient colour at
  // its midpoint.  A small angular epsilon overlap between neighbours
  // hides antialiasing seams.
  interface SegMeta { start: number; end: number; color: string; fullPath: string }
  const segMeta: SegMeta[] = []
  const paths: d3.Selection<SVGPathElement, unknown, null, undefined>[] = []

  for (let i = 0; i < segments; i++) {
    const t0 = i / segments
    const t1 = (i + 1) / segments
    const segStart = arcStart + t0 * totalSweep
    const segEnd   = arcStart + t1 * totalSweep
    const drawEnd  = i < segments - 1 ? segEnd + segEps : segEnd
    const color    = colorScale((t0 + t1) / 2)

    const fullPath = (d3.arc<any>()
      .innerRadius(innerR).outerRadius(outerR)
      .startAngle(segStart).endAngle(drawEnd))({}) as string

    const p = g.append('path')
      .attr('d', fullPath)
      .attr('fill', color)
      .attr('display', 'none')
    paths.push(p)
    segMeta.push({ start: segStart, end: segEnd, color, fullPath })
  }

  // ── Rounded caps ─────────────────────────────────────────────────────
  // Circles at start and end, coloured to match the gradient at that point.
  // Because segments are non-overlapping the colours blend seamlessly.
  const startCapAngle = arcStart - Math.PI / 2
  const startCap = g.append('circle')
    .attr('cx', Math.cos(startCapAngle) * midR)
    .attr('cy', Math.sin(startCapAngle) * midR)
    .attr('r', capR)
    .attr('fill', colorScale(0))
    .attr('display', 'none')

  const endCap = g.append('circle')
    .attr('r', capR)
    .attr('fill', colorScale(1))
    .attr('display', 'none')

  // Track which segment was previously partial so we can restore its path
  let prevTipIdx = -1

  function updateSegments(currentEnd: number) {
    const anyVisible = currentEnd > arcStart + 0.005
    startCap.attr('display', anyVisible ? null : 'none')

    let tipIdx = -1
    for (let i = 0; i < segments; i++) {
      const { start: segStart, end: segEnd, fullPath } = segMeta[i]

      if (segEnd <= currentEnd + 0.005) {
        // Fully visible — restore original path if it was previously partial
        if (i === prevTipIdx) paths[i].attr('d', fullPath)
        paths[i].attr('display', null)
      } else if (segStart < currentEnd) {
        // Partially visible tip segment
        tipIdx = i
        const partialPath = (d3.arc<any>()
          .innerRadius(innerR).outerRadius(outerR)
          .startAngle(segStart).endAngle(currentEnd))({}) as string
        paths[i].attr('d', partialPath).attr('display', null)
      } else {
        paths[i].attr('display', 'none')
      }
    }
    prevTipIdx = tipIdx

    // Position the end cap at the current fill tip
    if (anyVisible) {
      const clampedEnd = Math.min(currentEnd, arcEnd)
      const capAngle = clampedEnd - Math.PI / 2
      const t = Math.min((clampedEnd - arcStart) / totalSweep, 1)
      endCap
        .attr('cx', Math.cos(capAngle) * midR)
        .attr('cy', Math.sin(capAngle) * midR)
        .attr('fill', colorScale(t))
        .attr('display', null)
    } else {
      endCap.attr('display', 'none')
    }
  }

  return { g, updateSegments }
}

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
      <svg ref={svgRef} className="jmv-sparkline-svg" aria-hidden="true" />
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
      <svg ref={svgRef} className="jmv-sparkline-svg" aria-hidden="true" />
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
      <svg viewBox="0 0 24 24" className="jmv-icon" aria-hidden="true">
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

    // Range band — segmented arc gradient
    const loAngle = startAngle + (parsed.lo / 100) * totalSweep
    const hiAngle = startAngle + (parsed.hi / 100) * totalSweep

    const { updateSegments } = createSegmentedArc(svg, {
      cx, cy, innerR: radius - strokeW / 2, outerR: radius + strokeW / 2,
      arcStart: loAngle, arcEnd: hiAngle, segments: 32,
      colorStops: [{ offset: 0, color: '#8b5cf6' }, { offset: 1, color: '#ff2bd6' }],
      filterUrl: `url(#rg-glow-${index})`,
    })

    // Animate fill
    const delay = index * 120 + 200
    const duration = 1200
    const ease = d3.easeCubicOut
    const angleInterp = d3.interpolate(loAngle, hiAngle)
    let startTime = 0

    const timer = d3.timer((elapsed) => {
      if (elapsed - delay < 0) return
      if (!startTime) startTime = elapsed
      const rawT = Math.min((elapsed - startTime) / duration, 1)
      updateSegments(angleInterp(ease(rawT)))
      if (rawT >= 1) timer.stop()
    })

    // Center text
    svg.append('text').attr('x', cx).attr('y', cy - 2).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('fill', isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)').attr('font-size', '13px').attr('font-weight', 900)
      .text(`${parsed.lo}–${parsed.hi}%`)

    // Randomized revving
    const seedA = 250 + index * 73 + (parsed.lo * 7) % 150
    const seedB = 160 + index * 47 + (parsed.hi * 11) % 120
    const jitterAmp = totalSweep * (0.014 + (index % 3) * 0.003)
    let revInterval: ReturnType<typeof setInterval>
    function revTick() {
      const t = Date.now()
      const jitter = Math.sin(t / seedA) * jitterAmp * (0.5 + 0.5 * Math.sin(t / seedB))
        + Math.sin(t / 173) * jitterAmp * 0.25
      updateSegments(hiAngle + jitter)
    }
    const revTimer = setTimeout(() => { revInterval = setInterval(revTick, 66) }, delay + duration)
    return () => { timer.stop(); clearTimeout(revTimer); clearInterval(revInterval) }
  }, [parsed, index, isDark])

  return (
    <div className="jmv-card jmv-gauge-card">
      <svg ref={svgRef} className="jmv-gauge-svg" role="img" aria-label={`${metric.label}: ${metric.value}${metric.unit || ''}`} />
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

    // Segmented arc gradient — cyan → purple → pink
    const { updateSegments } = createSegmentedArc(svg, {
      cx, cy, innerR: radius - strokeW / 2, outerR: radius + strokeW / 2,
      arcStart: startAngle, arcEnd: startAngle + totalSweep, segments: 48,
      colorStops: [{ offset: 0, color: '#22d3ee' }, { offset: 0.5, color: '#8b5cf6' }, { offset: 1, color: '#ff2bd6' }],
      filterUrl: `url(#tg-glow-${index})`,
    })

    // Custom timer drives arc animation
    const delay = index * 120 + 200
    const duration = 1400
    const elasticEase = d3.easeElasticOut.amplitude(0.8).period(0.45)
    const angleInterp = d3.interpolate(startAngle, targetEnd)
    let startTime = 0

    const timer = d3.timer((elapsed) => {
      const sinceDelay = elapsed - delay
      if (sinceDelay < 0) return

      if (!startTime) startTime = elapsed
      const rawT = Math.min((elapsed - startTime) / duration, 1)
      const t = elasticEase(rawT)
      const curAngle = angleInterp(t)

      updateSegments(curAngle)

      if (rawT >= 1) timer.stop()
    })

    svg.append('text').attr('x', cx).attr('y', cy + 2).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('fill', isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)').attr('font-size', '16px').attr('font-weight', 900).text(`${value}%`)

    // Randomized revving — skip for 100% (perfect scores shouldn't jitter)
    if (value >= 100) return
    const seedA = 220 + index * 61 + (value * 3) % 130
    const seedB = 150 + index * 43 + (value * 7) % 110
    const jitterAmp = totalSweep * (0.016 + (index % 4) * 0.003)
    let revInterval: ReturnType<typeof setInterval>
    function revTick() {
      const t = Date.now()
      const jitter = Math.sin(t / seedA) * jitterAmp * (0.5 + 0.5 * Math.sin(t / seedB))
        + Math.sin(t / 149) * jitterAmp * 0.3
      const curEnd = targetEnd + jitter
      updateSegments(curEnd)
    }
    const revTimer = setTimeout(() => { revInterval = setInterval(revTick, 66) }, delay + duration)
    return () => { timer.stop(); clearTimeout(revTimer); clearInterval(revInterval) }
  }, [value, index, isDark])

  return (
    <div className="jmv-card jmv-gauge-card">
      <svg ref={svgRef} className="jmv-gauge-svg" role="img" aria-label={`${metric.label}: ${metric.value}${metric.unit || ''}`} />
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

    const glow = defs.append('filter').attr('id', `spd-glow-${index}`)
      .attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%')
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')
    const merge = glow.append('feMerge')
    merge.append('feMergeNode').attr('in', 'blur')
    merge.append('feMergeNode').attr('in', 'SourceGraphic')

    const startAngle = -Math.PI * 0.75
    const totalSweep = Math.PI * 1.5
    const spdStops = [
      { offset: 0, color: '#22d3ee' }, { offset: 0.4, color: '#10b981' },
      { offset: 0.7, color: '#f59e0b' }, { offset: 1, color: '#ef4444' },
    ]

    // Full background arc — static segmented at low opacity
    const bgSegs = createSegmentedArc(svg, {
      cx, cy, innerR: radius - strokeW / 2, outerR: radius + strokeW / 2,
      arcStart: startAngle, arcEnd: startAngle + totalSweep, segments: 48,
      colorStops: spdStops,
    })
    bgSegs.g.attr('opacity', 0.2)
    bgSegs.updateSegments(startAngle + totalSweep) // show all segments

    // Colored fill arc up to needle position — segmented gradient
    const targetEnd = startAngle + totalSweep * position

    const { updateSegments } = createSegmentedArc(svg, {
      cx, cy, innerR: radius - strokeW / 2, outerR: radius + strokeW / 2,
      arcStart: startAngle, arcEnd: startAngle + totalSweep, segments: 48,
      colorStops: spdStops,
      filterUrl: `url(#spd-glow-${index})`,
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

    // Needle — starts at the arc start position, sweeps in exact sync with fill arc
    const needleLen = radius - 6
    const startNeedleA = startAngle - Math.PI / 2
    const needle = svg.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('x2', cx + Math.cos(startNeedleA) * needleLen)
      .attr('y2', cy + Math.sin(startNeedleA) * needleLen)
      .attr('stroke', isDark ? '#fff' : '#1e293b').attr('stroke-width', 2).attr('stroke-linecap', 'round')
      .attr('opacity', 0.9)

    // Center hub
    svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 4).attr('fill', isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)')

    // Single custom timer drives both fill arc and needle on the same frame
    const delay = index * 120 + 200
    const duration = 1800
    const ease = d3.easeCubicOut
    const angleInterp = d3.interpolate(startAngle, targetEnd)
    let startTime = 0

    const timer = d3.timer((elapsed) => {
      const sinceDelay = elapsed - delay
      if (sinceDelay < 0) return

      if (!startTime) startTime = elapsed
      const rawT = Math.min((elapsed - startTime) / duration, 1)
      const t = ease(rawT)
      const curAngle = angleInterp(t)

      // Update arc fill
      updateSegments(curAngle)

      // Update needle to same angle
      const a = curAngle - Math.PI / 2
      needle
        .attr('x2', cx + Math.cos(a) * needleLen)
        .attr('y2', cy + Math.sin(a) * needleLen)

      if (rawT >= 1) timer.stop()
    })

    // Value text
    svg.append('text').attr('x', cx).attr('y', cy + 20).attr('text-anchor', 'middle')
      .attr('fill', isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)').attr('font-size', '10px').attr('font-weight', 800)
      .text(metric.value + (metric.unit || ''))

    // Randomized revving — noise seeds for organic feel
    const seedA = 240 + index * 67
    const seedB = 135 + index * 53
    const jitterAmp = totalSweep * (0.020 + (index % 3) * 0.004)
    let revInterval: ReturnType<typeof setInterval>
    function revTick() {
      const t = Date.now()
      const jitter = Math.sin(t / seedA) * jitterAmp * (0.6 + 0.4 * Math.sin(t / seedB))
        + Math.sin(t / 191) * jitterAmp * 0.2
      const curEnd = targetEnd + jitter
      const curAngle = curEnd - Math.PI / 2
      updateSegments(curEnd)
      needle.attr('x2', cx + Math.cos(curAngle) * needleLen).attr('y2', cy + Math.sin(curAngle) * needleLen)
    }
    // Start revving after initial animation finishes
    const revTimer = setTimeout(() => { revInterval = setInterval(revTick, 66) }, delay + duration)
    return () => { timer.stop(); clearTimeout(revTimer); clearInterval(revInterval) }
  }, [position, index, metric, isDark])

  return (
    <div className="jmv-card jmv-gauge-card">
      <svg ref={svgRef} className="jmv-gauge-svg" role="img" aria-label={`${metric.label}: ${metric.value}${metric.unit || ''}`} />
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
