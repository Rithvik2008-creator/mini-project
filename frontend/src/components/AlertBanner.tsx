import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

interface AlertBannerProps {
  type: 'success' | 'error' | 'info'
  message: string
  onClose?: () => void
}

export function AlertBanner({ type, message, onClose }: AlertBannerProps) {
  if (!message) return null

  const isSuccess = type === 'success'
  const isError = type === 'error'

  const containerStyle = isSuccess
    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
    : isError
      ? 'bg-rose-50 border-rose-200 text-rose-800'
      : 'bg-blue-50 border-blue-200 text-blue-800'

  const Icon = isSuccess ? CheckCircle2 : isError ? AlertCircle : Info

  return (
    <div
      className={`mb-6 flex items-start justify-between gap-3 rounded-xl border p-4 text-sm shadow-sm transition-all ${containerStyle}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="font-medium leading-relaxed">{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="rounded p-1 text-current opacity-70 hover:opacity-100"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
