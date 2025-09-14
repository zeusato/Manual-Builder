// src/pages/ManualWebPage.tsx
import React from 'react'
import banner from '/assets/banner.png'

import CanvasPane from '../components/web/CanvasPane'
import StepPanel, { WebStep } from '../components/web/StepPanel'
const WebPreviewModal = React.lazy(() => import('../components/web/WebPreviewModal'))

type Region = { xPct: number; yPct: number; wPct: number; hPct: number }

type WebStage = {
  id: string
  name: string
  imageSrc: string
  natW: number
  natH: number
  steps: WebStep[]
}

type PagePreset = { key: 'A4_L' | 'HD_16_9'; label: string; width: number; height: number }
const PRESETS: PagePreset[] = [
  { key: 'A4_L', label: 'A4 ngang (1754×1240)', width: 1754, height: 1240 },
  { key: 'HD_16_9', label: '16:9 (1920×1080)', width: 1920, height: 1080 },
]

function uid() { return Math.random().toString(36).slice(2) }

const DEFAULT_TITLE = 'HƯỚNG DẪN SỬ DỤNG (WEB)'

export default function ManualWebPage() {
  const [title, setTitle] = React.useState(DEFAULT_TITLE)
  const [headerUrl, setHeaderUrl] = React.useState<string>(banner)

  const [stages, setStages] = React.useState<WebStage[]>([])
  const [currentStageId, setCurrentStageId] = React.useState<string | undefined>(undefined)

  const [openPreview, setOpenPreview] = React.useState(false)
  const [maxPerPage, setMaxPerPage] = React.useState(8)

  // ⬇️ mới: chọn khổ trang
  const [pagePreset, setPagePreset] = React.useState<PagePreset>(PRESETS[0])

  const currentStage = stages.find(s => s.id === currentStageId)

  function onHeaderFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = () => setHeaderUrl(String(r.result)); r.readAsDataURL(f)
  }

  function addStagesFromFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files; if (!files || !files.length) return
    const readers: Promise<WebStage>[] = []
    for (const f of Array.from(files)) {
      readers.push(new Promise(resolve => {
        const fr = new FileReader()
        fr.onload = () => {
          const src = String(fr.result)
          const img = new Image()
          img.onload = () => {
            resolve({
              id: uid(),
              name: f.name.replace(/\.[^.]+$/, ''),
              imageSrc: src,
              natW: img.naturalWidth,
              natH: img.naturalHeight,
              steps: []
            })
          }
          img.src = src
        }
        fr.readAsDataURL(f)
      }))
    }
    Promise.all(readers).then(arr => {
      setStages(prev => {
        const next = [...prev, ...arr]
        if (!prev.length && next.length) setCurrentStageId(next[0].id)
        return next
      })
      e.target.value = ''
    })
  }

  function removeStage(id: string) {
    setStages(prev => prev.filter(s => s.id !== id))
    setCurrentStageId(prev => {
      if (prev === id) {
        const rest = stages.filter(s => s.id !== id)
        return rest[0]?.id
      }
      return prev
    })
  }

  // ======= Step Ops =======
  function createStep(region: Region) {
    if (!currentStage) return
    setStages(prev => prev.map(s => {
      if (s.id !== currentStage.id) return s
      const nextIndex = s.steps.length + 1
      const step: WebStep = { id: uid(), index: nextIndex, region, title: `Bước ${nextIndex}`, desc: '' }
      return { ...s, steps: [...s.steps, step] }
    }))
  }

  function updateStep(stepId: string, patch: Partial<WebStep>) {
    if (!currentStage) return
    setStages(prev => prev.map(s => {
      if (s.id !== currentStage.id) return s
      return { ...s, steps: s.steps.map(st => st.id === stepId ? { ...st, ...patch } : st) }
    }))
  }

  function deleteStep(stepId: string) {
    if (!currentStage) return
    setStages(prev => prev.map(s => {
      if (s.id !== currentStage.id) return s
      const rest = s.steps.filter(st => st.id !== stepId)
      const re = rest.map((st, i) => ({ ...st, index: i + 1, title: st.title.replace(/^Bước\s+\d+/, `Bước ${i+1}`) }))
      return { ...s, steps: re }
    }))
  }

  function moveStep(stepId: string, dir: 'up'|'down') {
    if (!currentStage) return
    setStages(prev => prev.map(s => {
      if (s.id !== currentStage.id) return s
      const idx = s.steps.findIndex(st => st.id === stepId)
      if (idx < 0) return s
      const to = dir==='up' ? idx-1 : idx+1
      if (to < 0 || to >= s.steps.length) return s
      const arr = s.steps.slice()
      const [sp] = arr.splice(idx, 1)
      arr.splice(to, 0, sp)
      const re = arr.map((st, i) => ({ ...st, index: i+1, title: st.title.replace(/^Bước\s+\d+/, `Bước ${i+1}`) }))
      return { ...s, steps: re }
    }))
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="text-lg font-bold">Manual Builder — WEB</div>

          <div className="ml-auto flex items-center gap-3">
            {/* ⬇️ chọn khổ trang */}
            <label className="text-sm opacity-80">
              Khổ trang
              <select
                className="ml-2 bg-zinc-900 border border-white/10 rounded px-2 py-1"
                value={pagePreset.key}
                onChange={e => setPagePreset(PRESETS.find(p => p.key === e.target.value as PagePreset['key'])!)}
              >
                {PRESETS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </label>

            <label className="text-sm opacity-80">
              Tối đa step/trang
              <select
                className="ml-2 bg-zinc-900 border border-white/10 rounded px-2 py-1"
                value={maxPerPage}
                onChange={e=>setMaxPerPage(Number(e.target.value))}
              >
                {[6,8,10,12].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>

            <button
              onClick={() => setOpenPreview(true)}
              className="px-3 py-1 rounded bg-brand-600 hover:bg-brand-500"
              disabled={!stages.length}
            >
              Preview / Export
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-4 grid grid-cols-12 gap-4">
        {/* Header config */}
        <div className="col-span-12 card rounded-2xl p-4 flex flex-wrap items-center gap-4">
          <div className="text-sm font-semibold">Header</div>
          <img src={headerUrl} className="h-16 w-[280px] object-cover rounded-lg border border-white/10"/>
          <input type="file" accept="image/*" onChange={onHeaderFile} />
          <div className="ml-auto min-w-[260px]">
            <div className="text-sm font-semibold mb-1">Title</div>
            <input
              value={title}
              onChange={e=>setTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Stage selector (gọn) */}
        <aside className="col-span-12 card rounded-2xl p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <input type="file" accept="image/*" multiple onChange={addStagesFromFiles}/>
            <div className="text-sm opacity-80">Mỗi ảnh = 1 giai đoạn. Chọn ảnh xong thao tác luôn bên dưới.</div>
          </div>

          {stages.length > 0 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {stages.map(s => (
                <button
                  key={s.id}
                  onClick={()=>setCurrentStageId(s.id)}
                  className={`p-2 rounded-lg border ${currentStageId===s.id ? 'border-brand-500 bg-white/5' : 'border-white/10 bg-white/[0.03]'}`}
                  title={s.name}
                >
                  <img src={s.imageSrc} className="w-16 h-16 object-cover rounded-md border border-white/10" />
                  <div className="text-[11px] mt-1 max-w-[120px] truncate">{s.name}</div>
                  <div className="text-[10px] opacity-70">Steps: {s.steps.length}</div>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Main 60/40 */}
        <section className="col-span-12 grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-7">
            <CanvasPane
              imageSrc={currentStage?.imageSrc || ''}
              steps={currentStage?.steps || []}
              onCreateRegion={(region) => createStep(region)}
            />
          </div>

          <div className="col-span-12 lg:col-span-5">
            <StepPanel
              steps={currentStage?.steps || []}
              onThumbChange={(id, thumbSrc) => updateStep(id, { thumbSrc })}
              onTitleChange={(id, title) => updateStep(id, { title })}
              onDescChange={(id, desc) => updateStep(id, { desc })}
              onMove={moveStep}
              onDelete={deleteStep}
            />

            {currentStage && (
              <div className="mt-3 text-right">
                <button
                  onClick={() => removeStage(currentStage.id)}
                  className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500"
                >
                  Xóa giai đoạn hiện tại
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <React.Suspense fallback={null}>
        <WebPreviewModal
          open={openPreview}
          onClose={()=>setOpenPreview(false)}
          title={title}
          headerUrl={headerUrl}
          stages={stages}
          maxPerPage={maxPerPage}
          // ⬇️ truyền preset được chọn
          preset={{ width: pagePreset.width, height: pagePreset.height }}
        />
      </React.Suspense>
    </div>
  )
}
