import { scoreBg } from '../utils/helpers'

export default function ProgressBar({ label, value, max = 100 }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-slate-500">{Math.round(value)}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-700 ${scoreBg(value)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
