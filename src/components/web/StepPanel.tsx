// src/components/web/StepPanel.tsx
import React from 'react'

export type Region = { xPct: number; yPct: number; wPct: number; hPct: number }
export type WebStep = {
  id: string
  index: number
  region: Region
  title: string
  desc: string
  thumbSrc?: string
}

type Props = {
  steps: WebStep[]
  onThumbChange: (id: string, dataUrl: string) => void
  onTitleChange: (id: string, title: string) => void
  onDescChange: (id: string, desc: string) => void
  onMove: (id: string, dir: 'up'|'down') => void
  onDelete: (id: string) => void
}

export default function StepPanel({
  steps, onThumbChange, onTitleChange, onDescChange, onMove, onDelete
}: Props) {
  return (
    <div className="card rounded-2xl p-4">
      <div className="font-semibold mb-2">Steps (40%) — ảnh vuông + tiêu đề + mô tả</div>
      {steps.length === 0 && <div className="opacity-70 text-sm">Khoanh bên trái để tạo step…</div>}
      <div className="space-y-3 max-h-[640px] overflow-auto pr-1">
        {steps.map(st => (
          <StepCard
            key={st.id}
            step={st}
            onThumbChange={onThumbChange}
            onTitleChange={onTitleChange}
            onDescChange={onDescChange}
            onMove={onMove}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}

function StepCard({
  step, onThumbChange, onTitleChange, onDescChange, onMove, onDelete
}: {
  step: WebStep
  onThumbChange: (id: string, dataUrl: string) => void
  onTitleChange: (id: string, title: string) => void
  onDescChange: (id: string, desc: string) => void
  onMove: (id: string, dir: 'up'|'down') => void
  onDelete: (id: string) => void
}) {

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const url = await fileToDataURL(f)
    onThumbChange(step.id, url)
  }

  // Ctrl+V trực tiếp vào card
  async function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.items; if (!items) return
    for (const it of items as any) {
      if (it.type?.startsWith('image/')) {
        const file = it.getAsFile()
        if (file) {
          const url = await fileToDataURL(file)
          onThumbChange(step.id, url)
          e.preventDefault()
          return
        }
      }
    }
  }

  return (
    <div
      className="p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition"
      onPaste={onPaste}
    >
      <div className="flex items-start gap-3">
        <label className="block cursor-pointer">
          <div className="w-24 h-24 rounded-lg bg-white/5 border border-white/10 grid place-items-center overflow-hidden">
            {step.thumbSrc
              ? <img src={step.thumbSrc} className="w-24 h-24 object-cover" />
              : <span className="text-[11px] text-white/70 text-center px-2">Click để thêm ảnh<br/>hoặc Ctrl+V</span>}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={onFile} />
        </label>

        <div className="flex-1 min-w-0">
          <input
            value={step.title}
            onChange={e=>onTitleChange(step.id, e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded px-2 py-1 text-sm font-semibold"
          />
          <textarea
            value={step.desc}
            onChange={e=>onDescChange(step.id, e.target.value)}
            placeholder="Mô tả chi tiết…"
            className="mt-2 w-full bg-zinc-900 border border-white/10 rounded px-2 py-2 text-sm h-20"
          />
          <div className="mt-2 text-xs opacity-75">
            Vùng: x={pct(step.region.xPct)} y={pct(step.region.yPct)} w={pct(step.region.wPct)} h={pct(step.region.hPct)}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <button className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700" onClick={()=>onMove(step.id, 'up')}>Up</button>
          <button className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700" onClick={()=>onMove(step.id, 'down')}>Down</button>
          <button className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 mt-auto" onClick={()=>onDelete(step.id)}>Xóa</button>
        </div>
      </div>
    </div>
  )
}

function pct(n:number){ return Math.round(n*100) + '%' }

function fileToDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(file)
  })
}
