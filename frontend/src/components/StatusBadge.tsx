interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const normalized = status.toUpperCase()

  let style = 'bg-slate-100 text-slate-700 border-slate-200'

  if (normalized === 'PENDING') {
    style = 'bg-amber-50 text-amber-700 border-amber-200'
  } else if (normalized === 'ASSIGNED' || normalized === 'BUSY' || normalized === 'ON REPAIR') {
    style = 'bg-blue-50 text-blue-700 border-blue-200'
  } else if (normalized === 'COMPLETED' || normalized === 'AVAILABLE' || normalized === 'OPEN' || normalized === 'ROUTE OK') {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200'
  } else if (normalized === 'CLOSED' || normalized === 'UNREACHABLE' || normalized === 'ERROR') {
    style = 'bg-rose-50 text-rose-700 border-rose-200'
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${style} ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          normalized === 'PENDING'
            ? 'bg-amber-500'
            : normalized === 'ASSIGNED' || normalized === 'BUSY'
              ? 'bg-blue-500'
              : normalized === 'COMPLETED' || normalized === 'AVAILABLE' || normalized === 'OPEN' || normalized === 'ROUTE OK'
                ? 'bg-emerald-500'
                : 'bg-rose-500'
        }`}
      />
      {status}
    </span>
  )
}
