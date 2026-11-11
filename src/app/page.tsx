import { preload } from 'react-dom'
import { Awards } from '@/components/home/Awards'
import { Certificates } from '@/components/home/Certificates'
import { FeaturedProjectStoryboard } from '@/components/home/FeaturedProjectStoryboard'
import { Home3DScene } from '@/components/home/Home3DScene'
import { InquiryForm } from '@/components/contact/InquiryForm'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { AWARDS } from '@/data/recognition'

export default function HomePage() {
  // the tower is the first thing on screen: fetch it alongside the scripts, not after them
  preload('/media/hero/all.webp', { as: 'image', fetchPriority: 'high' })

  return (
    <main>
      <Home3DScene />
      {/* page one is the fixed tower above, seen through this empty screen-high window */}
      <div id="tower-window" className="h-dvh snap-start" aria-hidden />
      <div className="after-stage">
        <FeaturedProjectStoryboard />
        <Awards items={AWARDS} />
        <Certificates />
        <InquiryForm />
        <SiteFooter />
      </div>
    </main>
  )
}
