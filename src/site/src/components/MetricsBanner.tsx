import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

export type MetricData = {
  value: string
  label: string
  numericValue?: number
  suffix?: string
}

function parseMetric(raw: string): { num: number; suffix: string } {
  // Extract numeric part and suffix from things like "70-95%", "40%", "1000+people", "$5M"
  const match = raw.match(/^(\$)?(\d+(?:\.\d+)?)\s*[-–]?\s*(\d+(?:\.\d+)?)?\s*(%|[xX]|[kKmMbB]|\+)?/)
  if (!match) return { num: 0, suffix: '' }
  
  const prefix = match[1] || ''
  const firstNum = parseFloat(match[2])
  const secondNum = match[3] ? parseFloat(match[3]) : null
  const suffix = match[4] || ''
  
  // Use the higher number if it's a range
  const num = secondNum ?? firstNum
  return { num, suffix: prefix + (suffix === '%' ? '%' : suffix) }
}

function AnimatedNumber({ value, suffix, delay }: { value: number; suffix: string; delay: number }) {
  const [display, setDisplay] = useState(0)
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 1800
      const start = performance.now()
      
      const animate = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        // Easing: easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
        setDisplay(Math.round(value * eased))
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      
      requestAnimationFrame(animate)
    }, delay)
    
    return () => clearTimeout(timeout)
  }, [value, delay])
  
  return (
    <span className="metric-number">
      {suffix.startsWith('$') ? '$' : ''}{display}{suffix.replace('$', '')}
    </span>
  )
}

function MetricArc({ metric, index }: { metric: MetricData; index: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { num, suffix } = parseMetric(metric.value)
  
  useEffect(() => {
    if (!svgRef.current) return
    
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    
    const size = 90
    const strokeWidth = 6
    const radius = (size - strokeWidth) / 2
    const center = size / 2
    
    // Background arc
    const bgArc = d3.arc<any>()
      .innerRadius(radius - strokeWidth / 2)
      .outerRadius(radius + strokeWidth / 2)
      .startAngle(-Math.PI * 0.75)
      .endAngle(Math.PI * 0.75)
      .cornerRadius(strokeWidth / 2)
    
    svg.append('path')
      .attr('d', bgArc({}) as string)
      .attr('transform', `translate(${center}, ${center})`)
      .attr('fill', 'rgba(255,255,255,0.08)')
    
    // Foreground arc (animated)
    const percent = Math.min(num / 100, 1) // Normalize to 0-1
    const endAngle = -Math.PI * 0.75 + (Math.PI * 1.5 * percent)
    
    const fgArc = d3.arc<any>()
      .innerRadius(radius - strokeWidth / 2)
      .outerRadius(radius + strokeWidth / 2)
      .startAngle(-Math.PI * 0.75)
      .cornerRadius(strokeWidth / 2)
    
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', `metric-gradient-${index}`)
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%')
    
    gradient.append('stop').attr('offset', '0%').attr('stop-color', 'var(--brand)')
    gradient.append('stop').attr('offset', '50%').attr('stop-color', 'var(--brand2)')
    gradient.append('stop').attr('offset', '100%').attr('stop-color', 'var(--brand3)')
    
    // Glow filter
    const filter = svg.append('defs')
      .append('filter')
      .attr('id', `glow-${index}`)
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%')
    
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')
    
    const path = svg.append('path')
      .attr('transform', `translate(${center}, ${center})`)
      .attr('fill', `url(#metric-gradient-${index})`)
      .attr('filter', `url(#glow-${index})`)
      .attr('d', fgArc({ endAngle: -Math.PI * 0.75 }) as string)
    
    path.transition()
      .delay(index * 150 + 300)
      .duration(1500)
      .ease(d3.easeElasticOut.amplitude(1).period(0.5))
      .attrTween('d', () => {
        const interpolate = d3.interpolate(-Math.PI * 0.75, endAngle)
        return (t: number) => fgArc({ endAngle: interpolate(t) }) as string
      })
    
  }, [metric, index, num])
  
  return (
    <div className="metric-arc-item">
      <div className="metric-arc-visual">
        <svg ref={svgRef} width="90" height="90" />
        <div className="metric-arc-value">
          <AnimatedNumber value={num} suffix={suffix} delay={index * 150 + 300} />
        </div>
      </div>
      <div className="metric-arc-label">{metric.label}</div>
    </div>
  )
}

function MetricBar({ metric, index }: { metric: MetricData; index: number }) {
  const barRef = useRef<HTMLDivElement>(null)
  const { num, suffix } = parseMetric(metric.value)
  
  useEffect(() => {
    if (!barRef.current) return
    
    const bar = barRef.current
    bar.style.width = '0%'
    
    setTimeout(() => {
      bar.style.width = `${Math.min(num, 100)}%`
    }, index * 100 + 400)
  }, [num, index])
  
  return (
    <div className="metric-bar-item">
      <div className="metric-bar-header">
        <AnimatedNumber value={num} suffix={suffix} delay={index * 100 + 400} />
        <span className="metric-bar-label">{metric.label}</span>
      </div>
      <div className="metric-bar-track">
        <div ref={barRef} className="metric-bar-fill" style={{ '--bar-index': index } as React.CSSProperties} />
      </div>
    </div>
  )
}

export default function MetricsBanner({ metrics }: { metrics: MetricData[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])
  
  if (!metrics.length) return null
  
  // Split metrics: first 3 get arcs, rest get bars
  const arcMetrics = metrics.slice(0, 3)
  const barMetrics = metrics.slice(3, 6)
  
  return (
    <div ref={containerRef} className={`metrics-banner ${isVisible ? 'visible' : ''}`}>
      <div className="metrics-banner-inner">
        {/* Arc metrics - big visual impact */}
        <div className="metrics-arcs">
          {arcMetrics.map((m, i) => (
            <MetricArc key={m.value} metric={m} index={i} />
          ))}
        </div>
        
        {/* Bar metrics - secondary */}
        {barMetrics.length > 0 && (
          <div className="metrics-bars">
            {barMetrics.map((m, i) => (
              <MetricBar key={m.value} metric={m} index={i} />
            ))}
          </div>
        )}
      </div>
      
      {/* Animated background particles */}
      <div className="metrics-particles" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="metrics-particle" style={{ '--p-index': i } as React.CSSProperties} />
        ))}
      </div>
    </div>
  )
}
