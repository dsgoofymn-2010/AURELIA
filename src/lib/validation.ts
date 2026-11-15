/**
 * Contact inquiry: the one set of rules, used by the forms in the browser and again by
 * the API route on the server (never trust what arrives over the network).
 *
 * Required: name, email, projectType. Phone, projectLocation and the viewing details
 * (preferredDate, message) are optional — the scene panel's "Book a private viewing"
 * form does not collect an address.
 */

export interface Inquiry {
    name: string
    email: string
    phone: string
    projectType: string
    projectLocation: string
    preferredDate?: string
    message?: string
}

export type InquiryErrors = Partial<Record<keyof Inquiry, string>>

export const INQUIRY_FIELDS: (keyof Inquiry)[] = ['name', 'email', 'phone', 'projectType', 'projectLocation']

/** pull the fields out of untrusted JSON, as trimmed strings of a sane length */
export function readInquiry(body: unknown): Inquiry {
    const o = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
    const pick = (k: keyof Inquiry, max = 300) => (typeof o[k] === 'string' ? (o[k] as string).trim().slice(0, max) : '')
    return {
        name: pick('name'),
        email: pick('email'),
        phone: pick('phone', 40),
        projectType: pick('projectType', 120),
        projectLocation: pick('projectLocation', 255),
        preferredDate: pick('preferredDate', 10),
        message: pick('message', 2000),
    }
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

    // Phone (optional, but must look like a phone number when given)
    if (data.phone.trim() && !/^\+?[\d\s\-()]{7,15}$/.test(data.phone.trim())) {
        errors.phone = 'Please enter a valid phone number (digits only, 7-15 chars)'
    }

    // Project Type
    if (!data.projectType.trim()) {
        errors.projectType = 'Project type is required'
    }

    // Project Location (optional; checked only when given)
    if (data.projectLocation.trim() && data.projectLocation.trim().length < 5) {
        errors.projectLocation = 'Please provide a valid address (at least 5 characters)'
    }

    return errors
}
