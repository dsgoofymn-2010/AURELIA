import type { Metadata } from 'next'
import { InquiryForm } from '@/components/contact/InquiryForm'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Talk to AURELIA about a home, a commercial space or one of our projects in Chennai.',
}

export default function ContactPage() {
  return (
    <>
      <SiteHeader tone="dark" />
      <main className="relative min-h-dvh w-full overflow-x-hidden bg-ink pt-[calc(56px+env(safe-area-inset-top,0px))]">
        <InquiryForm />
      </main>
      <SiteFooter />
    </>
  )
}
