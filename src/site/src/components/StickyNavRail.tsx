import { useEffect, useState } from 'react'

type TimelineSection = {
  id: string
  label: string
  type: 'main' | 'job'
  date?: string
}

type Props = {
  sections: TimelineSection[]
}

export default function StickyNavRail({ sections }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    
    sections.forEach((section) => {
      const el = document.getElementById(section.id)
      if (!el) return
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveId(section.id)
          }
        },
        { 
          threshold: 0.3,
          rootMargin: '-20% 0px -60% 0px'
        }
      )
      
      observer.observe(el)
      observers.push(observer)
    })
    
    return () => observers.forEach(o => o.disconnect())
  }, [sections])
  
  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
  
  // Group jobs under Experience
  const mainSections = sections.filter(s => s.type === 'main')
  const jobs = sections.filter(s => s.type === 'job')
  
  return (
    <nav className="sticky-nav-rail" aria-label="Page navigation">
      <div className="nav-rail-inner">
        {mainSections.map((section) => {
          const isActive = activeId === section.id
          const isExperience = section.id === 'section-experience'
          
          // Check if any job is active (for Experience section highlight)
          const hasActiveJob = jobs.some(j => j.id === activeId)
          const showAsActive = isActive || (isExperience && hasActiveJob)
          
          return (
            <div key={section.id}>
              <button
                className={`nav-rail-item ${showAsActive ? 'active' : ''}`}
                onClick={() => scrollTo(section.id)}
                aria-current={showAsActive ? 'true' : undefined}
              >
                <span className="nav-rail-dot" />
                <span className="nav-rail-label">{section.label}</span>
              </button>
              
              {/* Nested job timeline under Experience */}
              {isExperience && jobs.length > 0 && (
                <div className="nav-rail-jobs">
                  {jobs.map((job) => {
                    const isJobActive = activeId === job.id
                    return (
                      <button
                        key={job.id}
                        className={`nav-rail-job ${isJobActive ? 'active' : ''}`}
                        onClick={() => scrollTo(job.id)}
                        aria-current={isJobActive ? 'true' : undefined}
                      >
                        <span className="nav-rail-job-dot" />
                        <span className="nav-rail-job-date">{job.date}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
