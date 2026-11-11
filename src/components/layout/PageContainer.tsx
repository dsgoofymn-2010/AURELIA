// PageContainer.tsx
// The one content width and side gutter every page shares.
import type { ElementType, ReactNode } from 'react'

export function PageContainer({ as: Tag = 'div', className = '', children }: { as?: ElementType; className?: string; children: ReactNode }) {
  return <Tag className={`mx-auto w-full max-w-[1240px] px-5 sm:px-10 lg:px-14 ${className}`}>{children}</Tag>
}

export default PageContainer
