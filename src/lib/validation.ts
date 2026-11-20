/**
 * Contact inquiry: the unified validation rules, used by forms in the browser
 * and verified again by the API route on the server.
 */

export interface Inquiry {
  name: string
  email: string
  phone: string
  projectType: string
  projectLocation: string
  preferredDate?: string
  message?: string
  residenceFloor?: string
  idempotencyKey?: string
}

export type InquiryErrors = Partial<Record<keyof Inquiry, string>>

/** Stable key for one logical submission; reuse it when retrying the same data. */
export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export const INQUIRY_FIELDS: (keyof Inquiry)[] = [
  'name',
  'email',
  'phone',
  'projectType',
  'projectLocation',
  'preferredDate',
  'message',
  'residenceFloor',
  'idempotencyKey',
]

/**
 * Extracts fields out of untrusted JSON without silent truncation.
 * Excess lengths are rejected during validation.
 */
export function readInquiry(body: unknown): Inquiry {
  const o = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const pick = (k: string) => (typeof o[k] === 'string' ? (o[k] as string).trim() : '')
  const pickOptional = (k: string) => {
    if (typeof o[k] === 'string') {
      const trimmed = (o[k] as string).trim()
      return trimmed.length > 0 ? trimmed : undefined
    }
    return undefined
  }

  return {
    name: pick('name'),
    email: pick('email'),
    phone: pick('phone'),
    projectType: pick('projectType') || pick('project_type'),
    projectLocation: pick('projectLocation') || pick('project_location'),
    preferredDate: pickOptional('preferredDate') ?? pickOptional('preferred_date'),
    message: pickOptional('message'),
    residenceFloor: pickOptional('residenceFloor') ?? pickOptional('residence_floor'),
    idempotencyKey: pickOptional('idempotencyKey') ?? pickOptional('idempotency_key'),
  }
}

export function validateInquiry(data: Inquiry): InquiryErrors {
  const errors: InquiryErrors = {}

  // Name (min 2, max 120 chars)
  const nameTrimmed = data.name.trim()
  if (!nameTrimmed) {
    errors.name = 'Name is required'
  } else if (nameTrimmed.length < 2) {
    errors.name = 'Name must be at least 2 characters'
  } else if (nameTrimmed.length > 120) {
    errors.name = 'Name cannot exceed 120 characters'
  }

  // Email (valid email, max 255 chars)
  const emailTrimmed = data.email.trim()
  if (!emailTrimmed) {
    errors.email = 'Email is required'
  } else if (emailTrimmed.length > 255) {
    errors.email = 'Email cannot exceed 255 characters'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
    errors.email = 'Please enter a valid email address'
  }

  // Phone (optional, but if provided must match phone pattern and digit length)
  const phoneTrimmed = data.phone.trim()
  if (phoneTrimmed) {
    if (phoneTrimmed.length > 40) {
      errors.phone = 'Phone number cannot exceed 40 characters'
    } else if (!/^\+?[\d\s\-()]{7,25}$/.test(phoneTrimmed)) {
      errors.phone = 'Please enter a valid phone number (digits, spaces, hyphens, parentheses)'
    } else {
      const digitsCount = phoneTrimmed.replace(/\D/g, '').length
      if (digitsCount < 7 || digitsCount > 15) {
        errors.phone = 'Phone number must contain between 7 and 15 digits'
      }
    }
  }

  // Project Type (min 1, max 120 chars)
  const projectTypeTrimmed = data.projectType.trim()
  if (!projectTypeTrimmed) {
    errors.projectType = 'Project type is required'
  } else if (projectTypeTrimmed.length > 120) {
    errors.projectType = 'Project type cannot exceed 120 characters'
  }

  // Project Location (optional; checked only when given)
  const projectLocationTrimmed = data.projectLocation.trim()
  if (projectLocationTrimmed) {
    if (projectLocationTrimmed.length < 5) {
      errors.projectLocation = 'Please provide a valid address (at least 5 characters)'
    } else if (projectLocationTrimmed.length > 255) {
      errors.projectLocation = 'Project location cannot exceed 255 characters'
    }
  }

  // Preferred Date (optional; checked if given: YYYY-MM-DD format, valid date, not in past)
  if (data.preferredDate) {
    const dateTrimmed = data.preferredDate.trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateTrimmed)) {
      errors.preferredDate = 'Please enter date in YYYY-MM-DD format'
    } else {
      const parsed = new Date(dateTrimmed + 'T00:00:00Z')
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      if (isNaN(parsed.getTime())) {
        errors.preferredDate = 'Please enter a valid date'
      } else if (parsed < today) {
        errors.preferredDate = 'Preferred date cannot be in the past'
      }
    }
  }

  // Message (optional, max 2000 chars)
  if (data.message && data.message.length > 2000) {
    errors.message = 'Message cannot exceed 2000 characters'
  }

  // Residence Floor (optional, max 40 chars)
  if (data.residenceFloor && data.residenceFloor.length > 40) {
    errors.residenceFloor = 'Residence floor cannot exceed 40 characters'
  }

  // Idempotency Key (optional, max 64 chars)
  if (data.idempotencyKey && data.idempotencyKey.length > 64) {
    errors.idempotencyKey = 'Idempotency key cannot exceed 64 characters'
  }

  return errors
}
