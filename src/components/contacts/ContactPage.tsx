import { InquiryForm } from './InquiryForm'
import { Footer } from '../Footer'

export default function ContactPage() {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto bg-ink">
      <InquiryForm />
      <Footer nav={false} />
    </main>
  )
}

