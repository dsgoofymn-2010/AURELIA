import { useEffect, useState } from 'react'
import { renderer } from '../lib/renderer'

/** re-render when the canvas framing changes (resize, transition zoom) */
export function useView() {
  const [, set] = useState(0)
  useEffect(() => {
    const off = renderer.onView(() => set((v) => v + 1))
    return () => {
      off()
    }
  }, [])
  return renderer
}
