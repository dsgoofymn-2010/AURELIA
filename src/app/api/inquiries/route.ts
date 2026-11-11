/**
 * POST /api/inquiries — the contact form posts here.
 *
 * The inquiry is checked with the same rules as the form, then handed to the inquiries
 * service (the FastAPI app in /backend), which stores it and emails the sales team.
 * Doing this server-side keeps the service's address private and needs no CORS setup.
 *
 *   INQUIRY_API_URL   base URL of the FastAPI service, e.g. http://localhost:8000
 *
 * Without INQUIRY_API_URL the route answers as a demo in development (so the form can be
 * tried with `npm run dev` alone) and refuses in production rather than dropping leads.
 */
import { NextResponse } from 'next/server'
import { readInquiry, validateInquiry } from '@/lib/validation'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body' }, { status: 400 })
  }

  const inquiry = readInquiry(body)
  const errors = validateInquiry(inquiry)
  if (Object.keys(errors).length) return NextResponse.json({ error: 'Invalid inquiry', fields: errors }, { status: 422 })

  const base = process.env.INQUIRY_API_URL
  if (!base) {
    if (process.env.NODE_ENV === 'development') return NextResponse.json({ ok: true, demo: true }, { status: 201 })
    console.error('INQUIRY_API_URL is not set: inquiry not delivered')
    return NextResponse.json({ error: 'Inquiries are not available right now' }, { status: 503 })
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/v1/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiry),
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error(`inquiries service answered ${res.status}`)
      return NextResponse.json({ error: 'Could not send the inquiry' }, { status: res.status === 422 ? 422 : 502 })
    }
    const saved = (await res.json().catch(() => ({}))) as { id?: number }
    return NextResponse.json({ ok: true, id: saved.id }, { status: 201 })
  } catch (e) {
    console.error('inquiries service unreachable', e)
    return NextResponse.json({ error: 'Could not send the inquiry' }, { status: 502 })
  }
}
