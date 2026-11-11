/**
 * Contact inquiry: the one set of rules, used by the form in the browser and again by
 * the API route on the server (never trust what arrives over the network).
 */

export interface Inquiry {
    name: string
    email: string
    phone: string
    projectType: string
    projectLocation: string
}

export type InquiryErrors = Partial<Record<keyof Inquiry, string>>

export const INQUIRY_FIELDS: (keyof Inquiry)[] = ['name', 'email', 'phone', 'projectType', 'projectLocation']

/** pull the five fields out of untrusted JSON, as trimmed strings of a sane length */
export function readInquiry(body: unknown): Inquiry {
    const o = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
    const pick = (k: keyof Inquiry) => (typeof o[k] === 'string' ? (o[k] as string).trim().slice(0, 300) : '')
    return { name: pick('name'), email: pick('email'), phone: pick('phone'), projectType: pick('projectType'), projectLocation: pick('projectLocation') }
}

export function validateInquiry(data: Inquiry): InquiryErrors {
    const errors: InquiryErrors = {}

    // Name
    if (!data.name.trim()) {
        errors.name = 'Name is required'
    } else if (data.name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters'
    }

    // Email
    if (!data.email.trim()) {
        errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        errors.email = 'Please enter a valid email address'
    }

    // Phone
    if (!data.phone.trim()) {
        errors.phone = 'Phone number is required'
    } else if (!/^\+?[\d\s\-()]{7,15}$/.test(data.phone.trim())) {
        errors.phone = 'Please enter a valid phone number (digits only, 7-15 chars)'
    }

    // Project Type
    if (!data.projectType.trim()) {
        errors.projectType = 'Project type is required'
    }

    // Project Location
    if (!data.projectLocation.trim()) {
        errors.projectLocation = 'Project location is required'
    } else if (data.projectLocation.trim().length < 5) {
        errors.projectLocation = 'Please provide a valid address (at least 5 characters)'
    }

    return errors
}
