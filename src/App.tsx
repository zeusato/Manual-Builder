import React from 'react'
import clsx from 'clsx'
import type { Shot, ShapeType, PagePreset } from './types'

const Annotator = React.lazy(() => import('./components/Annotator'))
const PagesPreviewModal = React.lazy(() => import('./components/PagesPreviewModal'))

const PRESETS: PagePreset[] = [
  { key: 'A4_P', label: 'A4 Dọc (1240×1754)', width: 1240, height: 1754, maxCols: 3, maxRows: 2 },
  { key: 'A4_L', label: 'A4 Ngang (1754×1240)', width: 1754, height: 1240, maxCols: 5, maxRows: 1 },
  { key: 'HD_16_9', label: '16:9 (1920×1080)', width: 1920, height: 1080, maxCols: 5, maxRows: 1 },
]

function uid() { return Math.random().toString(36).slice(2) }

export default function App() {
  const DEFAULT_HEADER = import.meta.env.BASE_URL + 'assets/banner.png'

  const [title, setTitle] = React.useState('HƯỚNG DẪN SỬ DỤNG')
  const [headerUrl, setHeaderUrl] = React.useState(DEFAULT_HEADER)
  const [shots, setShots] = React.useState<Shot[]>([])
  const [current, setCurrent] = React.useState(0)
  const [tool, setTool] = React.useState<ShapeType>('rect')
  const [color] = React.useState('#f43f5e') // đang khóa màu (UI chỉ hiển thị)
  const [pagePreset, setPagePreset] = React.useState<PagePreset>(PRESETS[1])
  const [pixelRatio, setPixelRatio] = React.useState(2)
  const [openPreview, setOpenPreview] = React.useState(false)

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
      setShots(prev => {
        const next = [...prev, ...arr]
        if (!prev.length && next.length) setCurrent(0)
        return next
      })
      // Clear input to allow re-importing same files
      e.target.value = ''
    })
  }

  function onChangeDesc(id: string, desc: string) {
    setShots(prev => prev.map(s => s.id===id ? {...s, description: desc} : s))
  }

  function updateShot(next: Shot) {
    setShots(prev => prev.map(s => s.id === next.id ? next : s))
  }

  function resetShot() {
    const cur = shots[current]; if (!cur) return
    updateShot({ ...cur, annotatedSrc: undefined, shapes: [] })
  }
  function deleteShot(id: string) {
    setShots(prev => {
      const idx = prev.findIndex(s => s.id === id)
      const next = prev.filter(s => s.id !== id)

      // Cập nhật current index an toàn
      setCurrent(c => {
        if (next.length === 0) return 0
        if (idx === -1) return c
        if (c > next.length - 1) return next.length - 1
        if (idx <= c) return Math.max(0, c - 1)
        return c
      })
      return next
    })
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="text-lg font-bold">Manual Builder</div>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
            >
              Refresh
            </button>
            <select
              className="bg-zinc-900 border border-white/10 rounded px-2 py-1"
              value={pagePreset.key}
              onChange={e => setPagePreset(PRESETS.find(p=>p.key===e.target.value as any)!)}
            >
              {PRESETS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
            <label className="text-sm opacity-80">Scale
              <select
                className="ml-2 bg-zinc-900 border border-white/10 rounded px-2 py-1"
                value={pixelRatio}
                onChange={e=>setPixelRatio(Number(e.target.value))}
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
              </select>
            </label>
            <button onClick={()=>setOpenPreview(true)} className="px-3 py-1 rounded bg-brand-600 hover:bg-brand-500">
              Generate
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 grid grid-cols-12 gap-4">
        {/* Left: controls */}
        <aside className="col-span-4 space-y-4">
          <div className="card rounded-2xl p-4">
            <div className="text-sm font-semibold mb-2">Header</div>
            <img src={headerUrl} className="w-full h-24 object-cover rounded-lg mb-2"/>
            <input type="file" accept="image/*" onChange={onHeaderFile} />
            <div className="mt-3">
              <div className="text-sm font-semibold mb-1">Title</div>
              <input
                value={title}
                onChange={e=>setTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2"
              />
            </div>
          </div>

          <div className="card rounded-2xl p-4">
            <div className="text-sm font-semibold mb-2">Screenshots</div>
            <input type="file" accept="image/*" multiple onChange={onShotFiles}/>
            {shots.length > 0 && (
              <div className="text-sm text-gray-400 mt-1">
                Đã import {shots.length} file{shots.length > 1 ? 's' : ''}
              </div>
            )}
            <div className="mt-3 max-h-[48vh] overflow-auto space-y-3 pr-1">
              {shots.map((s, i) => (
                <div
                  key={s.id}
                  className={clsx(
                    "flex gap-3 p-2 rounded-lg border",
                    i===current ? "border-brand-500 bg-white/5":"border-white/10 bg-white/[0.03]"
                  )}
                >
                  <button className="shrink-0" onClick={()=>setCurrent(i)}>
                    <img
                      src={s.annotatedSrc || s.src}
                      className="w-16 h-16 object-cover rounded-md border border-white/10"
                    />
                  </button>
                  <div className="flex-1">
                    <div className="text-xs opacity-75 mb-1">Bước: {i+1}</div>
                    <textarea
                      placeholder="Mô tả bước..."
                      value={s.description}
                      onChange={e=>onChangeDesc(s.id, e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded px-2 py-2 text-sm h-16"
                    />
                  </div>
                  {/* Nút Xóa */}
                  <button
                    onClick={() => { if (confirm('Xóa ảnh này?')) deleteShot(s.id) }}
                    className="self-start text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500"
                    title="Xóa ảnh này"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right: Annotator */}
        <section className="col-span-8">
          <React.Suspense fallback={<div className="card rounded-2xl p-4">Đang tải editor…</div>}>
            <Annotator
              shot={currentShot}
              color={color}
              tool={tool}
              setTool={setTool}
              onUpdate={updateShot}
              onReset={resetShot}
            />
          </React.Suspense>
        </section>
      </main>

      <React.Suspense fallback={null}>
        <PagesPreviewModal
          open={openPreview}
          onClose={()=>setOpenPreview(false)}
          title={title}
          headerUrl={headerUrl}
          shots={shots}
          preset={pagePreset}
          pixelRatio={pixelRatio}
        />
      </React.Suspense>
    </div>
  )
}
