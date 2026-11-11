import { useRef } from 'react'
import { renderer } from './renderer'

/** narrow screens crop the 16:9 frames: drag sideways to look around */
export function PanLayer() {
  const last = useRef<number | null>(null)
  return (
    <div
      className="absolute inset-0 touch-pan-y"
      onPointerDown={(e) => (last.current = e.clientX)}
      onPointerMove={(e) => {
        if (last.current === null) return
        const dx = e.clientX - last.current
        last.current = e.clientX
        const w = renderer.frameRect().w
        const minF = renderer.W / w / 2
        const f = Math.min(1 - minF, Math.max(minF, renderer.focus[0] - dx / w))
        renderer.setFocus([f, renderer.focus[1]])
      }}
      onPointerUp={() => (last.current = null)}
      onPointerCancel={() => (last.current = null)}
      onPointerLeave={() => (last.current = null)}
    />
  )
}
