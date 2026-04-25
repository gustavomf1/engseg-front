import { NivelRisco } from '../types'

// Índice [severidade 1-5][probabilidade 1-4]
const MATRIZ: NivelRisco[][] = [
  [],  // severidade 0 — não usada
  ['' as NivelRisco, 'BAIXO',    'BAIXO',    'BAIXO',    'MODERADO'], // S=1
  ['' as NivelRisco, 'BAIXO',    'BAIXO',    'MODERADO', 'ALTO'    ], // S=2
  ['' as NivelRisco, 'BAIXO',    'MODERADO', 'ALTO',     'CRITICO' ], // S=3
  ['' as NivelRisco, 'BAIXO',    'MODERADO', 'ALTO',     'CRITICO' ], // S=4
  ['' as NivelRisco, 'MODERADO', 'ALTO',     'ALTO',     'CRITICO' ], // S=5
]

export function calcularNivelRisco(severidade: number, probabilidade: number): NivelRisco {
  return MATRIZ[severidade][probabilidade]
}

export const LABELS_SEVERIDADE: Record<number, string> = {
  1: '1 - Insignificante',
  2: '2 - Menor',
  3: '3 - Moderada',
  4: '4 - Maior',
  5: '5 - Catastrófica',
}

export const LABELS_PROBABILIDADE: Record<number, string> = {
  1: '1 - Rara',
  2: '2 - Improvável',
  3: '3 - Possível',
  4: '4 - Provável',
}
