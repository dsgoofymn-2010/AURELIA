import { useEffect, useState } from 'react'
import { renderer } from './renderer'

/** re-render when the canvas framing changes (resize, transition zoom) */
export function useView(active = true) {
  const [, set] = useState(0)
  useEffect(() => {
    if (!active) return
    const off = renderer.onView(() => set((v) => v + 1))
    return () => {
      off()
    }
  }, [active])
  return renderer
}
