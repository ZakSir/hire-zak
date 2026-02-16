import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { useTheme } from '../lib/useTheme'

/* ═══════════════════════════════════════════════════════════════════════════
   EXEC STRENGTH VIZ — decorative mini-visualizations for each
   Executive Strengths card. Each card gets a unique D3 graphic that
   reinforces its theme:

     0  AI Strategy → Delivery       sparkline   (strategy → exponential ramp)
     1  Agentic Systems at Scale      network     (interconnected agent nodes)
     2  Enterprise Governance & Trust  tacho       (compliance gauge at 95%)
     3  Engineering Leadership         speedo      (team velocity pegged high)
   ═══════════════════════════════════════════════════════════════════════════ */

// ── 0 · Strategy Sparkline ──────────────────────────────────────────────

function StrategySparkline({ index, visible }: { index: number; visible: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const idRef = useRef(`esv-spark-${Math.random().toString(36).slice(2, 8)}`)
  const data = [1, 2, 3, 5, 8, 14, 24, 42, 72, 120]

  useEffect(() => {
    if (!svgRef.current || !visible) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const w = 140, h = 56
    svg.attr('viewBox', `0 0 ${w} ${h}`)

    const xS = d3.scaleLinear().domain([0, data.length - 1]).range([4, w - 4])
    const yS = d3.scaleLinear().domain([0, d3.max(data)!]).range([h - 4, 6])

    const lineFn = d3.line<number>().x((_, i) => xS(i)).y(d => yS(d)).curve(d3.curveMonotoneX)
    const areaFn = d3.area<number>().x((_, i) => xS(i)).y0(h).y1(d => yS(d)).curve(d3.curveMonotoneX)

    const uid = idRef.current
    const defs = svg.append('defs')

    // Gradient fill
    const grad = defs.append('linearGradient').attr('id', uid)
      .attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1')
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#22d3ee').attr('stop-opacity', 0.35)
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#22d3ee').attr('stop-opacity', 0)

    // Glow
    const glow = defs.append('filter').attr('id', `${uid}-glow`)
      .attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%')
    glow.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'blur')
    const merge = glow.append('feMerge')
    merge.append('feMergeNode').attr('in', 'blur')
    merge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Clip reveal
    const clip = defs.append('clipPath').attr('id', `${uid}-clip`)
    const clipRect = clip.append('rect').attr('x', 0).attr('y', 0).attr('width', 0).attr('height', h)

    const g = svg.append('g').attr('clip-path', `url(#${uid}-clip)`)
    g.append('path').datum(data).attr('d', areaFn).attr('fill', `url(#${uid})`)
    g.append('path').datum(data).attr('d', lineFn)
      .attr('fill', 'none').attr('stroke', '#22d3ee').attr('stroke-width', 2)
      .attr('filter', `url(#${uid}-glow)`)
    g.append('circle')
      .attr('cx', xS(data.length - 1)).attr('cy', yS(data[data.length - 1]))
      .attr('r', 3.5).attr('fill', '#22d3ee').attr('filter', `url(#${uid}-glow)`)

    clipRect.transition().delay(index * 120 + 300).duration(1400).ease(d3.easeCubicOut).attr('width', w)
  }, [visible, index])

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', maxWidth: 140, height: 56, display: 'block' }}
    />
  )
}

// ── 1 · Agent Network ───────────────────────────────────────────────────

function AgentNetwork({ index, visible }: { index: number; visible: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const idRef = useRef(`esv-net-${Math.random().toString(36).slice(2, 8)}`)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!svgRef.current || !visible) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const w = 140, h = 56
    svg.attr('viewBox', `0 0 ${w} ${h}`)

    const uid = idRef.current
    const defs = svg.append('defs')
    const glow = defs.append('filter').attr('id', `${uid}-glow`)
      .attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%')
    glow.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'blur')
    const merge = glow.append('feMerge')
    merge.append('feMergeNode').attr('in', 'blur')
    merge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Nodes — laid out as a mini agent-flow network
    const nodes = [
      { x: 18, y: 28, r: 5, color: '#22d3ee', label: 'orchestrator' },
      { x: 52, y: 12, r: 3.5, color: '#8b5cf6', label: 'triage' },
      { x: 52, y: 44, r: 3.5, color: '#8b5cf6', label: 'investigate' },
      { x: 88, y: 12, r: 3.5, color: '#ff2bd6', label: 'RAG' },
      { x: 88, y: 44, r: 3.5, color: '#ff2bd6', label: 'eval' },
      { x: 122, y: 28, r: 5, color: '#22d3ee', label: 'report' },
    ]

    // Edges
    const edges = [
      [0, 1], [0, 2], [1, 3], [2, 4], [1, 4], [2, 3], [3, 5], [4, 5],
    ]

    const g = svg.append('g')

    // Draw edges first
    edges.forEach(([a, b], ei) => {
      const line = g.append('line')
        .attr('x1', nodes[a].x).attr('y1', nodes[a].y)
        .attr('x2', nodes[a].x).attr('y2', nodes[a].y)
        .attr('stroke', isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)')
        .attr('stroke-width', 1)

      line.transition()
        .delay(index * 120 + 300 + ei * 60)
        .duration(500)
        .ease(d3.easeCubicOut)
        .attr('x2', nodes[b].x).attr('y2', nodes[b].y)
    })

    // Draw nodes
    nodes.forEach((node, ni) => {
      g.append('circle')
        .attr('cx', node.x).attr('cy', node.y)
        .attr('r', 0)
        .attr('fill', node.color)
        .attr('filter', `url(#${uid}-glow)`)
        .attr('opacity', 0.9)
        .transition()
        .delay(index * 120 + 300 + ni * 80)
        .duration(600)
        .ease(d3.easeElasticOut.amplitude(0.7).period(0.5))
        .attr('r', node.r)
    })

    // Pulsing animation on the orchestrator and report nodes
    let pulseInterval: ReturnType<typeof setInterval>
    const pulseTimer = setTimeout(() => {
      pulseInterval = setInterval(() => {
        const t = Date.now() / 1000
        const pulse = 0.7 + 0.3 * Math.sin(t * 2)
        g.selectAll('circle')
          .filter((_d: unknown, i: number) => i === 0 || i === 5)
          .attr('opacity', pulse)
      }, 66)
    }, index * 120 + 300 + 800)

    return () => { clearTimeout(pulseTimer); clearInterval(pulseInterval) }
  }, [visible, index, isDark])

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', maxWidth: 140, height: 56, display: 'block' }}
    />
  )
}

// ── 2 · Governance Gauge (tacho at 95%) ─────────────────────────────────

function GovernanceGauge({ index, visible }: { index: number; visible: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const value = 95
  // Per-instance random seeds for organic jitter
  const seedRef = useRef({ a: 200 + Math.random() * 200, b: 140 + Math.random() * 140, amp: 0.010 + Math.random() * 0.008 })

  useEffect(() => {
    if (!svgRef.current || !visible) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const w = 140, h = 76
    const strokeW = 7
    const radius = 30
    const cx = w - radius - strokeW - 6, cy = 44

    svg.attr('viewBox', `0 0 ${w} ${h}`)

    const defs = svg.append('defs')
    const grad = defs.append('linearGradient').attr('id', `esv-tg-${index}`)
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%')
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#22d3ee')
    grad.append('stop').attr('offset', '50%').attr('stop-color', '#8b5cf6')
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#ff2bd6')

    const glow = defs.append('filter').attr('id', `esv-tg-glow-${index}`)
      .attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%')
    glow.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'blur')
    const merge = glow.append('feMerge')
    merge.append('feMergeNode').attr('in', 'blur')
    merge.append('feMergeNode').attr('in', 'SourceGraphic')

    const startAngle = -Math.PI * 0.75
    const totalSweep = Math.PI * 1.5

    // Background arc
    const bgArc = d3.arc<any>()
      .innerRadius(radius - strokeW / 2).outerRadius(radius + strokeW / 2)
      .startAngle(startAngle).endAngle(startAngle + totalSweep).cornerRadius(strokeW / 2)
    svg.append('path').attr('d', bgArc({}) as string)
      .attr('transform', `translate(${cx},${cy})`)
      .attr('fill', isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)')

    // Tick marks
    ;[0, 25, 50, 75, 100].forEach(t => {
      const angle = startAngle + (t / 100) * totalSweep - Math.PI / 2
      const r1 = radius + strokeW / 2 + 1, r2 = r1 + 3
      svg.append('line')
        .attr('x1', cx + Math.cos(angle) * r1).attr('y1', cy + Math.sin(angle) * r1)
        .attr('x2', cx + Math.cos(angle) * r2).attr('y2', cy + Math.sin(angle) * r2)
        .attr('stroke', isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)').attr('stroke-width', 0.8)
    })

    const percent = value / 100
    const targetEnd = startAngle + totalSweep * percent
    const fgArc = d3.arc<any>()
      .innerRadius(radius - strokeW / 2).outerRadius(radius + strokeW / 2)
      .startAngle(startAngle).cornerRadius(strokeW / 2)

    const path = svg.append('path').attr('transform', `translate(${cx},${cy})`)
      .attr('fill', `url(#esv-tg-${index})`).attr('filter', `url(#esv-tg-glow-${index})`)
      .attr('d', fgArc({ endAngle: startAngle }) as string)

    path.transition().delay(index * 120 + 300).duration(1400)
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
      .attr('r', 3).attr('fill', '#ff2bd6').attr('opacity', 0)
      .transition().delay(index * 120 + 300).duration(1400)
      .ease(d3.easeElasticOut.amplitude(0.8).period(0.45))
      .attr('cx', cx + Math.cos(dotAngle) * radius)
      .attr('cy', cy + Math.sin(dotAngle) * radius)
      .attr('opacity', 1)

    // Center text
    svg.append('text').attr('x', cx).attr('y', cy + 1)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('fill', isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)')
      .attr('font-size', '13px').attr('font-weight', 900)
      .text(`${value}%`)

    // Randomized jitter — per-instance seeds make each gauge feel unique
    const { a: seedA, b: seedB, amp: seedAmp } = seedRef.current
    const jitterAmp = totalSweep * seedAmp
    let revInterval: ReturnType<typeof setInterval>
    const revTimer = setTimeout(() => {
      revInterval = setInterval(() => {
        const t = Date.now()
        const jitter = Math.sin(t / seedA) * jitterAmp * (0.5 + 0.5 * Math.sin(t / seedB))
          + Math.sin(t / 137) * jitterAmp * 0.3
        const curEnd = targetEnd + jitter
        const curDot = curEnd - Math.PI / 2
        path.attr('d', fgArc({ endAngle: curEnd }) as string)
        svg.select<SVGCircleElement>('circle:last-of-type')
          .attr('cx', cx + Math.cos(curDot) * radius)
          .attr('cy', cy + Math.sin(curDot) * radius)
      }, 66)
    }, index * 120 + 300 + 1400)

    return () => { clearTimeout(revTimer); clearInterval(revInterval) }
  }, [visible, index, isDark])

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', maxWidth: 140, height: 76, display: 'block' }}
    />
  )
}

// ── 3 · Leadership Speedo ───────────────────────────────────────────────

function LeadershipSpeedo({ index, visible }: { index: number; visible: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const position = 0.88
  // Per-instance random seeds for organic jitter
  const seedRef = useRef({ a: 220 + Math.random() * 180, b: 130 + Math.random() * 150, amp: 0.016 + Math.random() * 0.010 })

  useEffect(() => {
    if (!svgRef.current || !visible) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const w = 140, h = 76
    const strokeW = 7
    const radius = 30
    const cx = w - radius - strokeW - 6, cy = 44

    svg.attr('viewBox', `0 0 ${w} ${h}`)

    const defs = svg.append('defs')
    const grad = defs.append('linearGradient').attr('id', `esv-spd-${index}`)
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%')
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#22d3ee')
    grad.append('stop').attr('offset', '40%').attr('stop-color', '#10b981')
    grad.append('stop').attr('offset', '70%').attr('stop-color', '#f59e0b')
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#ef4444')

    const glow = defs.append('filter').attr('id', `esv-spd-glow-${index}`)
      .attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%')
    glow.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'blur')
    const merge = glow.append('feMerge')
    merge.append('feMergeNode').attr('in', 'blur')
    merge.append('feMergeNode').attr('in', 'SourceGraphic')

    const startAngle = -Math.PI * 0.75
    const totalSweep = Math.PI * 1.5

    // Full background arc (faded)
    const bgArc = d3.arc<any>()
      .innerRadius(radius - strokeW / 2).outerRadius(radius + strokeW / 2)
      .startAngle(startAngle).endAngle(startAngle + totalSweep).cornerRadius(strokeW / 2)
    svg.append('path').attr('d', bgArc({}) as string)
      .attr('transform', `translate(${cx},${cy})`)
      .attr('fill', `url(#esv-spd-${index})`).attr('opacity', 0.15)

    // Tick marks
    ;[0, 25, 50, 75, 100].forEach(t => {
      const angle = startAngle + (t / 100) * totalSweep - Math.PI / 2
      const r1 = radius + strokeW / 2 + 1, r2 = r1 + 3
      svg.append('line')
        .attr('x1', cx + Math.cos(angle) * r1).attr('y1', cy + Math.sin(angle) * r1)
        .attr('x2', cx + Math.cos(angle) * r2).attr('y2', cy + Math.sin(angle) * r2)
        .attr('stroke', isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)').attr('stroke-width', 0.8)
    })

    const targetEnd = startAngle + totalSweep * position
    const fillArc = d3.arc<any>()
      .innerRadius(radius - strokeW / 2).outerRadius(radius + strokeW / 2)
      .startAngle(startAngle).cornerRadius(strokeW / 2)

    const fillPath = svg.append('path').attr('transform', `translate(${cx},${cy})`)
      .attr('fill', `url(#esv-spd-${index})`).attr('filter', `url(#esv-spd-glow-${index})`)
      .attr('d', fillArc({ endAngle: startAngle }) as string)

    fillPath.transition().delay(index * 120 + 300).duration(1800).ease(d3.easeCubicOut)
      .attrTween('d', () => {
        const interp = d3.interpolate(startAngle, targetEnd)
        return (t: number) => fillArc({ endAngle: interp(t) }) as string
      })

    // Needle
    const needleLen = radius - 4
    const needleAngle = targetEnd - Math.PI / 2
    const needle = svg.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('x2', cx).attr('y2', cy)
      .attr('stroke', isDark ? '#fff' : '#1e293b').attr('stroke-width', 1.5).attr('stroke-linecap', 'round')
      .attr('opacity', 0)

    needle.transition().delay(index * 120 + 300).duration(1800).ease(d3.easeCubicOut)
      .attr('x2', cx + Math.cos(needleAngle) * needleLen)
      .attr('y2', cy + Math.sin(needleAngle) * needleLen)
      .attr('opacity', 0.85)

    // Center hub
    svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 3.5)
      .attr('fill', isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)')

    // Randomized revving — per-instance seeds
    const { a: seedA, b: seedB, amp: seedAmp } = seedRef.current
    const jitterAmp = totalSweep * seedAmp
    let revInterval: ReturnType<typeof setInterval>
    const revTimer = setTimeout(() => {
      revInterval = setInterval(() => {
        const t = Date.now()
        const jitter = Math.sin(t / seedA) * jitterAmp * (0.5 + 0.5 * Math.sin(t / seedB))
          + Math.sin(t / 163) * jitterAmp * 0.25
        const curEnd = targetEnd + jitter
        const curAngle = curEnd - Math.PI / 2
        fillPath.attr('d', fillArc({ endAngle: curEnd }) as string)
        needle
          .attr('x2', cx + Math.cos(curAngle) * needleLen)
          .attr('y2', cy + Math.sin(curAngle) * needleLen)
      }, 66)
    }, index * 120 + 300 + 1800)

    return () => { clearTimeout(revTimer); clearInterval(revInterval) }
  }, [visible, index, isDark])

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', maxWidth: 140, height: 76, display: 'block' }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — maps card index to the right viz
// ═══════════════════════════════════════════════════════════════════════════

const VIZ_MAP: Record<number, React.FC<{ index: number; visible: boolean }>> = {
  0: StrategySparkline,
  1: AgentNetwork,
  2: GovernanceGauge,
  3: LeadershipSpeedo,
}

export default function ExecStrengthViz({ cardIndex, visible }: { cardIndex: number; visible: boolean }) {
  const Component = VIZ_MAP[cardIndex]
  if (!Component) return null
  return <Component index={cardIndex} visible={visible} />
}
