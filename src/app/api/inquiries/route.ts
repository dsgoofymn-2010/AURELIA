/**
 * POST /api/inquiries — contact and viewing requests post here.
 *
 * Checks the inquiry with unified validation rules, applies rate-limiting,
 * body-size caps, honeypot protection, and forwards to the FastAPI service.
 */
import { NextResponse } from 'next/server'
import { readInquiry, validateInquiry } from '@/lib/validation'

// In-memory sliding-window rate limiter per client IP (max 5 requests per minute)
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()
const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 5
const MAX_BODY_BYTES = 8192 // 8 KB body cap

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || '127.0.0.1'
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  // Prune map if getting too large (> 10000 entries)
  if (rateLimitMap.size > 10000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetTime) {
        rateLimitMap.delete(key)
      }
    }
  }

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetTime - now) / 1000))
    return { allowed: false, retryAfterSeconds }
  }

  entry.count += 1
  return { allowed: true, retryAfterSeconds: 0 }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()
  const clientIp = getClientIp(request)

  // 1. Rate limiting check
  const { allowed, retryAfterSeconds } = checkRateLimit(clientIp)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before trying again.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
          'X-Request-Id': requestId,
        },
      },
    )
  }

  // 2. Body-size cap
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: 'Request body exceeds the maximum permitted size of 8 KB' },
      { status: 413, headers: { 'X-Request-Id': requestId } },
    )
  }

  let rawText: string
  try {
    rawText = await request.text()
    if (rawText.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Request body exceeds the maximum permitted size of 8 KB' },
        { status: 413, headers: { 'X-Request-Id': requestId } },
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'Could not read request body' },
      { status: 400, headers: { 'X-Request-Id': requestId } },
    )
  }

  let body: unknown
  try {
    body = JSON.parse(rawText)
  } catch {
    return NextResponse.json(
      { error: 'Expected valid JSON body' },
      { status: 400, headers: { 'X-Request-Id': requestId } },
    )
  }

  // 3. Honeypot check (anti-spam traps: website, url, _gotcha)
  const rawObj = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  if (rawObj.website || rawObj.url || rawObj._gotcha) {
    // Silently succeed for bots
    return NextResponse.json(
      { ok: true, id: 0 },
      { status: 201, headers: { 'X-Request-Id': requestId } },
    )
  }

  // 4. Validate inquiry fields
  const inquiry = readInquiry(body)
  const errors = validateInquiry(inquiry)
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: 'Invalid inquiry', fields: errors },
      { status: 422, headers: { 'X-Request-Id': requestId } },
    )
  }

  // Ensure an idempotency key is present
  if (!inquiry.idempotencyKey) {
    inquiry.idempotencyKey = crypto.randomUUID()
  }

  const base = process.env.INQUIRY_API_URL
  if (!base) {
    console.error(`[Inquiries Proxy] INQUIRY_API_URL is not set (reqId: ${requestId})`)
    return NextResponse.json(
      { error: 'Inquiries are temporarily unavailable' },
      { status: 503, headers: { 'X-Request-Id': requestId } },
    )
  }

  // 5. Forward to FastAPI backend
  try {
    const upstreamUrl = `${base.replace(/\/$/, '')}/api/v1/inquiries`
    const res = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
      },
      body: JSON.stringify(inquiry),
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      console.error(
        `[Inquiries Proxy] Upstream HTTP ${res.status} from ${upstreamUrl} (reqId: ${requestId}): ${errorText.slice(0, 300)}`,
      )

      if (res.status === 422) {
        return NextResponse.json(
          { error: 'Invalid inquiry data rejected by backend', upstream: errorText },
          { status: 422, headers: { 'X-Request-Id': requestId } },
        )
      }
      if (res.status === 503) {
        return NextResponse.json(
          { error: 'Database temporarily unavailable. Please retry in a moment.' },
          { status: 503, headers: { 'X-Request-Id': requestId } },
        )
      }
      if (res.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests upstream. Please wait a moment.' },
          { status: 429, headers: { 'X-Request-Id': requestId } },
        )
      }

      return NextResponse.json(
        { error: 'Could not deliver inquiry to backend service' },
        { status: 502, headers: { 'X-Request-Id': requestId } },
      )
    }

    const saved = (await res.json().catch(() => null)) as { id?: number } | null
    if (!saved || typeof saved.id !== 'number') {
      console.error(`[Inquiries Proxy] Upstream response missing numeric id (reqId: ${requestId})`)
      return NextResponse.json(
        { error: 'Backend did not return a valid confirmation identifier' },
        { status: 502, headers: { 'X-Request-Id': requestId } },
      )
    }

    return NextResponse.json(
      { ok: true, id: saved.id },
      { status: 201, headers: { 'X-Request-Id': requestId } },
    )
  } catch (e) {
    console.error(`[Inquiries Proxy] Upstream service unreachable (reqId: ${requestId}):`, e)
    return NextResponse.json(
      { error: 'Could not connect to inquiry service' },
      { status: 502, headers: { 'X-Request-Id': requestId } },
    )
  }
}
