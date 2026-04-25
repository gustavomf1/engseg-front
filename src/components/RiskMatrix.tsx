import { useEffect, useState } from 'react'

export interface RiskMatrixReincidencia {
  id: string | number
  severidade: number   // 1..5
  probabilidade: number // 1..4
  data?: string
  titulo?: string
}

export interface RiskMatrixProps {
  severidade: number      // 1..5
  probabilidade: number   // 1..4
  reincidencias?: RiskMatrixReincidencia[]
  dark?: boolean
  size?: number           // default 260
}

type RiskLevel = 'BAIXO' | 'MODERADO' | 'ALTO' | 'CRITICO'

const RISK_MAP: Record<number, Record<number, RiskLevel>> = {
  1: { 1: 'BAIXO',    2: 'BAIXO',    3: 'BAIXO',   4: 'MODERADO' },
  2: { 1: 'BAIXO',    2: 'BAIXO',    3: 'MODERADO', 4: 'ALTO'    },
  3: { 1: 'BAIXO',    2: 'MODERADO', 3: 'ALTO',     4: 'CRITICO' },
  4: { 1: 'BAIXO',    2: 'MODERADO', 3: 'ALTO',     4: 'CRITICO' },
  5: { 1: 'MODERADO', 2: 'ALTO',     3: 'ALTO',     4: 'CRITICO' },
}

function getLevel(s: number, p: number): RiskLevel {
  return RISK_MAP[s]?.[p] ?? 'BAIXO'
}

interface CellColors { fill: string; dot: string }

function cellColors(level: RiskLevel, dark: boolean): CellColors {
  switch (level) {
    case 'BAIXO':    return { fill: dark ? '#065f46' : '#d1fae5', dot: '#10b981' }
    case 'MODERADO': return { fill: dark ? '#854d0e' : '#fef3c7', dot: '#f59e0b' }
    case 'ALTO':     return { fill: dark ? '#9a3412' : '#fed7aa', dot: '#f97316' }
    case 'CRITICO':  return { fill: dark ? '#7f1d1d' : '#fecaca', dot: '#ef4444' }
  }
}

export function RiskMatrix({
  severidade,
  probabilidade,
  reincidencias = [],
  dark = false,
  size = 260,
}: RiskMatrixProps) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    setPhase(0)
    const t1 = setTimeout(() => setPhase(1), 100)
    const t2 = setTimeout(() => setPhase(2), 700)
    const t3 = setTimeout(() => setPhase(3), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [severidade, probabilidade])

  const cell = size / 4.5
  const gap = 4
  const padL = 32
  const padB = 28
  const cols = 4
  const rows = 5
  const W = padL + cols * cell + (cols - 1) * gap + 12
  const H = rows * cell + (rows - 1) * gap + padB + 12

  const xFor = (p: number) => padL + (p - 1) * (cell + gap) + cell / 2
  const yFor = (s: number) => (rows - s) * (cell + gap) + cell / 2 + 6

  const dotR = cell * 0.18
  const curX = xFor(probabilidade)
  const curY = yFor(severidade)

  // build trail path through reincidencias to current
  const trailPoints = [...reincidencias.map(r => ({ x: xFor(r.probabilidade), y: yFor(r.severidade) })), { x: curX, y: curY }]

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <style>{`
          @keyframes rmPulse {
            0%, 100% { r: ${dotR}; opacity: 1; }
            50% { r: ${dotR * 1.45}; opacity: 0.75; }
          }
          @keyframes rmDash {
            to { stroke-dashoffset: 0; }
          }
          .rm-pulse { animation: rmPulse 1.4s ease-in-out infinite; }
        `}</style>
      </defs>

      {/* Y-axis label */}
      <text
        x={10}
        y={H / 2 - padB / 2}
        textAnchor="middle"
        transform={`rotate(-90, 10, ${H / 2 - padB / 2})`}
        fontSize={9}
        fill={dark ? '#94a3b8' : '#64748b'}
        letterSpacing={1.5}
        fontWeight={600}
      >
        SEVERIDADE
      </text>

      {/* X-axis label */}
      <text
        x={padL + (cols * cell + (cols - 1) * gap) / 2}
        y={H - 2}
        textAnchor="middle"
        fontSize={9}
        fill={dark ? '#94a3b8' : '#64748b'}
        letterSpacing={1.5}
        fontWeight={600}
      >
        PROBABILIDADE
      </text>

      {/* Y-axis ticks 1–5 */}
      {[1, 2, 3, 4, 5].map(s => (
        <text
          key={`ytick-${s}`}
          x={padL - 5}
          y={yFor(s) + 4}
          textAnchor="end"
          fontSize={8}
          fill={dark ? '#94a3b8' : '#94a3b8'}
        >
          {s}
        </text>
      ))}

      {/* X-axis ticks 1–4 */}
      {[1, 2, 3, 4].map(p => (
        <text
          key={`xtick-${p}`}
          x={xFor(p)}
          y={H - padB + 10}
          textAnchor="middle"
          fontSize={8}
          fill={dark ? '#94a3b8' : '#94a3b8'}
        >
          {p}
        </text>
      ))}

      {/* Grid cells */}
      {[1, 2, 3, 4, 5].map(s =>
        [1, 2, 3, 4].map(p => {
          const level = getLevel(s, p)
          const { fill } = cellColors(level, dark)
          const cx = padL + (p - 1) * (cell + gap)
          const cy = (rows - s) * (cell + gap) + 6
          return (
            <rect
              key={`cell-${s}-${p}`}
              x={cx}
              y={cy}
              width={cell}
              height={cell}
              rx={4}
              fill={fill}
              opacity={phase >= 1 ? 1 : 0}
              style={{ transition: 'opacity 0.4s ease' }}
            />
          )
        })
      )}

      {/* Dashed trails (phase 2) */}
      {phase >= 2 && trailPoints.length >= 2 && (() => {
        const d = trailPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ')
        const totalLen = trailPoints.reduce((acc, pt, i) => {
          if (i === 0) return 0
          const prev = trailPoints[i - 1]
          return acc + Math.sqrt((pt.x - prev.x) ** 2 + (pt.y - prev.y) ** 2)
        }, 0)
        return (
          <path
            d={d}
            fill="none"
            stroke={dark ? '#94a3b8' : '#64748b'}
            strokeWidth={1.5}
            strokeDasharray={`5 4`}
            strokeDashoffset={totalLen}
            strokeLinecap="round"
            style={{
              animation: `rmDash 0.6s ease forwards`,
              animationDelay: '0ms',
            }}
          />
        )
      })()}

      {/* Reincidência hollow dots (phase 2) */}
      {phase >= 2 && reincidencias.map((r) => {
        const rx = xFor(r.probabilidade)
        const ry = yFor(r.severidade)
        const level = getLevel(r.severidade, r.probabilidade)
        const { dot } = cellColors(level, dark)
        return (
          <circle
            key={`reinc-${r.id}`}
            cx={rx}
            cy={ry}
            r={dotR}
            fill="none"
            stroke={dot}
            strokeWidth={2}
            opacity={0.8}
          />
        )
      })}

      {/* Current position pulsing dot (phase 3) */}
      {phase >= 3 && (() => {
        const level = getLevel(severidade, probabilidade)
        const { dot } = cellColors(level, dark)
        return (
          <>
            {/* outer glow ring */}
            <circle cx={curX} cy={curY} r={dotR * 1.8} fill={dot} opacity={0.2} />
            {/* pulsing core */}
            <circle
              cx={curX}
              cy={curY}
              r={dotR}
              fill={dot}
              className="rm-pulse"
            />
          </>
        )
      })()}
    </svg>
  )
}
