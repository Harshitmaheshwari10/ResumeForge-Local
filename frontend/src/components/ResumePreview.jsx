export default function ResumePreview({ title, text, highlight }) {
  return (
    <div className="card flex h-full flex-col">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div
        className={`flex-1 overflow-auto rounded-lg border p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap ${
          highlight
            ? 'border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-950/30'
            : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50'
        }`}
        style={{ maxHeight: '500px' }}
      >
        {text || 'No content to preview.'}
      </div>
    </div>
  )
}
