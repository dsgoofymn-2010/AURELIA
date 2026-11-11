import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StatusMark, type StatusMarkStatus } from '../ui/StatusMark'

/* ────────────────────────── types ────────────────────────── */
interface FormData {
    name: string
    email: string
    phone: string
    projectType: string
    projectLocation: string
}

interface FormErrors {
    name?: string
    email?: string
    phone?: string
    projectType?: string
    projectLocation?: string
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

/* ─────────────────── status‑toast mapping ─────────────────── */
const statusConfig: Record<
    Exclude<SubmitStatus, 'idle'>,
    { status: StatusMarkStatus; label: string; bg: string }
> = {
    submitting: {
        status: 'running',
        label: 'Submitting The Form...',
        bg: 'rgba(28, 24, 40, 0.62)',
    },
    success: {
        status: 'done',
        label: 'The Form Has Been Submitted',
        bg: 'rgba(34, 197, 94, 0.18)',
    },
    error: {
        status: 'failed',
        label: 'Submission Failed',
        bg: 'rgba(239, 68, 68, 0.18)',
    },
}

/* ───────────────── validation helpers ─────────────────────── */
function validate(data: FormData): FormErrors {
    const errors: FormErrors = {}

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

/* ══════════════════════════════════════════════════════════════
   InquiryForm
   ══════════════════════════════════════════════════════════════ */
export function InquiryForm() {
    /* ── state ── */
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        phone: '',
        projectType: '',
        projectLocation: '',
    })
    const [errors, setErrors] = useState<FormErrors>({})
    const [touched, setTouched] = useState<Record<string, boolean>>({})
    const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')

    /* auto‑dismiss toast after 4 s */
    useEffect(() => {
        if (submitStatus === 'success' || submitStatus === 'error') {
            const t = setTimeout(() => setSubmitStatus('idle'), 4000)
            return () => clearTimeout(t)
        }
    }, [submitStatus])

    /* ── handlers ── */
    const handleChange = useCallback(
        (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target

            // Phone: allow only digits, spaces, +, -, ()
            if (name === 'phone' && value !== '' && !/^[\d\s+\-()]*$/.test(value)) {
                return
            }

            setFormData((prev) => ({ ...prev, [name]: value }))

            // Clear error on change if field was touched
            if (touched[name]) {
                const updated = { ...formData, [name]: value }
                const newErrors = validate(updated)
                setErrors((prev) => ({ ...prev, [name]: newErrors[name as keyof FormErrors] }))
            }
        },
        [formData, touched],
    )

    const handleBlur = useCallback(
        (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const { name } = e.target
            setTouched((prev) => ({ ...prev, [name]: true }))
            const newErrors = validate(formData)
            setErrors((prev) => ({ ...prev, [name]: newErrors[name as keyof FormErrors] }))
        },
        [formData],
    )

    const handleSubmit = useCallback(
        async (e: FormEvent) => {
            e.preventDefault()

            // Mark all fields touched
            const allTouched = Object.keys(formData).reduce(
                (a, k) => ({ ...a, [k]: true }),
                {} as Record<string, boolean>,
            )
            setTouched(allTouched)

            const validationErrors = validate(formData)
            setErrors(validationErrors)

            if (Object.keys(validationErrors).length > 0) return

            /* ── submit to the inquiries API ── */
            setSubmitStatus('submitting')
            try {
                // VITE_API_URL points at the backend (e.g. https://api.aurelia…/api/v1).
                // When it is unset the form still works as a demo: it resolves after a short
                // pause so the static preview and local dev without the backend both succeed.
                const api = import.meta.env.VITE_API_URL as string | undefined
                if (api) {
                    const res = await fetch(`${api.replace(/\/$/, '')}/inquiries`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData),
                    })
                    if (!res.ok) throw new Error(`HTTP ${res.status}`)
                } else {
                    await new Promise((resolve) => setTimeout(resolve, 1200))
                }

                setSubmitStatus('success')
                setFormData({ name: '', email: '', phone: '', projectType: '', projectLocation: '' })
                setTouched({})
                setErrors({})
            } catch {
                setSubmitStatus('error')
            }
        },
        [formData],
    )

    /* ── reusable input field ── */
    const inputField = (
        name: keyof FormData,
        label: string,
        placeholder: string,
        type: string = 'text',
    ) => (
        <div className="flex flex-col gap-1.5">
            <label
                htmlFor={name}
                className="font-cinzel text-sm font-medium tracking-wide text-champagne-soft/90"
            >
                {label} <span className="text-red-400">*</span>
            </label>
            <input
                id={name}
                name={name}
                type={type}
                value={formData[name]}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                autoComplete={
                    name === 'name'
                        ? 'name'
                        : name === 'email'
                            ? 'email'
                            : name === 'phone'
                                ? 'tel'
                                : name === 'projectLocation'
                                    ? 'street-address'
                                    : 'off'
                }
                className={`
          w-full rounded-lg border bg-white/5 px-4 py-3
          font-josefin text-sm font-light text-white/90
          placeholder:text-white/30
          outline-none transition-all duration-300
          focus:border-champagne/50 focus:bg-white/8 focus:ring-1 focus:ring-champagne/30
          ${errors[name] && touched[name] ? 'border-red-400/60' : 'border-white/10'}
        `}
            />
            <AnimatePresence>
                {errors[name] && touched[name] && (
                    <motion.p
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="font-josefin text-xs font-light text-red-400"
                    >
                        {errors[name]}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    )

    /* ══════════════════════ render ══════════════════════ */
    return (
        <section className="relative w-full overflow-hidden bg-ink px-4 py-20 sm:px-8 lg:px-16 xl:px-24">
            {/* ── Status Toast (top right) ── */}
            <AnimatePresence>
                {submitStatus !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, x: 60, y: -20 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: 60, y: -20 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="fixed right-6 top-6 z-[9999] flex items-center gap-3 rounded-xl border border-white/10 px-5 py-3 shadow-2xl backdrop-blur-xl"
                        style={{
                            background:
                                submitStatus === 'success'
                                    ? 'rgba(34, 197, 94, 0.15)'
                                    : submitStatus === 'error'
                                        ? 'rgba(239, 68, 68, 0.15)'
                                        : 'rgba(28, 24, 40, 0.72)',
                            backdropFilter: 'blur(20px) saturate(140%)',
                            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
                        }}
                    >
                        <StatusMark
                            status={statusConfig[submitStatus as Exclude<SubmitStatus, 'idle'>].status}
                            size={22}
                        />
                        <span className="font-josefin text-sm font-light text-white/90">
                            {statusConfig[submitStatus as Exclude<SubmitStatus, 'idle'>].label}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:gap-16">
                {/* ═════════════════════ LEFT COLUMN ═════════════════════ */}
                <div className="flex flex-col justify-between">
                    {/* Heading */}
                    <div className="mb-12">
                        <h1 className="font-cinzel text-4xl font-medium leading-tight tracking-wide text-champagne-soft sm:text-5xl lg:text-[3.4rem]">
                            Let's Build Something{' '}
                            <em className="not-italic text-champagne">Great Together.</em>{' '}
                            Get in Touch Today.
                        </h1>
                        <p className="mt-6 max-w-lg font-josefin text-base font-extralight leading-relaxed text-mist/70">
                            Whether you're looking for a home, exploring a commercial space, or just
                            have a question about one of our projects in Chennai, we're happy to hear
                            from you.
                        </p>
                    </div>

                    {/* Contact Info Grid – 3 cards (Mail, Telephone, Address) */}
                    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 sm:grid-cols-2">
                        {/* ── Mail ── */}
                        <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:border-r">
                            <div className="flex items-center justify-between">
                                <h3 className="font-cinzel text-lg font-medium tracking-wide text-champagne-soft">
                                    Mail
                                </h3>
                                {/* mail icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-mist/50"
                                >
                                    <rect width="20" height="16" x="2" y="4" rx="2" />
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <a
                                    href="mailto:auereliaarchitecture@gmail.com"
                                    className="font-josefin text-sm font-extralight text-mist/60 transition-colors hover:text-champagne"
                                >
                                    auereliaarchitecture@gmail.com
                                </a>
                                <a
                                    href="mailto:aurelia@admin.com"
                                    className="font-josefin text-sm font-extralight text-mist/60 transition-colors hover:text-champagne"
                                >
                                    aurelia@admin.com
                                </a>
                                <a
                                    href="mailto:aurelia@service.com"
                                    className="font-josefin text-sm font-extralight text-mist/60 transition-colors hover:text-champagne"
                                >
                                    aurelia@service.com
                                </a>
                            </div>
                        </div>

                        {/* ── Telephone ── */}
                        <div className="flex flex-col gap-4 border-b border-white/10 p-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-cinzel text-lg font-medium tracking-wide text-champagne-soft">
                                    Telephone
                                </h3>
                                {/* phone icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-mist/50"
                                >
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <a
                                    href="tel:+914423456789"
                                    className="font-josefin text-sm font-extralight text-mist/60 transition-colors hover:text-champagne"
                                >
                                    +91 44 2345 6789
                                </a>
                                <a
                                    href="tel:+914428901234"
                                    className="font-josefin text-sm font-extralight text-mist/60 transition-colors hover:text-champagne"
                                >
                                    +91 44 2890 1234
                                </a>
                            </div>
                        </div>

                        {/* ── Address (spans full width on sm+) ── */}
                        <div className="flex flex-col gap-4 p-6 sm:col-span-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-cinzel text-lg font-medium tracking-wide text-champagne-soft">
                                    Address
                                </h3>
                                {/* location icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-mist/50"
                                >
                                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                            </div>
                            <p className="font-josefin text-sm font-extralight leading-relaxed text-mist/60">
                                Aurelia, #39, Anna Salai, Chennai,
                                <br />
                                Tamil Nadu 600 002
                            </p>
                        </div>
                    </div>
                </div>

                {/* ═════════════════════ RIGHT COLUMN – FORM ═════════════════════ */}
                <motion.form
                    onSubmit={handleSubmit}
                    noValidate
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="flex flex-col gap-5 rounded-2xl border border-white/10 p-6 sm:p-8 lg:p-10"
                    style={{
                        background:
                            'linear-gradient(160deg, rgba(28, 24, 40, 0.55), rgba(14, 12, 22, 0.4))',
                        backdropFilter: 'blur(18px) saturate(140%)',
                        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
                        boxShadow:
                            '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                >
                    {inputField('name', 'Name', 'John Doe')}
                    {inputField('email', 'Email', 'johndoe@gmail.com', 'email')}
                    {inputField('phone', 'Phone', '+91 920 220 4449', 'tel')}
                    {inputField('projectType', 'Project Type', 'Residential / Commercial / Interior')}
                    {inputField(
                        'projectLocation',
                        'Project Location',
                        '39, Anna Salai, Chennai, Tamil Nadu 600 002',
                    )}

                    {/* Submit Button */}
                    <motion.button
                        type="submit"
                        disabled={submitStatus === 'submitting'}
                        whileHover={{
                            scale: 1.02,
                            boxShadow: '0 0 28px rgba(201, 160, 99, 0.3)',
                        }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        className="
              group relative mt-3 w-full cursor-pointer overflow-hidden rounded-lg
              border border-champagne/20 bg-night px-6 py-3.5
              font-cinzel text-sm font-medium uppercase tracking-[0.25em] text-champagne-soft
              transition-colors duration-300
              hover:border-champagne/40 hover:bg-champagne/10
              disabled:cursor-not-allowed disabled:opacity-60
            "
                    >
                        {/* Animated shine sweep */}
                        <motion.span
                            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-champagne/10 to-transparent"
                            animate={{ translateX: ['−100%', '200%'] }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                repeatDelay: 3,
                                ease: 'easeInOut',
                            }}
                        />
                        <span className="relative z-10">
                            {submitStatus === 'submitting' ? 'Submitting…' : 'Submit'}
                        </span>
                    </motion.button>
                </motion.form>
            </div>
        </section>
    )
}

export default InquiryForm
