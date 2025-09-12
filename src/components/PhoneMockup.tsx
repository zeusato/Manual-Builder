import React from 'react'
import type { Shot } from '@/types'

type Props = { shot: Shot; width?: number }

export default function PhoneMockup({ shot, width = 280 }: Props) {
  const imgSrc = shot.annotatedSrc || shot.src
  return (
    <div className="relative inline-flex flex-col items-center" style={{ width }}>
      <div
        className="relative rounded-[42px] bg-zinc-900 border border-zinc-800 shadow-soft overflow-hidden"
        style={{ width, height: width * 2 }}
      >
        {/* top details */}
        <div className="absolute left-1/2 -translate-x-1/2 top-2 h-2 w-16 rounded bg-zinc-700/60" />
        <div className="absolute right-[22%] top-[6px] h-2 w-2 rounded-full bg-zinc-700/60" />
        {/* screen */}
        <div className="absolute inset-0 px-[7.5%] pt-[10%] pb-[10%]">
          <div className="w-full h-full rounded-2xl overflow-hidden bg-black">
            <img src={imgSrc} className="w-full h-full object-contain" />
          </div>
        </div>
      </div>
    </div>
  )
}
