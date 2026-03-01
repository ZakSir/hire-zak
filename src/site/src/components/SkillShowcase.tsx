import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

// Enriched skill data with mastery levels
export type Skill = {
  name: string
  category: string
  level: 'master' | 'advanced' | 'intermediate'
  highlight?: boolean // Hero skills to emphasize
}

export const SKILLS: Skill[] = [
  // AI / LLM — Hero category
  { name: 'Agentic AI', category: 'AI & LLMs', level: 'master', highlight: true },
  { name: 'LLM Engineering', category: 'AI & LLMs', level: 'master', highlight: true },
  { name: 'RAG Systems', category: 'AI & LLMs', level: 'master', highlight: true },
  { name: 'AI Automation', category: 'AI & LLMs', level: 'master', highlight: true },
  { name: 'Prompt Engineering', category: 'AI & LLMs', level: 'advanced' },
  { name: 'LangChain', category: 'AI & LLMs', level: 'advanced' },
  { name: 'LangGraph', category: 'AI & LLMs', level: 'advanced' },
  { name: 'Embeddings', category: 'AI & LLMs', level: 'advanced' },
  { name: 'Guardrails', category: 'AI & LLMs', level: 'advanced' },
  { name: 'Multi-Agent Systems', category: 'AI & LLMs', level: 'master' },
  { name: 'Evaluation', category: 'AI & LLMs', level: 'intermediate' },
  { name: 'Vector Databases', category: 'AI & LLMs', level: 'intermediate' },

  // Governance & Compliance
  { name: 'AI Governance', category: 'Governance', level: 'master', highlight: true },
  { name: 'Compliance Automation', category: 'Governance', level: 'master', highlight: true },
  { name: 'NIST AI RMF', category: 'Governance', level: 'advanced' },
  { name: 'Model Risk', category: 'Governance', level: 'advanced' },
  { name: 'IT Compliance (Tech)', category: 'Governance', level: 'advanced' },
  { name: 'Privacy by Design', category: 'Governance', level: 'intermediate' },
  { name: 'Zero Trust', category: 'Governance', level: 'advanced' },
  { name: 'SOC Automation', category: 'Governance', level: 'advanced' },

  // Azure & Cloud
  { name: 'Azure', category: 'Cloud', level: 'master', highlight: true },
  { name: 'Azure OpenAI', category: 'Cloud', level: 'master' },
  { name: 'Azure AI Foundry', category: 'Cloud', level: 'advanced' },
  { name: 'Azure Policy', category: 'Cloud', level: 'master' },
  { name: 'Azure DevOps', category: 'Cloud', level: 'master' },
  { name: 'Azure Functions', category: 'Cloud', level: 'advanced' },
  { name: 'Cosmos DB', category: 'Cloud', level: 'advanced' },
  { name: 'Azure Networking', category: 'Cloud', level: 'intermediate' },
  { name: 'Infrastructure as Code', category: 'Cloud', level: 'advanced' },

  // Languages & Frameworks
  { name: 'C#', category: 'Languages', level: 'master', highlight: true },
  { name: 'TypeScript', category: 'Languages', level: 'master' },
  { name: 'Python', category: 'Languages', level: 'advanced', highlight: true },
  { name: 'ASP.NET', category: 'Languages', level: 'master' },
  { name: 'React', category: 'Languages', level: 'advanced' },
  { name: 'PowerShell', category: 'Languages', level: 'advanced' },
  { name: 'HTML / CSS', category: 'Languages', level: 'master' },
  { name: 'Node.js', category: 'Languages', level: 'advanced' },

  // DevOps & Infra
  { name: 'CI/CD Pipelines', category: 'DevOps', level: 'master', highlight: true },
  { name: 'Docker', category: 'DevOps', level: 'advanced' },
  { name: 'Kubernetes', category: 'DevOps', level: 'intermediate' },
  { name: 'GitHub Actions', category: 'DevOps', level: 'advanced' },
  { name: 'Pipeline Optimization', category: 'DevOps', level: 'advanced' },

  // Leadership
  { name: 'Engineering Leadership', category: 'Leadership', level: 'master', highlight: true },
  { name: 'AI Strategy', category: 'Leadership', level: 'master', highlight: true },
  { name: 'Team Building', category: 'Leadership', level: 'advanced' },
  { name: 'Executive Communication', category: 'Leadership', level: 'advanced' },
  { name: 'Platform Architecture', category: 'Leadership', level: 'master' },
  { name: 'Thought Leadership', category: 'Leadership', level: 'advanced' },
]

const CATEGORY_COLORS: Record<string, string> = {
  'AI & LLMs': '#22d3ee',
  'Governance': '#8b5cf6',
  'Cloud': '#3b82f6',
  'Languages': '#10b981',
  'DevOps': '#f59e0b',
  'Leadership': '#ff2bd6',
}

const LEVEL_VALUES: Record<string, number> = {
  'master': 100,
  'advanced': 75,
  'intermediate': 50,
}

// ============================================
// 1. RADIAL SKILL WHEEL
// ============================================
export function SkillWheel() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect() } },
      { threshold: 0.2 }
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])
  
  useEffect(() => {
    if (!svgRef.current || !isVisible) return
    
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    
    const width = 500
    const height = 500
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = 220
    
    // Group skills by category
    const categories = Array.from(new Set(SKILLS.map(s => s.category)))
    const skillsByCategory = categories.map(cat => ({
      category: cat,
      skills: SKILLS.filter(s => s.category === cat),
      color: CATEGORY_COLORS[cat] || '#888'
    }))
    
    // Create radial layout
    const totalSkills = SKILLS.length
    let currentAngle = -Math.PI / 2 // Start at top
    
    const g = svg.append('g').attr('transform', `translate(${centerX}, ${centerY})`)
    
    // Draw center circle
    g.append('circle')
      .attr('r', 50)
      .attr('fill', 'rgba(255,255,255,0.05)')
      .attr('stroke', 'rgba(255,255,255,0.2)')
    
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('fill', 'var(--text)')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('SKILLS')
    
    skillsByCategory.forEach((catGroup) => {
      const anglePerSkill = (2 * Math.PI) / totalSkills
      
      catGroup.skills.forEach((skill, i) => {
        const angle = currentAngle
        currentAngle += anglePerSkill
        
        const radius = 60 + (LEVEL_VALUES[skill.level] / 100) * (maxRadius - 60)
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        
        // Draw connecting line
        const line = g.append('line')
          .attr('x1', Math.cos(angle) * 55)
          .attr('y1', Math.sin(angle) * 55)
          .attr('x2', Math.cos(angle) * 55)
          .attr('y2', Math.sin(angle) * 55)
          .attr('stroke', catGroup.color)
          .attr('stroke-width', skill.highlight ? 3 : 1.5)
          .attr('opacity', 0.6)
        
        line.transition()
          .delay(i * 30 + categories.indexOf(catGroup.category) * 200)
          .duration(800)
          .ease(d3.easeElasticOut)
          .attr('x2', x)
          .attr('y2', y)
        
        // Draw skill node
        const node = g.append('circle')
          .attr('cx', Math.cos(angle) * 55)
          .attr('cy', Math.sin(angle) * 55)
          .attr('r', 0)
          .attr('fill', catGroup.color)
          .attr('opacity', skill.highlight ? 1 : 0.7)
          .style('filter', skill.highlight ? `drop-shadow(0 0 8px ${catGroup.color})` : 'none')
        
        node.transition()
          .delay(i * 30 + categories.indexOf(catGroup.category) * 200 + 400)
          .duration(600)
          .ease(d3.easeElasticOut)
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', skill.highlight ? 8 : 5)
        
        // Add label for highlighted skills
        if (skill.highlight) {
          const labelRadius = radius + 20
          const labelX = Math.cos(angle) * labelRadius
          const labelY = Math.sin(angle) * labelRadius
          
          g.append('text')
            .attr('x', labelX)
            .attr('y', labelY)
            .attr('text-anchor', angle > Math.PI / 2 || angle < -Math.PI / 2 ? 'end' : 'start')
            .attr('dy', 4)
            .attr('fill', 'var(--text)')
            .attr('font-size', '10px')
            .attr('font-weight', '600')
            .attr('opacity', 0)
            .text(skill.name)
            .transition()
            .delay(i * 30 + categories.indexOf(catGroup.category) * 200 + 800)
            .duration(400)
            .attr('opacity', 1)
        }
      })
    })
    
    // Add legend
    const legend = svg.append('g').attr('transform', `translate(20, 20)`)
    categories.forEach((cat, i) => {
      const row = legend.append('g').attr('transform', `translate(0, ${i * 22})`)
      row.append('circle').attr('r', 6).attr('fill', CATEGORY_COLORS[cat] || '#888')
      row.append('text').attr('x', 14).attr('dy', 4).attr('fill', 'var(--muted)').attr('font-size', '11px').text(cat)
    })
    
  }, [isVisible])
  
  return (
    <div ref={containerRef} className="skill-viz-container">
      <h3 className="skill-viz-title">Skill Wheel</h3>
      <p className="skill-viz-subtitle">Radial mastery map • Highlighted = hero skills</p>
      <svg ref={svgRef} width="100%" viewBox="0 0 500 500" style={{ maxWidth: 500 }} />
    </div>
  )
}

// ============================================
// 2. ANIMATED SKILL BARS
// ============================================
export function SkillBars() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { 
        if (entry.isIntersecting) { 
          setIsVisible(true)
          // Trigger particles after initial swoosh
          setTimeout(() => setShowParticles(true), 300)
          observer.disconnect() 
        } 
      },
      { threshold: 0.15 }
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])
  
  const categories = Array.from(new Set(SKILLS.map(s => s.category)))
  
  // Generate random particles for the intro effect
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 2,
    delay: Math.random() * 600,
    duration: Math.random() * 1000 + 800,
    color: Object.values(CATEGORY_COLORS)[Math.floor(Math.random() * 5)],
  }))
  
  return (
    <div ref={containerRef} className={`skill-viz-container skill-intro-wrapper ${isVisible ? 'visible' : ''}`}>
      {/* Dramatic intro particles */}
      {showParticles && (
        <div className="skill-particles" aria-hidden="true">
          {particles.map(p => (
            <div 
              key={p.id}
              className="skill-particle"
              style={{
                '--px': `${p.x}%`,
                '--py': `${p.y}%`,
                '--psize': `${p.size}px`,
                '--pdelay': `${p.delay}ms`,
                '--pduration': `${p.duration}ms`,
                '--pcolor': p.color,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}
      
      {/* Glowing title reveal */}
      <div className={`skill-title-reveal ${isVisible ? 'visible' : ''}`}>
        <h3 className="skill-viz-title skill-title-glow">Skill Proficiency</h3>

      </div>
      
      {/* Staggered category cards with swoosh */}
      <div className={`skill-bars-grid skill-stagger-entrance ${isVisible ? 'visible' : ''}`}>
        {categories.map((cat, catIndex) => (
          <div 
            key={cat} 
            className="skill-category-group skill-card-swoosh"
            style={{ '--swoosh-delay': `${catIndex * 120 + 200}ms` } as React.CSSProperties}
          >
            <div className="skill-category-header" style={{ color: CATEGORY_COLORS[cat] }}>
              <span className="category-icon-glow" style={{ '--glow-color': CATEGORY_COLORS[cat] } as React.CSSProperties} />
              {cat}
            </div>
            {SKILLS.filter(s => s.category === cat).map((skill, i) => (
              <div 
                key={skill.name} 
                className="skill-bar-row skill-bar-fly-in"
                style={{ '--fly-delay': `${catIndex * 120 + i * 60 + 400}ms` } as React.CSSProperties}
              >
                <div className="skill-bar-label">
                  {skill.highlight && <span className="skill-star">★</span>}
                  {skill.name}
                </div>
                <div className="skill-bar-track">
                  <div 
                    className={`skill-bar-fill ${isVisible ? 'animate' : ''}`}
                    style={{ 
                      '--fill-width': `${LEVEL_VALUES[skill.level]}%`,
                      '--fill-color': CATEGORY_COLORS[cat],
                      '--delay': `${catIndex * 150 + i * 80 + 600}ms`,
                    } as React.CSSProperties}
                  />
                  {/* Shimmer effect on fill */}
                  <div className="skill-bar-shimmer" />
                </div>
                <div className="skill-bar-level">{skill.level}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// 3. FLOATING SKILL CLOUD / DNA
// ============================================
export function SkillCloud() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect() } },
      { threshold: 0.2 }
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])
  
  // Only show highlighted/important skills
  const heroSkills = SKILLS.filter(s => s.highlight || s.level === 'master').slice(0, 18)
  
  return (
    <div ref={containerRef} className="skill-viz-container">
      <h3 className="skill-viz-title">Skill Cloud</h3>
      <p className="skill-viz-subtitle">Floating mastery visualization</p>
      
      <div className={`skill-cloud ${isVisible ? 'visible' : ''}`}>
        {heroSkills.map((skill, i) => (
          <div 
            key={skill.name}
            className={`skill-cloud-item ${skill.highlight ? 'hero' : ''}`}
            style={{
              '--cloud-index': i,
              '--cloud-color': CATEGORY_COLORS[skill.category],
              animationDelay: `${i * 100}ms`,
            } as React.CSSProperties}
          >
            {skill.name}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// COMBINED SHOWCASE
// ============================================
export default function SkillShowcase() {
  return (
    <div className="skill-showcase">
      <SkillWheel />
      <SkillBars />
      <SkillCloud />
    </div>
  )
}
