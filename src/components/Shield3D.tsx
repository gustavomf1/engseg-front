import { useRef, useEffect } from 'react'

interface Shield3DProps {
  size?: number
  className?: string
}

// Heraldic shield outline with subtle scallop on top (19 pts)
const OUTLINE: [number, number][] = [
  [-0.75, -0.98],
  [-0.55, -1.00],
  [-0.30, -1.00],
  [-0.10, -0.93],
  [ 0.10, -0.93],
  [ 0.30, -1.00],
  [ 0.55, -1.00],
  [ 0.75, -0.98],
  [ 1.00, -0.50],
  [ 0.95, -0.05],
  [ 0.82,  0.35],
  [ 0.55,  0.68],
  [ 0.25,  0.92],
  [ 0.00,  1.02],
  [-0.25,  0.92],
  [-0.55,  0.68],
  [-0.82,  0.35],
  [-0.95, -0.05],
  [-1.00, -0.50],
]

function scaleOutline(pts: [number, number][], s: number): [number, number][] {
  return pts.map(([x, y]) => [x * s, y * s] as [number, number])
}

const OUTLINE_CHANNEL = scaleOutline(OUTLINE, 0.86)
const OUTLINE_PLATE = scaleOutline(OUTLINE, 0.78)

const LIGHT_RAW: [number, number, number] = [0.42, -0.55, 0.72]
const LLEN = Math.sqrt(LIGHT_RAW[0] ** 2 + LIGHT_RAW[1] ** 2 + LIGHT_RAW[2] ** 2)
const LIGHT: [number, number, number] = [LIGHT_RAW[0] / LLEN, LIGHT_RAW[1] / LLEN, LIGHT_RAW[2] / LLEN]

function rotYX(
  x: number, y: number, z: number,
  rx: number, ry: number,
): [number, number, number] {
  const x1 = x * Math.cos(ry) + z * Math.sin(ry)
  const z1 = -x * Math.sin(ry) + z * Math.cos(ry)
  const y2 = y * Math.cos(rx) - z1 * Math.sin(rx)
  const z2 = y * Math.sin(rx) + z1 * Math.cos(rx)
  return [x1, y2, z2]
}

function dot3(a: [number, number, number], b: [number, number, number]) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function Shield3D({ size = 380, className }: Shield3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const SCALE = size * 0.34
    const DEPTH = 0.24
    const CX = size / 2
    const CY = size / 2
    const FOV = 3.4

    let rotX = 0.22
    let rotY = -0.42
    let velX = 0
    let velY = 0.006
    let dragging = false
    let lastMX = 0, lastMY = 0
    let autoRotate = true
    let idleTimer = 0
    let rafId = 0

    function project(x: number, y: number, z: number): [number, number] {
      const pz = z + FOV
      return [CX + (x * SCALE * FOV) / pz, CY + (y * SCALE * FOV) / pz]
    }

    function tracePath(pts: [number, number][]) {
      ctx.beginPath()
      ctx.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
      ctx.closePath()
    }

    function projectOutline(outline: [number, number][], zVal: number): [number, number][] {
      return outline.map(([x, y]) => {
        const [rx, ry, rz] = rotYX(x, y, zVal, rotX, rotY)
        return project(rx, ry, rz)
      })
    }

    type FaceType = 'front' | 'back' | 'side'
    interface FaceData {
      type: FaceType
      pts: [number, number][]
      avgZ: number
      light: number
    }

    function buildFaces(): FaceData[] {
      const n = OUTLINE.length
      const frontWorld = OUTLINE.map(([x, y]) => rotYX(x, y,  DEPTH / 2, rotX, rotY))
      const backWorld  = OUTLINE.map(([x, y]) => rotYX(x, y, -DEPTH / 2, rotX, rotY))
      const frontPts = frontWorld.map(([x, y, z]) => project(x, y, z))
      const backPts  = backWorld.map(([x, y, z]) => project(x, y, z))

      const faces: FaceData[] = []

      const fNorm = rotYX(0, 0, 1, rotX, rotY)
      faces.push({
        type: 'front',
        pts: frontPts,
        avgZ: frontWorld.reduce((s, p) => s + p[2], 0) / n,
        light: Math.max(0, dot3(fNorm, LIGHT)),
      })

      const bNorm = rotYX(0, 0, -1, rotX, rotY)
      faces.push({
        type: 'back',
        pts: backPts,
        avgZ: backWorld.reduce((s, p) => s + p[2], 0) / n,
        light: Math.max(0, dot3(bNorm, LIGHT)),
      })

      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n
        const [x0, y0] = OUTLINE[i]
        const [x1, y1] = OUTLINE[j]
        const ex = x1 - x0, ey = y1 - y0
        const el = Math.sqrt(ex * ex + ey * ey)
        const sNorm = rotYX(ey / el, -ex / el, 0, rotX, rotY)
        faces.push({
          type: 'side',
          pts: [frontPts[i], frontPts[j], backPts[j], backPts[i]],
          avgZ: (frontWorld[i][2] + frontWorld[j][2] + backWorld[i][2] + backWorld[j][2]) / 4,
          light: Math.max(0, dot3(sNorm, LIGHT)),
        })
      }

      return faces.sort((a, b) => a.avgZ - b.avgZ)
    }

    function lerp(a: number, b: number, t: number) {
      return Math.round(a + (b - a) * t)
    }

    function drawFront(face: FaceData) {
      const l = face.light
      const pts = face.pts

      // Layer 1: Outer bevel frame
      tracePath(pts)
      const outerGrad = ctx.createRadialGradient(
        CX - SCALE * 0.35, CY - SCALE * 0.45, SCALE * 0.02,
        CX + SCALE * 0.2, CY + SCALE * 0.3, SCALE * 1.3,
      )
      outerGrad.addColorStop(0,    `rgb(${lerp(25, 60, l)},${lerp(65, 115, l)},${lerp(120, 175, l)})`)
      outerGrad.addColorStop(0.25, `rgb(${lerp(14, 32, l)},${lerp(42, 70, l)},${lerp(82, 120, l)})`)
      outerGrad.addColorStop(0.65, `rgb(${lerp(7, 14, l)}, ${lerp(22, 35, l)},${lerp(45, 65, l)})`)
      outerGrad.addColorStop(1,    `rgb(${lerp(3, 6, l)},  ${lerp(11, 16, l)},${lerp(22, 30, l)})`)
      ctx.fillStyle = outerGrad
      ctx.fill()

      ctx.strokeStyle = `rgba(147, 197, 253, ${0.35 + l * 0.45})`
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Layer 2: Recessed channel
      const channelPts = projectOutline(OUTLINE_CHANNEL, DEPTH / 2)
      tracePath(channelPts)
      const channelGrad = ctx.createRadialGradient(CX, CY, SCALE * 0.2, CX, CY, SCALE * 0.95)
      channelGrad.addColorStop(0,   `rgb(${lerp(8, 16, l)}, ${lerp(22, 32, l)},${lerp(42, 58, l)})`)
      channelGrad.addColorStop(0.7, `rgb(${lerp(3, 5, l)},  ${lerp(10, 14, l)},${lerp(22, 28, l)})`)
      channelGrad.addColorStop(1,   `rgb(${lerp(1, 2, l)},  ${lerp(4, 6, l)},  ${lerp(10, 14, l)})`)
      ctx.fillStyle = channelGrad
      ctx.fill()

      ctx.strokeStyle = `rgba(0,0,0,${0.55 + l * 0.15})`
      ctx.lineWidth = 2
      ctx.stroke()

      // Layer 3: Inner plate
      const platePts = projectOutline(OUTLINE_PLATE, DEPTH / 2)
      tracePath(platePts)
      const plateGrad = ctx.createRadialGradient(
        CX - SCALE * 0.12, CY - SCALE * 0.20, SCALE * 0.02,
        CX, CY, SCALE * 0.85,
      )
      plateGrad.addColorStop(0,    `rgb(${lerp(22, 52, l)},${lerp(55, 100, l)},${lerp(105, 160, l)})`)
      plateGrad.addColorStop(0.45, `rgb(${lerp(11, 22, l)},${lerp(32, 52, l)},${lerp(68, 95, l)})`)
      plateGrad.addColorStop(1,    `rgb(${lerp(5, 10, l)}, ${lerp(18, 28, l)},${lerp(38, 55, l)})`)
      ctx.fillStyle = plateGrad
      ctx.fill()

      ctx.strokeStyle = `rgba(147, 197, 253, ${0.25 + l * 0.35})`
      ctx.lineWidth = 1
      ctx.stroke()

      // Blue inner glow on plate
      ctx.save()
      tracePath(platePts)
      ctx.clip()
      const glow = ctx.createRadialGradient(CX, CY - SCALE * 0.05, 0, CX, CY, SCALE * 0.65)
      glow.addColorStop(0,    'rgba(56, 189, 248, 0.18)')
      glow.addColorStop(0.55, 'rgba(3, 105, 161, 0.08)')
      glow.addColorStop(1,    'rgba(3, 105, 161, 0)')
      ctx.fillStyle = glow
      ctx.fill()
      ctx.restore()

      // Emblem (brushed silver "E") with perspective transform
      drawEmblem()

      // Specular streak
      ctx.save()
      tracePath(pts)
      ctx.clip()
      const spec = ctx.createLinearGradient(
        CX - SCALE * 0.75, CY - SCALE * 0.95,
        CX - SCALE * 0.05, CY - SCALE * 0.10,
      )
      spec.addColorStop(0,    `rgba(255,255,255,${0.12 + l * 0.10})`)
      spec.addColorStop(0.55, 'rgba(255,255,255,0.02)')
      spec.addColorStop(1,    'rgba(255,255,255,0)')
      ctx.fillStyle = spec
      ctx.fill()
      ctx.restore()
    }

    function drawEmblem() {
      const A  = project(...rotYX(0, 0, DEPTH / 2, rotX, rotY))
      const Bx = project(...rotYX(1, 0, DEPTH / 2, rotX, rotY))
      const By = project(...rotYX(0, 1, DEPTH / 2, rotX, rotY))

      const ax = Bx[0] - A[0], ay = Bx[1] - A[1]
      const dx = By[0] - A[0], dy = By[1] - A[1]

      const S = 200
      ctx.save()
      ctx.setTransform(ax / S, ay / S, dx / S, dy / S, A[0], A[1])

      // Top decorative bar
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.28)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(-45, -104)
      ctx.lineTo( 45, -104)
      ctx.stroke()

      // Small diamond marker
      ctx.fillStyle = 'rgba(186, 230, 253, 0.45)'
      ctx.beginPath()
      ctx.moveTo(0, -112); ctx.lineTo(4, -108); ctx.lineTo(0, -104); ctx.lineTo(-4, -108)
      ctx.closePath()
      ctx.fill()

      // Drop shadow for embossed E
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
      ctx.filter = 'blur(3px)'
      ctx.font = 'bold 140px Georgia, "Times New Roman", serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('E', 4, 4)
      ctx.filter = 'none'

      // Brushed silver gradient E
      const silver = ctx.createLinearGradient(0, -70, 0, 70)
      silver.addColorStop(0,    '#f5f7fa')
      silver.addColorStop(0.15, '#e2e7ee')
      silver.addColorStop(0.32, '#b4bcc7')
      silver.addColorStop(0.48, '#9ba4b0')
      silver.addColorStop(0.58, '#a8b1bd')
      silver.addColorStop(0.72, '#dde2ea')
      silver.addColorStop(0.88, '#aab3bf')
      silver.addColorStop(1,    '#7c8693')
      ctx.fillStyle = silver
      ctx.fillText('E', 0, 0)

      // Top highlight on letter
      ctx.globalCompositeOperation = 'source-atop'
      const topHi = ctx.createLinearGradient(0, -65, 0, -45)
      topHi.addColorStop(0, 'rgba(255,255,255,0.55)')
      topHi.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = topHi
      ctx.fillRect(-60, -65, 120, 25)

      // Brushed metal texture inside letter
      for (let y = -58; y <= 58; y += 1.5) {
        const v = Math.sin(y * 12.7) * 0.5 + 0.5
        ctx.fillStyle = `rgba(0, 0, 0, ${0.015 + v * 0.035})`
        ctx.fillRect(-60, y, 120, 0.6)
      }
      for (let y = -58; y <= 58; y += 2.3) {
        const v = Math.sin(y * 29.1 + 1.7) * 0.5 + 0.5
        ctx.fillStyle = `rgba(255, 255, 255, ${0.01 + v * 0.025})`
        ctx.fillRect(-60, y, 120, 0.4)
      }
      ctx.globalCompositeOperation = 'source-over'

      // Divider line
      const divGrad = ctx.createLinearGradient(-50, 0, 50, 0)
      divGrad.addColorStop(0,   'rgba(3, 105, 161, 0)')
      divGrad.addColorStop(0.5, 'rgba(186, 230, 253, 0.55)')
      divGrad.addColorStop(1,   'rgba(3, 105, 161, 0)')
      ctx.strokeStyle = divGrad
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(-50, 86)
      ctx.lineTo( 50, 86)
      ctx.stroke()

      // Wordmark
      ctx.font = '600 14px "Inter", system-ui, sans-serif'
      ctx.fillStyle = 'rgba(186, 230, 253, 0.65)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('E N G S E G', 0, 100)

      ctx.restore()
    }

    function drawBack(face: FaceData) {
      tracePath(face.pts)
      const l = face.light
      const bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, SCALE)
      bg.addColorStop(0, `rgb(${lerp(8, 18, l)},${lerp(20, 30, l)},${lerp(38, 52, l)})`)
      bg.addColorStop(1, `rgb(${lerp(2, 5, l)}, ${lerp(8, 12, l)}, ${lerp(16, 22, l)})`)
      ctx.fillStyle = bg
      ctx.fill()
      ctx.strokeStyle = 'rgba(3, 105, 161, 0.22)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    function drawSide(face: FaceData) {
      tracePath(face.pts)
      const l = face.light
      const ambient = 0.06
      const t = ambient + l * 0.75
      ctx.fillStyle = `rgb(${lerp(4, 28, t)},${lerp(20, 62, t)},${lerp(42, 100, t)})`
      ctx.fill()
      ctx.strokeStyle = `rgba(3, 105, 161, ${0.14 + l * 0.32})`
      ctx.lineWidth = 0.5
      ctx.stroke()
    }

    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, size, size)
      for (const face of buildFaces()) {
        if (face.type === 'front') drawFront(face)
        else if (face.type === 'back') drawBack(face)
        else drawSide(face)
      }
    }

    // Input
    function onDown(mx: number, my: number) {
      dragging = true
      autoRotate = false
      clearTimeout(idleTimer)
      lastMX = mx; lastMY = my
      velX = 0; velY = 0
    }

    function onMove(mx: number, my: number) {
      if (!dragging) return
      const dx = mx - lastMX
      const dy = my - lastMY
      rotY += dx * 0.013
      rotX += dy * 0.013
      rotX = Math.max(-Math.PI * 0.46, Math.min(Math.PI * 0.46, rotX))
      velX = dy * 0.013
      velY = dx * 0.013
      lastMX = mx; lastMY = my
      draw()
    }

    function onUp() {
      dragging = false
      idleTimer = window.setTimeout(() => { autoRotate = true }, 2800)
    }

    const mouseDown = (e: MouseEvent) => onDown(e.clientX, e.clientY)
    const mouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const mouseUp = () => onUp()
    const touchStart = (e: TouchEvent) => { e.preventDefault(); onDown(e.touches[0].clientX, e.touches[0].clientY) }
    const touchMove  = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
    const touchEnd   = () => onUp()

    canvas.addEventListener('mousedown', mouseDown)
    window.addEventListener('mousemove', mouseMove)
    window.addEventListener('mouseup', mouseUp)
    canvas.addEventListener('touchstart', touchStart, { passive: false })
    canvas.addEventListener('touchmove',  touchMove,  { passive: false })
    canvas.addEventListener('touchend',   touchEnd)

    function animate() {
      if (!dragging) {
        if (autoRotate) {
          rotY += 0.008
          draw()
        } else if (Math.abs(velX) > 0.0005 || Math.abs(velY) > 0.0005) {
          velX *= 0.91
          velY *= 0.91
          rotX += velX
          rotY += velY
          rotX = Math.max(-Math.PI * 0.46, Math.min(Math.PI * 0.46, rotX))
          draw()
        }
      }
      rafId = requestAnimationFrame(animate)
    }

    draw()
    animate()

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(idleTimer)
      canvas.removeEventListener('mousedown', mouseDown)
      window.removeEventListener('mousemove', mouseMove)
      window.removeEventListener('mouseup', mouseUp)
      canvas.removeEventListener('touchstart', touchStart)
      canvas.removeEventListener('touchmove', touchMove)
      canvas.removeEventListener('touchend', touchEnd)
    }
  }, [size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ cursor: 'grab', userSelect: 'none' }}
    />
  )
}
