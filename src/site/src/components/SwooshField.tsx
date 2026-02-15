import { useEffect, useMemo, useRef } from 'react'

type Props = {
  enabled?: boolean
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export default function SwooshField({ enabled = true }: Props) {
  const reduceMotion = useMemo(() => prefersReducedMotion(), [])
  const fieldRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled || reduceMotion) return
    const el = fieldRef.current
    if (!el) return

    let raf = 0
    let last = 0
    let targetX = 0
    let targetY = 0
    let curX = 0
    let curY = 0

    const onPointerMove = (e: PointerEvent) => {
      const x = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1
      const y = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1
      targetX = x
      targetY = y
    }

    const onScroll = () => {
      // just to keep animation “alive” on scroll-only devices
      last = performance.now()
    }

    let lastRender = 0
    const step = (t: number) => {
      raf = requestAnimationFrame(step)
      // Throttle to ~24fps — swoosh motion is slow, doesn't need 60fps
      if (t - lastRender < 42) return
      lastRender = t

      const dt = Math.min(48, t - last)
      last = t

      // critically damped-ish follow
      const k = 0.010
      curX += (targetX - curX) * (1 - Math.exp(-k * dt))
      curY += (targetY - curY) * (1 - Math.exp(-k * dt))

      const scroll = window.scrollY || 0
      const h = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const p = Math.max(0, Math.min(1, scroll / h))

      const px = (curX * 22).toFixed(2)
      const py = (curY * 18).toFixed(2)

      // more movement as you scroll down
      const s1 = (p * 46 + 8).toFixed(0)
      const s2 = (p * -56 - 10).toFixed(0)
      const s3 = (p * 62 + 6).toFixed(0)

      const s = el.style
      s.setProperty('--sx', `${px}px`)
      s.setProperty('--sy', `${py}px`)
      s.setProperty('--s1', `${s1}px`)
      s.setProperty('--s2', `${s2}px`)
      s.setProperty('--s3', `${s3}px`)
      s.setProperty('--sp', p.toFixed(3))
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    raf = requestAnimationFrame((t) => {
      last = t
      raf = requestAnimationFrame(step)
    })

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [enabled, reduceMotion])

  return (
    <div
      ref={fieldRef}
      className="swooshField"
      aria-hidden="true"
      style={{
        opacity: enabled && !reduceMotion ? 1 : 0,
      }}
    >
      <div className="swoosh swooshA" />
      <div className="swoosh swooshB" />
      <div className="swoosh swooshC" />
      <div className="swoosh swooshD" />
      <div className="sparkleDust" />
    </div>
  )
}
