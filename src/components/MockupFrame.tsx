import React from 'react'

type Props = {
  screenUrl: string
  width?: number
  mockupUrl?: string
}

export default function MockupFrame({ screenUrl, width = 280, mockupUrl }: Props) {
  const url = mockupUrl || (import.meta.env.BASE_URL + 'assets/mockup.png')
  const [mockupH, setMockupH] = React.useState<number | null>(null)
  const mockRef = React.useRef<HTMLImageElement>(null)

  // Khi mockup load xong, tính chiều cao theo tỉ lệ gốc để parent có height "definite"
  function onMockupLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget as HTMLImageElement
    const ratio = img.naturalHeight / img.naturalWidth
    setMockupH(Math.round(width * ratio))
  }

  const radiusPx = 20 // bo góc ~20px

  return (
    <div className="relative" style={{ width, height: mockupH ?? undefined }}>
      {/* CONTENT (screen) nằm DƯỚI mockup, cắt theo bo góc */}
      <div className="absolute inset-0 grid place-items-center z-0 pointer-events-none">
        <div
          style={{
            height: mockupH ? `${Math.floor(mockupH * 0.96)}px` : undefined, // 96% CHÍNH XÁC (px)
            width: 'auto',
            borderRadius: radiusPx,
            overflow: 'hidden', // cắt sạch mép ngoài
          }}
        >
          <img
            src={screenUrl}
            style={{ height: '100%', width: 'auto', objectFit: 'contain', display: 'block' }}
            alt="app screen"
          />
        </div>
      </div>

      {/* MOCKUP phủ LÊN TRÊN để “đè” viền máy */}
      <img
        ref={mockRef}
        onLoad={onMockupLoad}
        src={url}
        className="relative z-10 block w-full h-auto pointer-events-none select-none"
        alt="phone mockup"
      />
    </div>
  )
}
