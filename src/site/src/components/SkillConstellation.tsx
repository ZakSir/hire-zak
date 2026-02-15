import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'

type Props = {
  skills: Array<{ name: string; weight?: number; group?: string }>
  height?: number
  title?: string
}

type NodeDatum = d3.SimulationNodeDatum & {
  id: string
  group: string
  weight: number
  r: number
}

type LinkDatum = d3.SimulationLinkDatum<NodeDatum> & {
  source: NodeDatum
  target: NodeDatum
  strength: number
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n))
}

function hashString(s: string): number {
  // Small, stable, deterministic hash for styling (not security-related).
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export default function SkillConstellation({ skills, height = 420, title = 'Skill constellation' }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  const reducedMotion = useMemo(() => prefersReducedMotion(), [])

  const data = useMemo(() => {
    // Keep it bounded and deterministic-ish.
    const cleaned = skills
      .map((s) => ({
        name: s.name.trim(),
        group: (s.group ?? 'Skills').trim() || 'Skills',
        weight: clamp(Number.isFinite(s.weight ?? 0) ? (s.weight ?? 0) : 0, 0, 40),
      }))
      .filter((s) => s.name.length)

    const top = cleaned
      .sort((a, b) => (b.weight || 0) - (a.weight || 0) || a.name.localeCompare(b.name))
      .slice(0, 42)

    // If weights are all zero, give a gentle gradient.
    const maxW = Math.max(1, ...top.map((t) => t.weight || 0))

    const nodes: NodeDatum[] = top.map((t) => {
      const w = t.weight || 0
      const norm = w / maxW
      const r = 8 + norm * 16
      return { id: t.name, group: t.group, weight: w, r }
    })

    // Connect each node to a few neighbors (by alphabetical proximity) + some random-ish cross links.
    const byName = [...nodes].sort((a, b) => a.id.localeCompare(b.id))
    const nodeById = new Map(nodes.map((n) => [n.id, n]))

    const links: LinkDatum[] = []
    for (let i = 0; i < byName.length; i++) {
      const a = byName[i]
      for (let k = 1; k <= 2; k++) {
        const b = byName[(i + k) % byName.length]
        links.push({ source: a, target: b, strength: 0.35 })
      }
    }

    // Group links: connect within same group a bit.
    const groups = d3.group(nodes, (d: NodeDatum) => d.group)
    for (const [, g] of groups) {
      for (let i = 0; i < g.length; i++) {
        const a = g[i]
        const b = g[(i + 1) % g.length]
        if (a.id !== b.id) links.push({ source: a, target: b, strength: 0.55 })
      }
    }

    // De-dupe links
    const seen = new Set<string>()
    const deduped: LinkDatum[] = []
    for (const l of links) {
      const key = [l.source.id, l.target.id].sort().join('::')
      if (seen.has(key)) continue
      seen.add(key)
      deduped.push(l)
    }

    // Ensure link nodes are actual references
    const finalLinks = deduped
      .map((l) => ({
        ...l,
        source: nodeById.get(l.source.id) ?? l.source,
        target: nodeById.get(l.target.id) ?? l.target,
      }))
      .slice(0, 140)

    return { nodes, links: finalLinks }
  }, [skills])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const svg = d3.select(svgRef.current)
    const container = containerRef.current

    const resize = () => {
      const w = Math.max(320, Math.floor(container.getBoundingClientRect().width))
      svg.attr('viewBox', `0 0 ${w} ${height}`)
      return w
    }

    let width = resize()

    // Clear previous
    svg.selectAll('*').remove()

    const bg = svg
      .append('defs')
      .append('radialGradient')
      .attr('id', 'constellationGlow')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '70%')

    bg.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(34,211,238,0.24)')
    bg.append('stop').attr('offset', '45%').attr('stop-color', 'rgba(139,92,246,0.10)')
    bg.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(0,0,0,0)')

    svg
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#constellationGlow)')
      .attr('opacity', 0.9)

    const g = svg.append('g')

    const link = g
      .append('g')
      .attr('stroke', 'rgba(34,211,238,0.22)')
      .attr('stroke-width', 1)
      .attr('stroke-linecap', 'round')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('opacity', (d: LinkDatum) => 0.25 + d.strength * 0.35)

    const node = g
      .append('g')
      .selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', (d: NodeDatum) => d.r)
      .attr('fill', (d: NodeDatum) => {
        // group-based color feel (cyan/pink/purple/yellow)
        const h = Math.abs(hashString(d.group)) % 4
        if (h === 0) return 'rgba(34,211,238,0.85)'
        if (h === 1) return 'rgba(255,43,214,0.78)'
        if (h === 2) return 'rgba(139,92,246,0.78)'
        return 'rgba(255,210,31,0.55)'
      })
      .attr('stroke', 'rgba(255,255,255,0.35)')
      .attr('stroke-width', 1)
      .style('cursor', 'default')

    const label = g
      .append('g')
      .selectAll('text')
      .data(data.nodes)
      .join('text')
      .text((d: NodeDatum) => d.id)
      .attr('font-size', 12)
      .attr('font-family', 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial')
      .attr('fill', 'rgba(255,255,255,0.72)')
      .attr('paint-order', 'stroke')
      .attr('stroke', 'rgba(0,0,0,0.55)')
      .attr('stroke-width', 3)
      .attr('opacity', 0.0)

    const sim = d3
      .forceSimulation<NodeDatum>(data.nodes)
      .force('charge', d3.forceManyBody<NodeDatum>().strength(-44))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'link',
        d3
          .forceLink<NodeDatum, LinkDatum>(data.links)
          .id((d: NodeDatum) => d.id)
          .distance((d: LinkDatum) => 24 + (1 - d.strength) * 52)
          .strength((d: LinkDatum) => 0.25 + d.strength * 0.55)
      )
      .force('collide', d3.forceCollide<NodeDatum>().radius((d: NodeDatum) => d.r + 6).iterations(2))

    if (reducedMotion) {
      sim.stop()
      for (let i = 0; i < 120; i++) sim.tick()
    }

    // Drag behavior
    const drag = d3
      .drag<SVGCircleElement, NodeDatum>()
      .on('start', (event: d3.D3DragEvent<SVGCircleElement, NodeDatum, unknown>, d: NodeDatum) => {
        if (!event.active) sim.alphaTarget(0.25).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event: d3.D3DragEvent<SVGCircleElement, NodeDatum, unknown>, d: NodeDatum) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event: d3.D3DragEvent<SVGCircleElement, NodeDatum, unknown>, d: NodeDatum) => {
        if (!event.active) sim.alphaTarget(0)
        d.fx = null
        d.fy = null
      })

    ;(node as d3.Selection<SVGCircleElement, NodeDatum, SVGGElement, unknown>)
      .call(drag)
      .on('pointerenter', (_event: PointerEvent, d: NodeDatum) => setHovered(d.id))
      .on('pointerleave', () => setHovered(null))

    sim.on('tick', () => {
      link
        .attr('x1', (d: LinkDatum) => d.source.x ?? 0)
        .attr('y1', (d: LinkDatum) => d.source.y ?? 0)
        .attr('x2', (d: LinkDatum) => d.target.x ?? 0)
        .attr('y2', (d: LinkDatum) => d.target.y ?? 0)

      node.attr('cx', (d: NodeDatum) => (d.x = clamp(d.x ?? width / 2, 18, width - 18)))
      node.attr('cy', (d: NodeDatum) => (d.y = clamp(d.y ?? height / 2, 18, height - 18)))

      label
        .attr('x', (d: NodeDatum) => (d.x ?? 0) + d.r + 6)
        .attr('y', (d: NodeDatum) => (d.y ?? 0) + 4)
    })

    // subtle camera shift on mouse move
    const onMove = (e: PointerEvent) => {
      const r = container.getBoundingClientRect()
      const x = ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1
      const y = ((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1
      g.attr('transform', `translate(${x * 10}, ${y * 8})`)
    }

    container.addEventListener('pointermove', onMove, { passive: true })

    const onResize = () => {
      width = resize()
      sim.force('center', d3.forceCenter(width / 2, height / 2))
      sim.alpha(0.2).restart()
      if (reducedMotion) {
        sim.stop()
        for (let i = 0; i < 60; i++) sim.tick()
      }
    }

    window.addEventListener('resize', onResize)

    return () => {
      container.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', onResize)
      sim.stop()
    }
  }, [data.links, data.nodes, height, reducedMotion])

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)

    const nodes = svg.selectAll<SVGCircleElement, NodeDatum>('circle')
    const texts = svg.selectAll<SVGTextElement, NodeDatum>('text')
    const links = svg.selectAll<SVGLineElement, LinkDatum>('line')

    if (!hovered) {
      nodes
        .transition()
        .duration(120)
        .attr('opacity', 1)
        .attr('stroke', 'rgba(255,255,255,0.35)')
        .attr('stroke-width', 1)

      links.transition().duration(120).attr('opacity', (d: LinkDatum) => 0.25 + d.strength * 0.35)
      texts.transition().duration(120).attr('opacity', 0.0)
      return
    }

    nodes
      .transition()
      .duration(120)
      .attr('opacity', (d: NodeDatum) => (d.id === hovered ? 1 : 0.22))
      .attr('stroke', (d: NodeDatum) => (d.id === hovered ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.10)'))
      .attr('stroke-width', (d: NodeDatum) => (d.id === hovered ? 2 : 1))

    links
      .transition()
      .duration(120)
      .attr('opacity', (d: LinkDatum) => (d.source.id === hovered || d.target.id === hovered ? 0.75 : 0.08))

    texts.transition().duration(80).attr('opacity', (d: NodeDatum) => (d.id === hovered ? 1 : 0.0))
  }, [hovered])

  return (
    <div className="card glass" data-layer={2} style={{ padding: 18, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 850 }}>{title}</div>
        <div className="small" style={{ color: 'var(--muted)' }}>
          Drag nodes • Hover to highlight
        </div>
      </div>

      <div ref={containerRef} style={{ marginTop: 10, borderRadius: 14, overflow: 'hidden' }}>
        <svg ref={svgRef} width="100%" height={height} role="img" aria-label={title} />
      </div>

      <div className="small" style={{ marginTop: 10 }}>
        {hovered ? (
          <span>
            Focus: <span style={{ fontWeight: 800, color: 'var(--text)' }}>{hovered}</span>
          </span>
        ) : (
          <span>Tip: hover a node to reveal its label.</span>
        )}
      </div>
    </div>
  )
}
