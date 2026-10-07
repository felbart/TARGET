import { useState } from 'react'

export function Card({ title, subtitle, icon, actions, className = '', children }) {
  return (
    <section
      className={`rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] backdrop-blur sm:p-6 ${className}`}
    >
      {(title || actions) && (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
              {icon && <span className="text-emerald-400">{icon}</span>}
              {title}
            </h3>
            {subtitle && <p className="mt-1 text-xs leading-relaxed text-zinc-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

const btnVariants = {
  primary:
    'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 focus-visible:ring-emerald-400/40 font-semibold',
  secondary:
    'border border-zinc-700 bg-zinc-800/60 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800 focus-visible:ring-zinc-500/30',
  ghost: 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100 focus-visible:ring-zinc-500/30',
  danger: 'text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 focus-visible:ring-rose-500/30',
}

export function Button({ variant = 'secondary', size = 'md', className = '', ...props }) {
  const sizes = { sm: 'h-8 px-2.5 text-xs', md: 'h-9 px-3.5 text-sm', icon: 'h-8 w-8 justify-center' }
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-lg transition outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40 ${sizes[size]} ${btnVariants[variant]} ${className}`}
      {...props}
    />
  )
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-[11px] text-zinc-600">{hint}</span>}
    </label>
  )
}

export function Input(props) {
  return <input {...props} className={`field ${props.className ?? ''}`} />
}

export function Textarea({ rows = 2, ...props }) {
  return <textarea rows={rows} {...props} className={`field resize-y leading-relaxed ${props.className ?? ''}`} />
}

export function Select({ options, ...props }) {
  return (
    <select {...props} className={`field cursor-pointer pr-8 ${props.className ?? ''}`}>
      {options.map((o) => {
        const value = typeof o === 'string' ? o : o.value
        const label = typeof o === 'string' ? o : o.label
        return (
          <option key={value} value={value} className="bg-zinc-900">
            {label}
          </option>
        )
      })}
    </select>
  )
}

export function Switch({ checked, onChange, label, description }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-start gap-3 rounded-lg p-2 text-left transition hover:bg-zinc-800/40"
    >
      <span
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full border transition ${
          checked ? 'border-emerald-400/50 bg-emerald-500/80' : 'border-zinc-700 bg-zinc-800'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[18px]' : 'left-0.5 bg-zinc-400'
          }`}
        />
      </span>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm text-zinc-200">{label}</span>}
          {description && <span className="block text-xs text-zinc-500">{description}</span>}
        </span>
      )}
    </button>
  )
}

export function Checkbox({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 transition hover:border-zinc-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/40 ${
          checked ? 'border-emerald-400 bg-emerald-500 text-zinc-950' : 'border-zinc-600 bg-zinc-900'
        }`}
      >
        {checked && <IconCheck className="h-3 w-3" />}
      </span>
      <span className="text-sm leading-snug text-zinc-300">{children}</span>
    </label>
  )
}

const badgeTones = {
  zinc: 'border-zinc-700 bg-zinc-800/60 text-zinc-300',
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  rose: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
}

export function Badge({ tone = 'zinc', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeTones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export function Progress({ value, max = 100, tone = 'emerald', className = '' }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0))
  const bar = tone === 'cyan' ? 'from-cyan-500 to-cyan-300' : 'from-emerald-500 to-cyan-400'
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-zinc-800 ${className}`}>
      <div className={`h-full rounded-full bg-gradient-to-r ${bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Stat({ label, value, hint, accent = false }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`mt-1 truncate font-mono text-xl font-semibold tabular-nums sm:text-2xl ${accent ? 'text-emerald-300' : 'text-zinc-100'}`}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-zinc-500">{hint}</div>}
    </div>
  )
}

export function CopyButton({ text, label = 'Copiar', size = 'sm', variant = 'secondary' }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <Button variant={variant} size={size} onClick={copy} aria-label={label}>
      {copied ? <IconCheck className="h-3.5 w-3.5 text-emerald-400" /> : <IconCopy className="h-3.5 w-3.5" />}
      {size !== 'icon' && (copied ? 'Copiado!' : label)}
    </Button>
  )
}

export function EmptyState({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">{children}</div>
  )
}

/* ---------- Ícones (inline SVG, sem dependências) ---------- */
const svg = (path) =>
  function Icon({ className = 'h-4 w-4' }) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
        {path}
      </svg>
    )
  }

export const IconCheck = svg(<path d="M20 6 9 17l-5-5" />)
export const IconCopy = svg(
  <>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </>,
)
export const IconPlus = svg(<path d="M12 5v14M5 12h14" />)
export const IconTrash = svg(
  <>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </>,
)
export const IconTarget = svg(
  <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </>,
)
export const IconLayers = svg(
  <>
    <path d="m12 2 10 5-10 5L2 7l10-5Z" />
    <path d="m2 17 10 5 10-5M2 12l10 5 10-5" />
  </>,
)
export const IconBox = svg(
  <>
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
    <path d="m3 8 9 5 9-5M12 13v8" />
  </>,
)
export const IconFlask = svg(
  <>
    <path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3" />
    <path d="M7 15h10" />
  </>,
)
export const IconCalendar = svg(
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </>,
)
export const IconAlert = svg(
  <>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </>,
)
export const IconShield = svg(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />)
export const IconSpark = svg(<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />)
export const IconLink = svg(
  <>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </>,
)
export const IconDownload = svg(<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />)
export const IconUpload = svg(<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />)
export const IconShuffle = svg(<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />)
export const IconCode = svg(<path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />)
