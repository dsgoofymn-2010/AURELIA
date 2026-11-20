/** Posts an inquiry to the FastAPI backend (POST {VITE_API_URL}/inquiries). */
export interface InquiryPayload {
  name: string
  email: string
  phone?: string
  projectType: string
  projectLocation?: string
  preferredDate?: string
  message?: string
  residenceFloor?: string
}

/** The backend base URL, e.g. http://localhost:8000/api/v1. Empty when not configured. */
export const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/$/, '')

export const hasInquiryApi = API_URL !== ''

export async function submitInquiry(payload: InquiryPayload): Promise<void> {
  // drop empty optional fields so the backend's own validation sees them as absent
  const body = Object.fromEntries(Object.entries(payload).filter(([, v]) => typeof v === 'string' && v.trim() !== ''))
  const res = await fetch(`${API_URL}/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(res.status === 429 ? 'Too many requests, please try again in a minute.' : `HTTP ${res.status}`)
}
