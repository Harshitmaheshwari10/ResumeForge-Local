export const TEMPLATES = [
  { id: 'software_engineer', label: 'Software Engineer' },
  { id: 'data_analyst', label: 'Data Analyst' },
  { id: 'ai_ml_engineer', label: 'AI/ML Engineer' },
  { id: 'full_stack', label: 'Full Stack Developer' },
  { id: 'cybersecurity', label: 'Cybersecurity' },
  { id: 'generic', label: 'Generic Professional' },
]

export function scoreColor(score) {
  if (score >= 80) return 'text-emerald-500'
  if (score >= 60) return 'text-amber-500'
  return 'text-red-500'
}

export function scoreBg(score) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

export function scoreLabel(score) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs Work'
}
