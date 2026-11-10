import { useEffect, useRef } from 'react'
import { renderer } from '../../lib/renderer'

export function Stage() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current) return
    renderer.attach(ref.current)
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => renderer.resize())
    }
    window.addEventListener('resize', on)
    window.visualViewport?.addEventListener('resize', on)
    return () => {
      window.removeEventListener('resize', on)
      window.visualViewport?.removeEventListener('resize', on)
    }
  }, [])
  return <canvas ref={ref} className="absolute inset-0 block" aria-hidden="true" />
}
