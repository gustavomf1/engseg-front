import './nc-risk-matrix.css'
import type { CSSProperties } from 'react'

interface Props {
  severidade: number
  probabilidade: number
}

const cellLevel = (s: number, p: number) => {
  const v = s * p
  if (v <= 4) return 'low'
  if (v <= 9) return 'med'
  if (v <= 16) return 'high'
  return 'crit'
}

const meta = {
  low:  { label: 'Baixo',    color: '#15803d', bg: '#dcfce7' },
  med:  { label: 'Moderado', color: '#a16207', bg: '#fef9c3' },
  high: { label: 'Alto',     color: '#c2410c', bg: '#ffedd5' },
  crit: { label: 'Crítico',  color: '#b91c1c', bg: '#fee2e2' },
}

export default function NcRiskMatrix({ severidade, probabilidade }: Props) {
  const sev = Number(severidade) || 0
  const prob = Number(probabilidade) || 0
  const score = sev * prob
  const hasValue = sev > 0 && prob > 0
  const overall = hasValue ? cellLevel(sev, prob) : 'low'
  const m = meta[overall]

  return (
    <div className="nc-risk-matrix">
      <div className="nc-risk-matrix-grid">
        <div className="nc-risk-axis nc-risk-axis-y">PROBABILIDADE</div>
        <div className="nc-risk-axis nc-risk-axis-x">SEVERIDADE →</div>
        <div className="nc-risk-cells">
          {[4, 3, 2, 1].map(p => (
            <div key={p} className="nc-risk-row">
              <span className="nc-risk-row-num">{p}</span>
              {[1, 2, 3, 4, 5].map(s => {
                const lvl = cellLevel(s, p)
                const active = hasValue && s === sev && p === prob
                return (
                  <div key={s} className={`nc-risk-cell nc-risk-${lvl} ${active ? 'active' : ''}`}>
                    {active && <span className="nc-risk-cell-dot" />}
                    <span>{s * p}</span>
                  </div>
                )
              })}
            </div>
          ))}
          <div className="nc-risk-col-nums">
            <span />
            {[1, 2, 3, 4, 5].map(n => <span key={n}>{n}</span>)}
          </div>
        </div>
      </div>

      {hasValue && (
        <div
          className="nc-risk-readout"
          style={{ '--rk-color': m.color, '--rk-bg': m.bg } as CSSProperties}
        >
          <div className="nc-risk-readout-num">
            <span className="nc-risk-score" key={score}>{score}</span>
            <span className="nc-risk-score-of">/20</span>
          </div>
          <div className="nc-risk-readout-label">
            <span className="nc-risk-readout-tag" style={{ background: m.bg, color: m.color }}>
              Nível {m.label}
            </span>
            <span className="nc-risk-readout-formula">{sev} × {prob}</span>
          </div>
        </div>
      )}
    </div>
  )
}
