'use client'
// TierFlag.tsx
// Marks <html data-tier="hd|sd"> on every page as soon as the browser runs any script,
// so low-end phones get the lighter styles (no heavy blur, still film grain) everywhere.
import '@/lib/tier'

export function TierFlag() {
  return null
}
