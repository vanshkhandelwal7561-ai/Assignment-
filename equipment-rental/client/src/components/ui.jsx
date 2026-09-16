import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'

export function Card({ children, className = '' }) {
  return <div className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-[#27272A] dark:bg-[#18181B] dark:shadow-black/20 ${className}`}>{children}</div>
}

export function StatusBadge({ status }) {
  const styles = {
    BOOKED: 'bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-950/40 dark:text-blue-400',
    ACTIVE: 'bg-indigo-50 text-indigo-700 ring-indigo-600/10 dark:bg-indigo-950/40 dark:text-indigo-400',
    RETURNED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/40 dark:text-emerald-400',
    OVERDUE: 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-950/40 dark:text-red-400',
    CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-500/10 dark:bg-[#27272A] dark:text-[#A1A1AA]',
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status] || styles.CANCELLED}`}>{status}</span>
}

export function Alert({ children, type = 'error', onClose }) {
  const isSuccess = type === 'success'
  return <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${isSuccess ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400'}`} role="alert">
    {isSuccess ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
    <p className="flex-1">{children}</p>
    {onClose && <button type="button" onClick={onClose} aria-label="Dismiss message" className="rounded p-0.5 hover:bg-black/5"><X size={16} /></button>}
  </div>
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} aria-hidden="true" />
}

export function LoadingState({ label = 'Loading' }) {
  return <div className="flex items-center gap-2 py-12 text-sm text-slate-500"><Loader2 size={18} className="animate-spin text-blue-600" />{label}</div>
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-[#27272A] dark:bg-[#18181B]">
    {Icon && <div className="mb-4 rounded-full bg-blue-50 p-3 text-blue-600"><Icon size={22} /></div>}
    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
    {description && <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
}

export function Modal({ title, children, onClose, footer }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-[#27272A] dark:bg-[#1F1F23]" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-[#27272A]"><h2 id="modal-title" className="text-base font-semibold text-slate-900 dark:text-[#FAFAFA]">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[#27272A] dark:hover:text-[#FAFAFA]"><X size={18} /></button></div>
      <div className="px-6 py-5">{children}</div>
      {footer && <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-[#27272A]">{footer}</div>}
    </div>
  </div>
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">{eyebrow}</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>{description && <p className="mt-2 text-sm text-slate-500">{description}</p>}</div>{actions && <div className="shrink-0">{actions}</div>}</div>
}

