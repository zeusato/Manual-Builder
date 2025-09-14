// src/components/web/CanvasPane.tsx
import React from 'react'
import type { WebStep } from './StepPanel'

type Region = { xPct: number; yPct: number; wPct: number; hPct: number }

type Props = {
  imageSrc: string
  steps: WebStep[]
  onCreateRegion: (region: Region) => void
}

const COLOR = '#f43f5e' // màu như mobile

export default function CanvasPane({ imageSrc, steps, onCreateRegion }: Props) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const imgRef = React.useRef<HTMLImageElement>(null)

  const nat = React.useRef<{ w: number; h: number }>({ w: 0, h: 0 })      // natural size
  const [box, setBox] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 }) // displayed size

  const startPct = React.useRef<null | { x: number; y: number }>(null)
  const [tempRect, setTempRect] = React.useState<Region | null>(null) // khung tạm khi kéo

  // Fit theo cột: width = 100%, height <= 70vh, giữ tỉ lệ
  const recompute = React.useCallback(() => {
    const wEl = wrapRef.current
    if (!wEl || !nat.current.w || !nat.current.h) return
    const colW = wEl.clientWidth
    const ratio = nat.current.h / nat.current.w

    const maxH = Math.min(Math.round(window.innerHeight * 0.7), 900)
    let w = colW
    let h = Math.round(w * ratio)
    if (h > maxH) {
      h = maxH
      w = Math.round(h / ratio)
    }
    setBox({ w, h })
  }, [])

  function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget as HTMLImageElement
    nat.current = { w: img.naturalWidth, h: img.naturalHeight }
    recompute()
  }

  React.useLayoutEffect(() => {
    const ro = new ResizeObserver(recompute)
    if (wrapRef.current) ro.observe(wrapRef.current)
    const onWin = () => recompute()
    window.addEventListener('resize', onWin)
    return () => { ro.disconnect(); window.removeEventListener('resize', onWin) }
  }, [recompute])

  function getPct(clientX: number, clientY: number) {
    const rect = imgRef.current!.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const y = (clientY - rect.top) / rect.height
    return { x: clamp01(x), y: clamp01(y) }
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (!imageSrc) return
    ;(e.currentTarget as any).setPointerCapture?.(e.pointerId)
    const p = getPct(e.clientX, e.clientY)
    startPct.current = p
    setTempRect({ xPct: p.x, yPct: p.y, wPct: 0, hPct: 0 })
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!startPct.current) return
    const a = startPct.current
    const b = getPct(e.clientX, e.clientY)
    const x = Math.min(a.x, b.x)
    const y = Math.min(a.y, b.y)
    const w = Math.abs(a.x - b.x)
    const h = Math.abs(a.y - b.y)
    setTempRect({ xPct: x, yPct: y, wPct: w, hPct: h })
  }

  function commitAndClear(e: React.PointerEvent<SVGSVGElement>) {
    if (!startPct.current) return
    try { (e.currentTarget as any).releasePointerCapture?.(e.pointerId) } catch {}
    const a = startPct.current
    const b = tempRect ? { x: tempRect.xPct + tempRect.wPct, y: tempRect.yPct + tempRect.hPct } : a
    startPct.current = null

    if (!tempRect) return setTempRect(null)
    const w = Math.abs(a.x - b.x)
    const h = Math.abs(a.y - b.y)
    if (w >= 0.01 && h >= 0.01) onCreateRegion({ ...tempRect })
    setTempRect(null)
  }

  if (!imageSrc) {
    return (
      <div className="card rounded-2xl p-6 h-[420px] grid place-items-center text-zinc-400">
        Upload ảnh giai đoạn để khoanh
      </div>
    )
  }

  return (
    <div className="card rounded-2xl p-4">
      <div className="font-semibold mb-2">Canvas (60%) — kéo chuột để khoanh, auto đánh số</div>

      <div ref={wrapRef} className="relative w-full border border-white/10 rounded-xl overflow-hidden">
        <img
          ref={imgRef}
          src={imageSrc}
          onLoad={onImgLoad}
          className="block select-none"
          style={{ width: box.w || '100%', height: box.h || 'auto' }}
        />

        {/* Overlay bám đúng kích thước hiển thị */}
        <svg
          className="absolute inset-0"
          style={{ cursor: 'crosshair' }}
          width={box.w || 0}
          height={box.h || 0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={commitAndClear}
          onPointerLeave={commitAndClear}
        >
          {/* Khung đang vẽ (rubber-band) */}
          {tempRect && (
            <rect
              x={`${tempRect.xPct * 100}%`}
              y={`${tempRect.yPct * 100}%`}
              width={`${tempRect.wPct * 100}%`}
              height={`${tempRect.hPct * 100}%`}
              rx={8}
              ry={8}
              fill={COLOR}
              fillOpacity={0.12}
              stroke={COLOR}
              strokeWidth={3}
              strokeDasharray="8 6"
            />
          )}

          {/* Các step đã tạo */}
          {steps.map((st) => {
            const x = st.region.xPct * (box.w || 1)
            const y = st.region.yPct * (box.h || 1)
            const w = st.region.wPct * (box.w || 1)
            const h = st.region.hPct * (box.h || 1)
            return (
              <g key={st.id}>
                <rect x={x} y={y} width={w} height={h} rx={8} ry={8} fill="none" stroke={COLOR} strokeWidth={3} />
                <g transform={`translate(${x + 6}, ${y + 6})`}>
                  <circle r={14} fill="white" stroke={COLOR} strokeWidth={3} />
                  <text x={0} y={5} fontSize={14} textAnchor="middle" fontWeight={700} fill={COLOR}>
                    {st.index}
                  </text>
                </g>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}
