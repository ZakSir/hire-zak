import { useCallback, useRef } from 'react'

const CHATGPT_URL =
  'https://chatgpt.com/g/g-69921b512868819182fe9b295ec130e8-hire-zak-gpt'

/* ── tiny confetti engine (no dependencies) ── */

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  color: string
  life: number
  spin: number
  w: number
  h: number
}

const COLORS = ['#22d3ee', '#ff2bd6', '#8b5cf6', '#ffd21f', '#1d4ed8', '#f59e0b', '#34d399', '#f472b6']

const MEGA_THRESHOLD = 10   // every 10th hover → mega explosion
const ULTRA_THRESHOLD = 100 // every 100th hover → ULTRA explosion

type ConfettiTier = 'normal' | 'mega' | 'ultra'

/**
 * Spawn confetti from the center of an element.
 * @param anchor  Element to burst from
 * @param tier    'normal' | 'mega' (10×) | 'ultra' (1000× mega)
 */
function spawnConfetti(anchor: HTMLElement, tier: ConfettiTier = 'normal') {
  const rect = anchor.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  const canvas = document.createElement('canvas')
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')!

  // ── tier presets ──
  const presets = {
    normal: { count: 55,    speedMul: 1,   lifeMul: 1,   sizeMul: 1,   gravity: 0.18, upKick: 2,  spinMul: 0.3, decay: 0.016, timeout: 3000  },
    mega:   { count: 550,   speedMul: 2.2, lifeMul: 1.8, sizeMul: 1.4, gravity: 0.12, upKick: 6,  spinMul: 0.5, decay: 0.008, timeout: 6000  },
    ultra:  { count: 5500,  speedMul: 3.8, lifeMul: 3,   sizeMul: 1.8, gravity: 0.06, upKick: 12, spinMul: 0.7, decay: 0.004, timeout: 12000 },
  } as const
  const p = presets[tier]

  const particles: Particle[] = []
  for (let i = 0; i < p.count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = (3 + Math.random() * 7) * p.speedMul
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed * (0.6 + Math.random()),
      vy: Math.sin(angle) * speed * (0.6 + Math.random()) - p.upKick,
      r: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: (0.7 + Math.random() * 0.5) * p.lifeMul,
      spin: (Math.random() - 0.5) * p.spinMul,
      w: (4 + Math.random() * 5) * p.sizeMul,
      h: (3 + Math.random() * 4) * p.sizeMul,
    })
  }

  const maxLifetime = p.timeout

  let raf = 0
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let alive = false
    for (const pt of particles) {
      if (pt.life <= 0) continue
      alive = true
      pt.x += pt.vx
      pt.y += pt.vy
      pt.vy += p.gravity
      pt.vx *= 0.985
      pt.r += pt.spin
      pt.life -= p.decay
      ctx.save()
      ctx.translate(pt.x, pt.y)
      ctx.rotate(pt.r)
      ctx.globalAlpha = Math.max(0, pt.life)
      ctx.fillStyle = pt.color
      ctx.fillRect(-pt.w / 2, -pt.h / 2, pt.w, pt.h)
      ctx.restore()
    }
    if (alive) {
      raf = requestAnimationFrame(tick)
    } else {
      canvas.remove()
    }
  }
  raf = requestAnimationFrame(tick)

  // Safety cleanup
  setTimeout(() => {
    cancelAnimationFrame(raf)
    if (canvas.parentNode) canvas.remove()
  }, maxLifetime)
}

/**
 * CTA button linking to the Hire-Zak ChatGPT GPT.
 * Subtle rainbow border, confetti on hover.
 *  • Every hover → confetti
 *  • Every 10th  → MEGA explosion
 *  • Every 100th → ULTRA explosion (1000× mega)
 *
 * Variants:
 *  • `"hero"` (default) – compact inline button
 *  • `"banner"` – wider standalone treatment
 */
export default function ChatGptCta({ variant = 'hero' }: { variant?: 'hero' | 'banner' }) {
  const hoverCountRef = useRef(0)

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    hoverCountRef.current += 1
    const n = hoverCountRef.current
    const tier: ConfettiTier =
      n % ULTRA_THRESHOLD === 0 ? 'ultra' :
      n % MEGA_THRESHOLD === 0  ? 'mega'  :
                                  'normal'
    spawnConfetti(e.currentTarget, tier)
  }, [])

  return (
    <a
      href={CHATGPT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`chatgpt-cta ${variant === 'banner' ? 'chatgpt-cta--banner' : ''}`}
      onMouseEnter={handleMouseEnter}
    >
      <span className="chatgpt-cta__icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </span>
      <span className="chatgpt-cta__label">Ask on ChatGPT</span>
      <span className="chatgpt-cta__arrow" aria-hidden="true">→</span>
    </a>
  )
}
