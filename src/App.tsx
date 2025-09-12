import React from 'react'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import clsx from 'clsx'
import type { Shot, Shape, ShapeType, PagePreset } from './types'
import PhoneMockup from './components/PhoneMockup'

const PRESETS: PagePreset[] = [
  { key: 'A4_P', label: 'A4 Dọc (1240×1754)', width: 1240, height: 1754, maxCols: 3, maxRows: 5 },
  { key: 'A4_L', label: 'A4 Ngang (1754×1240)', width: 1754, height: 1240, maxCols: 5, maxRows: 3 },
  { key: 'HD_16_9', label: '16:9 (1920×1080)', width: 1920, height: 1080, maxCols: 4, maxRows: 2 },
]

function uid() { return Math.random().toString(36).slice(2) }
function chunk<T>(arr: T[], size: number) { const out: T[][] = []; for (let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size)); return out }

export default function App() {
  const [title, setTitle] = React.useState('HƯỚNG DẪN SỬ DỤNG')
  const [headerUrl, setHeaderUrl] = React.useState('/default-header.svg')
  const [shots, setShots] = React.useState<Shot[]>([])
  const [current, setCurrent] = React.useState(0)
  const [tool, setTool] = React.useState<ShapeType>('rect')
  const [color, setColor] = React.useState('#f43f5e')
  const [drawing, setDrawing] = React.useState(false)
  const [pagePreset, setPagePreset] = React.useState<PagePreset>(PRESETS[1])
  const [pixelRatio, setPixelRatio] = React.useState(2)
  const pageWrapRef = React.useRef<HTMLDivElement>(null)
  const imgRef = React.useRef<HTMLImageElement>(null)
  const [imgBox, setImgBox] = React.useState<{w:number;h:number}>({w:0,h:0})

  const currentShot = shots[current] || null

  function onHeaderFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = () => setHeaderUrl(String(r.result)); r.readAsDataURL(f)
  }

  function onShotFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const fs = e.target.files; if (!fs || !fs.length) return
    const readers: Promise<Shot>[] = []
    for (const f of Array.from(fs)) {
      readers.push(new Promise((resolve) => {
        const r = new FileReader()
        r.onload = () => resolve({ id: uid(), src: String(r.result), description: '', shapes: [] })
        r.readAsDataURL(f)
      }))
    }
    Promise.all(readers).then(arr => {
      setShots(prev => [...prev, ...arr])
      if (!shots.length && arr.length) setCurrent(0)
    })
  }

  function onChangeDesc(id: string, desc: string) {
    setShots(prev => prev.map(s => s.id===id ? {...s, description: desc} : s))
  }

  function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget
    let w = img.naturalWidth, h = img.naturalHeight
    const maxW = 720, maxH = 720
    const r = Math.min(maxW / w, maxH / h, 1)
    setImgBox({ w: Math.round(w*r), h: Math.round(h*r) })
  }

  function getMousePos(clientX: number, clientY: number) {
    const rect = imgRef.current!.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const y = (clientY - rect.top) / rect.height
    return { x: Math.min(Math.max(x,0),1), y: Math.min(Math.max(y,0),1) }
  }

  // ===== Pointer Events (fix auto-start, chỉ vẽ khi drawing === true) =====
  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (!currentShot) return
    ;(e.currentTarget as any).setPointerCapture?.(e.pointerId)
    const p = getMousePos(e.clientX, e.clientY)
    const s: Shape = { id: uid(), type: tool, color, x1: p.x, y1: p.y, x2: p.x, y2: p.y }
    setShots(prev => { const copy=[...prev]; copy[current] = {...copy[current], shapes:[...copy[current].shapes, s]}; return copy })
    setDrawing(true)
  }
  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drawing || !currentShot) return
    const p = getMousePos(e.clientX, e.clientY)
    setShots(prev => {
      const copy = [...prev]; const shapes = copy[current].shapes; if (!shapes.length) return prev
      shapes[shapes.length-1] = { ...shapes[shapes.length-1], x2: p.x, y2: p.y }; return copy
    })
  }
  function endDraw(e?: React.PointerEvent<SVGSVGElement>) {
    setDrawing(false)
    if (e) { try { (e.currentTarget as any).releasePointerCapture?.(e.pointerId) } catch(_){} }
  }
  // ======================================================================

  async function bakeAnnotation(shot: Shot): Promise<string> {
    const base = await loadImage(shot.src)
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
  async function onSaveAnnotation() {
    if (!currentShot) return
    const annotated = await bakeAnnotation(currentShot)
    setShots(prev => { const copy=[...prev]; copy[current] = {...copy[current], annotatedSrc: annotated}; return copy })
  }

  function perPage() { return pagePreset.maxCols * pagePreset.maxRows }
  function pages() { return chunk(shots, perPage()) }

  async function exportPNGs() {
    if (!shots.length) return
    const wrap = pageWrapRef.current!
    const pagesEls = Array.from(wrap.querySelectorAll('[data-page]')) as HTMLElement[]
    let idx = 1
    for (const el of pagesEls) {
      const dataUrl = await toPng(el, { pixelRatio })
      downloadBlob(dataUrl, `manual-page-${idx}.png`); idx++
    }
  }
  async function exportPDF() {
    if (!shots.length) return
    const wrap = pageWrapRef.current!
    const els = Array.from(wrap.querySelectorAll('[data-page]')) as HTMLElement[]
    const doc = new jsPDF({
      orientation: pagePreset.width >= pagePreset.height ? 'landscape' : 'portrait',
      unit: 'px', format: [pagePreset.width, pagePreset.height]
    })
    for (let i=0;i<els.length;i++) {
      const el = els[i]; const url = await toPng(el, { pixelRatio })
      if (i>0) doc.addPage([pagePreset.width, pagePreset.height], pagePreset.width>=pagePreset.height? 'l':'p')
      doc.addImage(url, 'PNG', 0, 0, pagePreset.width, pagePreset.height)
    }
    doc.save('manual.pdf')
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="text-lg font-bold">Manual Builder</div>
          <div className="ml-auto flex items-center gap-3">
            <select className="bg-zinc-900 border border-white/10 rounded px-2 py-1"
              value={pagePreset.key} onChange={e => setPagePreset(PRESETS.find(p=>p.key===e.target.value as any)!)} >
              {PRESETS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
            <label className="text-sm opacity-80">Scale
              <select className="ml-2 bg-zinc-900 border border-white/10 rounded px-2 py-1"
                value={pixelRatio} onChange={e=>setPixelRatio(Number(e.target.value))}>
                <option value={1}>1x</option><option value={2}>2x</option><option value={3}>3x</option>
              </select>
            </label>
            <button onClick={exportPNGs} className="px-3 py-1 rounded bg-brand-600 hover:bg-brand-500">Export PNG</button>
            <button onClick={exportPDF} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700">Export PDF</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 grid grid-cols-12 gap-4">
        {/* Left */}
        <aside className="col-span-4 space-y-4">
          <div className="card rounded-2xl p-4">
            <div className="text-sm font-semibold mb-2">Header</div>
            <img src={headerUrl} className="w-full h-24 object-cover rounded-lg mb-2"/>
            <input type="file" accept="image/*" onChange={onHeaderFile} />
            <div className="mt-3">
              <div className="text-sm font-semibold mb-1">Title</div>
              <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2"/>
            </div>
          </div>

          <div className="card rounded-2xl p-4">
            <div className="text-sm font-semibold mb-2">Screenshots</div>
            <input type="file" accept="image/*" multiple onChange={onShotFiles}/>
            <div className="mt-3 max-h-[48vh] overflow-auto space-y-3 pr-1">
              {shots.map((s, i) => (
                <div key={s.id} className={clsx("flex gap-3 p-2 rounded-lg border", i===current ? "border-brand-500 bg-white/5":"border-white/10 bg-white/[0.03]")}>
                  <button className="shrink-0" onClick={()=>setCurrent(i)}>
                    <img src={s.annotatedSrc || s.src} className="w-16 h-16 object-cover rounded-md border border-white/10"/>
                  </button>
                  <div className="flex-1">
                    <div className="text-xs opacity-75 mb-1">Bước: {i+1}</div>
                    <textarea placeholder="Mô tả bước..." value={s.description} onChange={e=>onChangeDesc(s.id, e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded px-2 py-2 text-sm h-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right */}
        <section className="col-span-8 space-y-4">
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
                <input type="color" value={color} onChange={e=>setColor(e.target.value)} className="w-10 h-8 rounded" />
                <button onClick={onSaveAnnotation} disabled={!currentShot} className="px-3 py-1 rounded bg-brand-600 hover:bg-brand-500 disabled:opacity-50">Save</button>
              </div>
            </div>

            {!currentShot ? (
              <div className="h-[420px] grid place-items-center text-zinc-400">Upload ảnh để bắt đầu</div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="relative border border-white/10 rounded-xl overflow-hidden" style={{ width: imgBox.w||720, height: imgBox.h||720 }}>
                  <img ref={imgRef} src={currentShot.src} onLoad={onImgLoad} className="block" style={{ width: imgBox.w||720, height: imgBox.h||720 }} />
                  {/* SVG overlay with pointer events */}
                  <svg
                    className="absolute inset-0"
                    width={imgBox.w||720} height={imgBox.h||720}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDraw}
                    onPointerLeave={endDraw}
                  >
                    <defs>
                      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill={color}/>
                      </marker>
                    </defs>
                    {currentShot.shapes.map((s) => {
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

                <div className="hidden md:block">
                  <div className="text-sm opacity-80 mb-2">Mockup preview</div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <PhoneMockup shot={currentShot} width={260} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pages preview */}
          <div className="card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Pages Preview</div>
              <div className="text-xs opacity-70">Max {pagePreset.maxCols}×{pagePreset.maxRows} items mỗi trang</div>
            </div>
            <div ref={pageWrapRef} className="space-y-6">
              {pages().map((page, i) => (
                <Page key={i} index={i} headerUrl={headerUrl} title={title} items={page}
                  preset={pagePreset} total={pages().length} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function downloadBlob(dataUrl: string, filename: string) {
  const a = document.createElement('a'); a.href = dataUrl; a.download = filename; document.body.appendChild(a); a.click(); a.remove()
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

type PageProps = { index: number; headerUrl: string; title: string; items: Shot[]; preset: PagePreset; total: number }
function Page({ index, headerUrl, title, items, preset, total }: PageProps) {
  const perRow = Math.min(items.length, preset.maxCols)
  const cols = Math.min(preset.maxCols, perRow || preset.maxCols)
  const rows = Math.min(preset.maxRows, Math.ceil(items.length / cols) || 1)
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: 16,
    alignContent: 'center',
    justifyItems: 'center',
    alignItems: 'start',
    height: preset.height - 260,
  }
  const pageStyle: React.CSSProperties = {
    width: preset.width, height: preset.height, background: 'white',
    color: 'black', borderRadius: 16, overflow: 'hidden'
  }

  return (
    <div data-page className="mx-auto border border-black/10 rounded-xl overflow-hidden" style={pageStyle}>
      {/* header */}
      <div className="relative h-[180px] w-full">
        <img src={headerUrl} className="absolute inset-0 w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-black/20"/>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-white text-3xl font-extrabold drop-shadow">{title}</div>
        </div>
      </div>
      {/* grid */}
      <div className="px-6 py-4" style={{height: preset.height - 260}}>
        <div style={gridStyle}>
          {items.map((s, i) => (
            <div key={s.id} className="text-center">
              {/* BỎ wrapper bo góc/trắng để tránh “thò ra” */}
              <PhoneMockup shot={s} width={Math.min(280, Math.floor((preset.width-80)/preset.maxCols) - 24)} />
              <div className="mt-3 text-lg font-bold">Bước: {index * preset.maxCols * preset.maxRows + i + 1}</div>
              <div className="text-base leading-relaxed text-black/85 max-w-[340px] mx-auto">{s.description || ''}</div>
            </div>
          ))}
        </div>
      </div>
      {/* footer */}
      <div className="h-[60px] w-full grid place-items-center text-sm text-black/70">
        Trang {index+1}/{total}
      </div>
    </div>
  )
}
