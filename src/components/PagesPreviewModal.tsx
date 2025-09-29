import React from 'react'
import type { Shot, PagePreset } from '@/types'
import MockupFrame from './MockupFrame'
import silkp from "/assets/Silk.png";

// export const silkUrl = silkp;

type Props = {
  open: boolean
  onClose: () => void
  title: string
  headerUrl: string
  shots: Shot[]
  preset: PagePreset
  pixelRatio: number
}

const silk = {
  sizeRatio: 0.42,   // chiều rộng = 42% bề rộng trang (đổi theo ý)
  right: -80,        // cách mép phải (px)
  bottom: -180,      // cách mép dưới (px)
  opacity: 0.30,     // độ trong suốt 0..1
  rotateDeg: 0       // xoay nếu cần (độ)
};

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/** Ước lượng số byte của dataURL base64 */
function dataUrlBytes(dataUrl: string) {
  const b64 = dataUrl.split(',')[1] || ''
  // ~ (len * 3) / 4 trừ padding
  return Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0)
}

/** Render 1 page element => JPEG (nén dần) tới khi ≤ maxBytes */
async function renderCompressedJPEG(
  el: HTMLElement,
  preset: PagePreset,
  opts: { pixelRatio: number; maxBytes: number; aggressive: boolean }
) {
  const { pixelRatio, maxBytes, aggressive } = opts
  const { toCanvas } = await import('html-to-image')

  // Nếu bật “giảm tối đa”, giới hạn pixelRatio nhẹ để đỡ nặng
  const effPixelRatio = aggressive ? Math.min(pixelRatio, 1.25) : pixelRatio

  const canvas = await toCanvas(el, {
    pixelRatio: effPixelRatio,
    canvasWidth: preset.width,
    canvasHeight: preset.height,
    style: { transform: 'none' }, // tránh biến dạng khi clone
  })

  // bắt đầu chất lượng cao rồi giảm dần
  let q = aggressive ? 0.72 : 0.92
  let url = canvas.toDataURL('image/jpeg', q)

  while (dataUrlBytes(url) > maxBytes && q > 0.5) {
    q -= 0.05
    url = canvas.toDataURL('image/jpeg', q)
  }
  return url
}

export default function PagesPreviewModal({
  open, onClose, title, headerUrl, shots, preset, pixelRatio
}: Props) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = React.useState(1)

  // ✅ Thêm trạng thái “giảm dung lượng tối đa” (default: bật)
  const [shrink, setShrink] = React.useState(true)

  // Tính scale cho MỌI preset dựa vào không gian thực của viewport (đã trừ padding)
  const recomputeScale = React.useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const styles = getComputedStyle(el)
    const padX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight)
    const padY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom)
    const availW = el.clientWidth - padX
    const availH = el.clientHeight - padY
    const s = Math.min(availW / preset.width, availH / preset.height, 1)
    setScale(s > 0 && isFinite(s) ? s : 1)
  }, [preset])

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

  const perPage = preset.maxCols * preset.maxRows
  const pages = chunk(shots, perPage)

  async function exportPNGs() {
    const els = Array.from(viewportRef.current!.querySelectorAll('[data-page]')) as HTMLElement[]
    let idx = 1

    if (shrink) {
      // ➜ Xuất JPEG nén ≤ 1MB/trang
      for (const el of els) {
        const url = await renderCompressedJPEG(el, preset, {
          pixelRatio,
          maxBytes: 1_000_000,
          aggressive: true
        })
        download(url, `manual-page-${idx}.jpg`); idx++
      }
    } else {
      // ➜ Xuất PNG “full chất” như trước
      const { toPng } = await import('html-to-image')
      for (const el of els) {
        const url = await toPng(el, {
          pixelRatio,
          canvasWidth: preset.width,
          canvasHeight: preset.height,
          style: { transform: 'none' }
        })
        download(url, `manual-page-${idx}.png`); idx++
      }
    }
  }

  async function exportPDF() {
    const { default: jsPDF } = await import('jspdf')
    const els = Array.from(viewportRef.current!.querySelectorAll('[data-page]')) as HTMLElement[]

    const doc = new jsPDF({
      orientation: preset.width >= preset.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [preset.width, preset.height]
    })

    for (let i = 0; i < els.length; i++) {
      const el = els[i]
      if (i > 0) doc.addPage([preset.width, preset.height], preset.width >= preset.height ? 'l' : 'p')

      if (shrink) {
        // ➜ Nén JPEG ≤ 1MB/trang trước khi addImage
        const url = await renderCompressedJPEG(el, preset, {
          pixelRatio,
          maxBytes: 1_000_000,
          aggressive: true
        })
        doc.addImage(url, 'JPEG', 0, 0, preset.width, preset.height)
      } else {
        // ➜ PNG “full chất”
        const { toPng } = await import('html-to-image')
        const url = await toPng(el, {
          pixelRatio,
          canvasWidth: preset.width,
          canvasHeight: preset.height,
          style: { transform: 'none' }
        })
        doc.addImage(url, 'PNG', 0, 0, preset.width, preset.height)
      }
    }
    doc.save('manual.pdf')
  }

  return (
    <div className="fixed inset-0 z-50 modal-backdrop p-6">
      <div className="mx-auto h-[90%] max-w-[95%] bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden flex flex-col">
        {/* header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
          <div className="font-semibold">Pages Preview</div>

          {/* ⬅️ Checkbox 'giảm dung lượng tối đa' */}
          <label className="ml-4 flex items-center gap-2 text-sm opacity-90">
            <input
              type="checkbox"
              checked={shrink}
              onChange={(e) => setShrink(e.target.checked)}
            />
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

        {/* viewport: mỗi TRANG được scale để luôn vừa khung, bất kể A4 dọc/ngang hay 16:9 */}
        <div ref={viewportRef} className="flex-1 overflow-auto p-4">
          <div className="space-y-8">
            {pages.map((page, i) => (
              <div
                key={i}
                className="mx-auto"
                style={{ width: preset.width * scale, height: preset.height * scale }}
              >
                {/* Trang thật, giữ kích thước gốc, chỉ scale bằng transform */}
                <div
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    width: preset.width,
                    height: preset.height
                  }}
                >
                  <Page
                    index={i}
                    headerUrl={headerUrl}
                    title={title}
                    items={page}
                    preset={preset}
                    total={pages.length}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

type PageProps = { index: number; headerUrl: string; title: string; items: Shot[]; preset: PagePreset; total: number }

function Page({ index, headerUrl, title, items, preset, total }: PageProps) {
  const cols = Math.min(preset.maxCols, Math.max(1, Math.min(preset.maxCols, items.length)))
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: 16,
    alignContent: 'center',
    justifyItems: 'center',
    alignItems: 'stretch',
    gridAutoRows: '1fr',
    height: preset.height - 260
  }
  const pageStyle: React.CSSProperties = {
    width: preset.width,
    height: preset.height,
    background: 'white',
    color: 'black',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  }

  return (
    <div data-page className="mx-auto border border-black/10 rounded-xl overflow-hidden" style={pageStyle}>
      {/* Silk background (bottom-right) */}
      <img
        src={silkp}
        aria-hidden
        className="pointer-events-none select-none"
        style={{
          position: 'absolute',
          right: silk.right,
          bottom: silk.bottom,
          width: `${Math.floor(preset.width * silk.sizeRatio)}px`,
          height: 'auto',
          opacity: silk.opacity,
          transform: `rotate(${silk.rotateDeg}deg)`,
          zIndex: 0
        }}
      />
      <div>
        <div className="relative h-[180px] w-full">
          <img src={headerUrl} className="absolute inset-0 w-full h-full object-fill" />
          <div className="absolute inset-0" />
          <div className="absolute inset-0 flex items-center">
            <div className="text-[#002865] px-6 text-left ml-60 my-auto text-5xl font-extrabold leading-tight drop-shadow">
              {title}
            </div>
          </div>
        </div>

        {/* Lưới ảnh + đổ bóng nhẹ cho mockup */}
        <div className="px-6 py-4" style={{ height: preset.height - 260 }}>
          <div style={gridStyle}>
            {items.map((s, i) => {
              const url = s.annotatedSrc || s.src
              return (
                <div
                  key={s.id}
                  className="flex h-full w-full flex-col items-center justify-start gap-6 text-center"
                >
                  <div className="flex w-full justify-center">
                    <div style={{ filter: 'drop-shadow(12px 16px 12px rgba(0,0,0,0.34)) drop-shadow(3px 4px 4px rgba(0,0,0,0.22))' }}>
                      <MockupFrame
                        screenUrl={url}
                        width={Math.min(280, Math.floor((preset.width - 80) / preset.maxCols) - 24)}
                      />
                    </div>
                  </div>
                  <div className="text-4xl text-[#FF6500] font-bold">
                    Bước {index * preset.maxCols * preset.maxRows + i + 1}:
                  </div>
                  <div className="text-2xl leading-relaxed text-black/85 max-w-[340px]">
                    {s.description || ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="h-[60px] w-full grid place-items-center text-xl text-black/80">
          Trang {index + 1}/{total}
        </div>
      </div>
    </div>
  )
}

function download(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}
