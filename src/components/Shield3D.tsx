// src/components/Shield3D.tsx
import { useEffect, useRef, useState } from 'react'

type Palette = 'brand' | 'slate' | 'amber' | 'emerald'

interface Shield3DProps {
  size?: number
  palette?: Palette
  interactive?: boolean
}

const PALETTES: Record<Palette, {
  face: string; deep: string; edge: string; spec: string; glow: string
}> = {
  brand:   { face: '#4f46e5', deep: '#312e81', edge: '#1e1b4b', spec: '#e0e7ff', glow: '#818cf8' },
  slate:   { face: '#334155', deep: '#1e293b', edge: '#0f172a', spec: '#e2e8f0', glow: '#94a3b8' },
  amber:   { face: '#d97706', deep: '#92400e', edge: '#451a03', spec: '#fef3c7', glow: '#fbbf24' },
  emerald: { face: '#059669', deep: '#065f46', edge: '#022c22', spec: '#d1fae5', glow: '#34d399' },
}

const SHIELD_D = 'M 100 8 L 185 32 Q 190 32 190 40 L 190 120 Q 190 170 100 212 Q 10 170 10 120 L 10 40 Q 10 32 15 32 Z'
const INNER_D  = 'M 100 22 L 170 42 Q 174 42 174 48 L 174 118 Q 174 158 100 194 Q 26 158 26 118 L 26 48 Q 26 42 30 42 Z'

export default function Shield3D({ size = 280, palette = 'brand', interactive = true }: Shield3DProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hover, setHover] = useState(false)
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.3 })

  useEffect(() => {
    if (!interactive) return
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return
      const y = Math.max(-20, Math.min(20, e.gamma))
      const x = Math.max(-18, Math.min(18, e.beta - 40))
      setTilt({ x: -x, y })
    }
    window.addEventListener('deviceorientation', onOrient)
    return () => window.removeEventListener('deviceorientation', onOrient)
  }, [interactive])

  const handleMove = (clientX: number, clientY: number) => {
    if (!ref.current || !interactive) return
    const r = ref.current.getBoundingClientRect()
    const px = (clientX - r.left) / r.width
    const py = (clientY - r.top) / r.height
    setPointer({ x: px, y: py })
    setTilt({ x: (0.5 - py) * 30, y: (px - 0.5) * 40 })
  }

  const p = PALETTES[palette]
  const lightX = pointer.x * 100
  const lightY = pointer.y * 100

  return (
    <div
      ref={ref}
      style={{
        width: size, height: size * 1.1, perspective: '1200px', perspectiveOrigin: '50% 50%',
        display: 'inline-block', userSelect: 'none', cursor: interactive ? 'grab' : 'default',
      }}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setTilt({ x: 0, y: 0 }); setPointer({ x: 0.5, y: 0.3 }) }}
      onTouchMove={(e) => { if (e.touches.length) handleMove(e.touches[0].clientX, e.touches[0].clientY) }}
      onTouchEnd={() => { setTilt({ x: 0, y: 0 }); setPointer({ x: 0.5, y: 0.3 }) }}
    >
      <div style={{
        width: '100%', height: '100%', position: 'relative',
        transformStyle: 'preserve-3d',
        transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: hover ? 'transform 80ms linear' : 'transform 600ms cubic-bezier(.2,.9,.3,1.2)',
      }}>
        {/* ground shadow */}
        <div style={{
          position: 'absolute', bottom: '-6%', left: '10%', right: '10%', height: '16%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%)',
          transform: 'translateZ(-80px) rotateX(75deg)',
          filter: 'blur(10px)', pointerEvents: 'none',
        }} />

        {/* halo glow */}
        <div style={{
          position: 'absolute', inset: '-8%', borderRadius: '50%',
          background: `radial-gradient(circle, ${p.glow}66 0%, transparent 60%)`,
          transform: 'translateZ(-40px)',
          filter: 'blur(22px)', pointerEvents: 'none',
        }} />

        {/* back layer */}
        <BackShield d={SHIELD_D} fill={p.edge} translateZ={-20} scale={0.98} />
        {/* middle layer */}
        <BackShield d={SHIELD_D} fill={p.deep} translateZ={-10} scale={0.99} />

        {/* main face */}
        <svg viewBox="0 0 200 220" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          transform: 'translateZ(0px)',
          filter: `drop-shadow(0 8px 16px ${p.edge}80)`,
          overflow: 'visible',
        }}>
          <defs>
            <linearGradient id={`face-${palette}`} x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor={p.glow} />
              <stop offset="45%" stopColor={p.face} />
              <stop offset="100%" stopColor={p.deep} />
            </linearGradient>
            <radialGradient id={`spec-${palette}`} cx={`${lightX}%`} cy={`${lightY}%`} r="40%">
              <stop offset="0%" stopColor={p.spec} stopOpacity="0.7" />
              <stop offset="60%" stopColor={p.spec} stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d={SHIELD_D} fill={`url(#face-${palette})`} stroke={p.edge} strokeWidth="1.5" />
          <path d={SHIELD_D} fill={`url(#spec-${palette})`} style={{ mixBlendMode: 'screen' }} />
          <path d={INNER_D} fill="none" stroke={p.spec} strokeOpacity="0.3" strokeWidth="1" />
          <g transform="translate(100, 112)">
            <path d="M -30 0 L -10 22 L 32 -26"
                  fill="none" stroke={p.spec} strokeWidth="7"
                  strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
            <path d="M -30 0 L -10 22 L 32 -26"
                  fill="none" stroke={p.edge} strokeWidth="3"
                  strokeLinecap="round" strokeLinejoin="round" opacity="0.4"
                  transform="translate(1, 2)" />
          </g>
          <circle cx="100" cy="112" r="56" fill="none" stroke={p.spec} strokeOpacity="0.18" strokeWidth="1" />
          {[[35, 50], [165, 50], [100, 195]].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="2.5" fill={p.edge} opacity="0.6" />
              <circle cx={cx - 0.8} cy={cy - 0.8} r="1" fill={p.spec} opacity="0.7" />
            </g>
          ))}
        </svg>

        {/* rim light */}
        <svg viewBox="0 0 200 220" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          transform: 'translateZ(3px)', pointerEvents: 'none', overflow: 'visible',
        }}>
          <defs>
            <linearGradient id={`rim-${palette}`} x1="0%" y1="0%" x2="100%" y2="100%"
              gradientTransform={`rotate(${(pointer.x - 0.5) * 80} 0.5 0.5)`}>
              <stop offset="0%" stopColor={p.spec} stopOpacity="0.95" />
              <stop offset="45%" stopColor={p.spec} stopOpacity="0" />
              <stop offset="100%" stopColor={p.spec} stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <path d={SHIELD_D} fill="none" stroke={`url(#rim-${palette})`} strokeWidth="2" />
        </svg>
      </div>
    </div>
  )
}

function BackShield({ d, fill, translateZ = 0, scale = 1 }: {
  d: string; fill: string; translateZ?: number; scale?: number
}) {
  return (
    <svg viewBox="0 0 200 220" style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      transform: `translateZ(${translateZ}px) scale(${scale})`,
      filter: translateZ < -5 ? `blur(${Math.abs(translateZ) * 0.12}px)` : undefined,
      overflow: 'visible',
    }}>
      <path d={d} fill={fill} />
    </svg>
  )
}
