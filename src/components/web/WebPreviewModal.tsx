// src/components/web/WebPreviewModal.tsx
import React from 'react'
import silk from '/assets/Silk.png'
import type { WebStep } from './StepPanel'

type Region = { xPct: number; yPct: number; wPct: number; hPct: number }
type WebStage = { id: string; name: string; imageSrc: string; natW: number; natH: number; steps: WebStep[] }

type Props = {
  open: boolean
  onClose: () => void
  title: string
  headerUrl: string
  stages: WebStage[]
  maxPerPage: number
  // ⬇️ mới: kích thước trang đầu vào
  preset: { width: number; height: number }
}

const COLOR = '#f43f5e'

export default function WebPreviewModal({ open, onClose, title, headerUrl, stages, maxPerPage, preset }: Props) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = React.useState(1)
  const [shrink, setShrink] = React.useState(true)

  const recomputeScale = React.useCallback(() => {
    const el = viewportRef.current; if (!el) return
    const styles = getComputedStyle(el)
    const padX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight)
    const padY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom)
    const availW = el.clientWidth - padX
    const availH = el.clientHeight - padY
    const s = Math.min(availW / preset.width, availH / preset.height, 1)
    setScale(s > 0 && isFinite(s) ? s : 1)
  }, [preset.width, preset.height])

  React.useLayoutEffect(() => {
    if (!open) return
    recomputeScale()
    const ro = new ResizeObserver(recomputeScale)
    const el = viewportRef.current
    if (el) ro.observe(el)
    const onWin = () => recomputeScale()
    window.addEventListener('resize', onWin)
    return () => { ro.disconnect(); window.removeEventListener('resize', onWin) }
  }, [open, recomputeScale])

  if (!open) return null

  const pages = buildPages(stages, maxPerPage)

  async function exportPNGs() {
    const els = Array.from(viewportRef.current!.querySelectorAll('[data-page]')) as HTMLElement[]
    let idx = 1
    if (shrink) {
      for (const el of els) {
        const url = await renderCompressedJPEG(el, preset, { pixelRatio: 1.25, maxBytes: 1_000_000 })
        download(url, `manual-web-${idx}.jpg`); idx++
      }
    } else {
      const { toPng } = await import('html-to-image')
      for (const el of els) {
        const url = await toPng(el, {
          pixelRatio: 2,
          canvasWidth: preset.width,
          canvasHeight: preset.height,
          style: { transform: 'none' },
        })
        download(url, `manual-web-${idx}.png`); idx++
      }
    }
  }

  async function exportPDF() {
    const { default: jsPDF } = await import('jspdf')
    const els = Array.from(viewportRef.current!.querySelectorAll('[data-page]')) as HTMLElement[]

    const doc = new jsPDF({
      orientation: 'landscape', // vẫn để landscape; format sẽ theo preset
      unit: 'px',
      format: [preset.width, preset.height],
    })

    for (let i = 0; i < els.length; i++) {
      const el = els[i]
      if (i > 0) doc.addPage([preset.width, preset.height], 'l')

      if (shrink) {
        const url = await renderCompressedJPEG(el, preset, { pixelRatio: 1.25, maxBytes: 1_000_000 })
        doc.addImage(url, 'JPEG', 0, 0, preset.width, preset.height)
      } else {
        const { toPng } = await import('html-to-image')
        const url = await toPng(el, {
          pixelRatio: 2,
          canvasWidth: preset.width,
          canvasHeight: preset.height,
          style: { transform: 'none' },
        })
        doc.addImage(url, 'PNG', 0, 0, preset.width, preset.height)
      }
    }
    doc.save('manual-web.pdf')
  }

  return (
    <div className="fixed inset-0 z-50 modal-backdrop p-6">
      <div className="mx-auto h-[90%] max-w-[95%] bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden flex flex-col">
        {/* header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
          <div className="font-semibold">WEB Pages Preview</div>

          <label className="ml-4 flex items-center gap-2 text-sm opacity-90">
            <input type="checkbox" checked={shrink} onChange={(e)=>setShrink(e.target.checked)} />
            Giảm dung lượng tối đa
          </label>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={exportPNGs} className="px-3 py-1 rounded bg-brand-600 hover:bg-brand-500">
              Export {shrink ? 'JPEG (≤1MB/trang)' : 'PNG'}
            </button>
            <button onClick={exportPDF} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700">Export PDF</button>
            <button onClick={onClose} className="px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600">Close</button>
          </div>
        </div>

        {/* viewport */}
        <div ref={viewportRef} className="flex-1 overflow-auto p-4">
          <div className="space-y-8">
            {pages.map((pg, i) => (
              <div key={i} className="mx-auto" style={{ width: preset.width * scale, height: preset.height * scale }}>
                <div
                  data-page
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    width: preset.width,
                    height: preset.height,
                    background: 'white',
                    color: 'black',
                    borderRadius: 16,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                  className="border border-black/10"
                >
                  <Header headerUrl={headerUrl} title={title} />

                  <div className="px-6 py-4 grid grid-cols-12 gap-12" style={{ height: preset.height - 220 }}>
                    {/* Left 60%: Ảnh + overlay trong 1 SVG (viewBox = natW/natH) */}
                    <div className="col-span-7 relative">
                      <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox={`0 0 ${pg.stage.natW || 1000} ${pg.stage.natH || 1000}`}
                        preserveAspectRatio="xMidYMid meet"
                      >
                        <image
                          href={pg.stage.imageSrc}
                          x="0"
                          y="0"
                          width={pg.stage.natW || 1000}
                          height={pg.stage.natH || 1000}
                          preserveAspectRatio="xMidYMid meet"
                        />
                        {pg.steps.map(st => (
                          <g key={st.id}>
                            <rect
                              x={st.region.xPct * (pg.stage.natW || 1)}
                              y={st.region.yPct * (pg.stage.natH || 1)}
                              width={st.region.wPct * (pg.stage.natW || 1)}
                              height={st.region.hPct * (pg.stage.natH || 1)}
                              rx={12} ry={12}
                              fill="none" stroke={COLOR} strokeWidth={8}
                            />
                            <g transform={`translate(${st.region.xPct * (pg.stage.natW || 1)}, ${st.region.yPct * (pg.stage.natH || 1)})`}>
                              <circle r={20} cx={20} cy={20} fill="white" stroke={COLOR} strokeWidth={8} />
                              <text x={20} y={27} fontSize={20} textAnchor="middle" fontWeight={800} fill={COLOR}>{st.index}</text>
                            </g>
                          </g>
                        ))}
                      </svg>
                    </div>

                    {/* Right 40%: step LIST xếp dọc, căn giữa dọc */}
                    <div className="col-span-5">
                      <div className="h-full flex flex-col justify-center gap-12">
                        {pg.steps.map(st => (
                          <StepItem key={st.id} st={st} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <img src={silk} aria-hidden className="absolute -right-20 -bottom-40 w-[720px] opacity-30 pointer-events-none" />
                  <Footer pageNo={i + 1} total={pages.length} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepItem({ st }: { st: WebStep }) {
  return (
    <div className="flex items-start gap-4">
      {/* khung ảnh 128×128; nếu không có ảnh -> invisible để giữ layout thẳng hàng */}
      <div className={`${st.thumbSrc ? 'border border-black/10 bg-black/5' : 'invisible'} w-32 h-32 rounded-lg overflow-hidden`}>
        {st.thumbSrc && (
          <img src={st.thumbSrc} className="w-full h-full" style={{ objectFit: 'contain' }} />
        )}
      </div>
      {/* text luôn thẳng hàng với cột phải của khung ảnh */}
      <div className="flex-1">
        <div className="mt-5 text-4xl text-[#FF6500] font-bold">
          {st.title || `Bước ${st.index}`}
        </div>
        <div className="text-2xl leading-relaxed text-black/85 whitespace-pre-wrap">
          {st.desc || ''}
        </div>
      </div>
    </div>
  )
}

function Header({ headerUrl, title }: { headerUrl: string; title: string }) {
  return (
    <div className="relative h-[180px] w-full">
      <img src={headerUrl} className="absolute inset-0 w-full h-full object-fill" />
      <div className="absolute inset-0 flex items-center">
        <div className="text-[#002865] px-6 text-left ml-60 my-auto text-5xl font-extrabold leading-tight drop-shadow">
          {title}
        </div>
      </div>
    </div>
  )
}

function Footer({ pageNo, total }: { pageNo: number; total: number }) {
  return (
    <div className="h-[50px] w-full grid place-items-center text-base text-black/80">
      Trang {pageNo}/{total}
    </div>
  )
}

function buildPages(stages: WebStage[], maxPerPage: number) {
  type Page = { stage: WebStage; steps: WebStep[] }
  const pages: Page[] = []
  for (const st of stages) {
    for (let i = 0; i < st.steps.length; i += maxPerPage) {
      pages.push({ stage: st, steps: st.steps.slice(i, i + maxPerPage) })
    }
    if (st.steps.length === 0) pages.push({ stage: st, steps: [] })
  }
  return pages
}

function download(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function bytesOfDataURL(dataUrl: string) {
  const b64 = dataUrl.split(',')[1] || ''
  return Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0)
}

async function renderCompressedJPEG(
  el: HTMLElement,
  preset: { width: number; height: number },
  opts: { pixelRatio: number; maxBytes: number }
) {
  const { pixelRatio, maxBytes } = opts
  const { toCanvas } = await import('html-to-image')
  const canvas = await toCanvas(el, {
    pixelRatio,
    canvasWidth: preset.width,
    canvasHeight: preset.height,
    style: { transform: 'none' },
  })

  let q = 0.72
  let url = canvas.toDataURL('image/jpeg', q)
  while (bytesOfDataURL(url) > maxBytes && q > 0.5) {
    q -= 0.05
    url = canvas.toDataURL('image/jpeg', q)
  }
  return url
}
