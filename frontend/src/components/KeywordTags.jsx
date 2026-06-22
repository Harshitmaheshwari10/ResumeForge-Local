export default function KeywordTags({ keywords, variant = 'found' }) {
  if (!keywords?.length) {
    return <p className="text-sm text-slate-500">None detected.</p>
  }

  const styles = {
    found: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    missing: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    priority: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {keywords.map((kw) => (
        <span
          key={kw}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant] || styles.found}`}
        >
          {kw}
        </span>
      ))}
    </div>
  )
}
