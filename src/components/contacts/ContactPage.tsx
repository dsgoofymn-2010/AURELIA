import { InquiryForm } from './InquiryForm'
import { Footer } from '../Footer'
import { SiteNav } from '../SiteNav'

export default function ContactPage() {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-ink pt-[calc(56px+env(safe-area-inset-top,0px))]">
      <SiteNav current="contact" tone="dark" />
      <InquiryForm />
      <Footer nav={false} />
    </main>
  )
}

