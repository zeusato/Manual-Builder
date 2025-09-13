import React from 'react'
import type { Shot, Shape, ShapeType } from '@/types'
import MockupFrame from './MockupFrame'

type Props = {
  shot: Shot | null
  color: string
  tool: ShapeType
  setTool: (t: ShapeType) => void
  onUpdate: (next: Shot) => void
  onReset: () => void
}

export default function Annotator({ shot, color, tool, setTool, onUpdate, onReset }: Props) {
  const imgRef = React.useRef<HTMLImageElement>(null)
  const [imgBox, setImgBox] = React.useState<{w:number;h:number}>({w:0,h:0})
  const drawingRef = React.useRef(false)

  function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget as HTMLImageElement
    let { naturalWidth: w, naturalHeight: h } = img
    const maxW = 720, maxH = 720
    const r = Math.min(maxW / w, maxH / h, 1)
    setImgBox({ w: Math.round(w*r), h: Math.round(h*r) })
  }

  function getPos(clientX:number, clientY:number) {
    const rect = imgRef.current!.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const y = (clientY - rect.top) / rect.height
    return { x: Math.min(Math.max(x,0),1), y: Math.min(Math.max(y,0),1) }
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (!shot) return
    ;(e.currentTarget as any).setPointerCapture?.(e.pointerId)
    const p = getPos(e.clientX, e.clientY)
    const s: Shape = { id: uid(), type: tool, color, x1: p.x, y1: p.y, x2: p.x, y2: p.y }
    onUpdate({ ...shot, shapes: [...shot.shapes, s] })
    drawingRef.current = true
  }
  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!shot || !drawingRef.current) return
    const p = getPos(e.clientX, e.clientY)
    const shapes = shot.shapes.slice()
    shapes[shapes.length-1] = { ...shapes[shapes.length-1], x2: p.x, y2: p.y }
    onUpdate({ ...shot, shapes })
  }
  async function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    if (!shot) return
    drawingRef.current = false
    try { (e.currentTarget as any).releasePointerCapture?.(e.pointerId) } catch (_){}
    // ✅ Auto-save: bake vào annotatedSrc rồi xóa shapes (khỏi double-apply)
    const baked = await bakeAnnotation(shot)
    onUpdate({ ...shot, annotatedSrc: baked, shapes: [] })
  }

  if (!shot) return <div className="card rounded-2xl p-6 h-[420px] grid place-items-center text-zinc-400">Upload ảnh để bắt đầu</div>

  const displayUrl = shot.annotatedSrc || shot.src

  return (
    <div className="space-y-4">
      <div className="card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Preview & Annotate</div>
          <div className="flex items-center gap-2">
            <select className="bg-zinc-900 border border-white/10 rounded px-2 py-1" value={tool} onChange={e=>setTool(e.target.value as any)}>
              <option value="rect">Rectangle</option>
              <option value="circle">Circle</option>
              <option value="line">Line</option>
              <option value="arrow">Arrow</option>
            </select>
            <input type="color" value={color} readOnly className="w-10 h-8 rounded" />
            <button onClick={onReset} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700">Reset</button>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="relative border border-white/10 rounded-xl overflow-hidden" style={{ width: imgBox.w||720, height: imgBox.h||720 }}>
            <img ref={imgRef} src={displayUrl} onLoad={onImgLoad} className="block" style={{ width: imgBox.w||720, height: imgBox.h||720 }} />
            <svg className="absolute inset-0" width={imgBox.w||720} height={imgBox.h||720}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill={color}/>
                </marker>
              </defs>
              {shot.shapes.map((s) => {
                const x1 = s.x1*(imgBox.w||720), y1=s.y1*(imgBox.h||720), x2=s.x2*(imgBox.w||720), y2=s.y2*(imgBox.h||720)
                const common = { stroke: s.color, fill: "none", strokeWidth: 3 } as any
                if (s.type==='rect') {
                  const x = Math.min(x1,x2), y = Math.min(y1,y2), w = Math.abs(x2-x1), h = Math.abs(y2-y1)
                  return <rect key={s.id} x={x} y={y} width={w} height={h} rx={8} ry={8} {...common}/>
                } else if (s.type==='circle') {
                  const cx=(x1+x2)/2, cy=(y1+y2)/2, r=Math.max(Math.abs(x2-x1), Math.abs(y2-y1))/2
                  return <circle key={s.id} cx={cx} cy={cy} r={r} {...common}/>
                } else if (s.type==='line') {
                  return <line key={s.id} x1={x1} y1={y1} x2={x2} y2={y2} {...common}/>
                } else {
                  return <line key={s.id} x1={x1} y1={y1} x2={x2} y2={y2} {...common} markerEnd="url(#arrowhead)"/>
                }
              })}
            </svg>
          </div>

          <div className="hidden xl:block">
            <div className="text-sm opacity-80 mb-2">Mockup preview</div>
            <div className="p-3 rounded-xl bg-white/5">
              <MockupFrame screenUrl={displayUrl} width={260} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function uid() { return Math.random().toString(36).slice(2) }

async function bakeAnnotation(shot: Shot): Promise<string> {
  const base = await loadImage(shot.annotatedSrc || shot.src) // bake chồng lên ảnh mới nhất
  const canvas = document.createElement('canvas')
  canvas.width = base.naturalWidth; canvas.height = base.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(base, 0, 0, canvas.width, canvas.height)
  for (const s of shot.shapes) {
    const x1 = s.x1 * canvas.width, y1 = s.y1 * canvas.height
    const x2 = s.x2 * canvas.width, y2 = s.y2 * canvas.height
    ctx.strokeStyle = s.color; ctx.fillStyle = s.color
    ctx.lineWidth = Math.max(3, Math.min(canvas.width, canvas.height) * 0.004)
    if (s.type === 'rect') {
      const x = Math.min(x1,x2), y = Math.min(y1,y2), w = Math.abs(x2-x1), h = Math.abs(y2-y1)
      roundRect(ctx, x, y, w, h, Math.min(w,h)*0.08); ctx.stroke()
    } else if (s.type === 'circle') {
      const cx=(x1+x2)/2, cy=(y1+y2)/2, r=Math.max(Math.abs(x2-x1), Math.abs(y2-y1))/2
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke()
    } else if (s.type === 'line') {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke()
    } else if (s.type === 'arrow') {
      drawArrow(ctx, x1,y1,x2,y2)
    }
  }
  return canvas.toDataURL('image/png')
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => resolve(img); img.onerror = reject; img.src = src
  })
}
function roundRect(ctx: CanvasRenderingContext2D, x:number,y:number,w:number,h:number,r:number) {
  ctx.beginPath(); ctx.moveTo(x+r, y); ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r); ctx.arcTo(x, y, x+w, y, r); ctx.closePath()
}
function drawArrow(ctx: CanvasRenderingContext2D, x1:number,y1:number,x2:number,y2:number) {
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke()
  const headlen = Math.max(10, Math.hypot(x2-x1,y2-y1)*0.04)
  const angle = Math.atan2(y2-y1, x2-x1)
  ctx.beginPath(); ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - headlen*Math.cos(angle - Math.PI/6), y2 - headlen*Math.sin(angle - Math.PI/6))
  ctx.lineTo(x2 - headlen*Math.cos(angle + Math.PI/6), y2 - headlen*Math.sin(angle + Math.PI/6))
  ctx.closePath(); ctx.fill()
}
