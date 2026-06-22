const WEAK_VERBS = [
  ['worked on', 'developed'],
  ['worked with', 'collaborated on'],
  ['helped with', 'contributed to'],
  ['helped', 'supported'],
  ['was responsible for', 'managed'],
  ['responsible for', 'managed'],
  ['participated in', 'contributed to'],
  ['involved in', 'contributed to'],
  ['in charge of', 'led'],
  ['assisted with', 'supported'],
  ['assisted in', 'supported'],
  ['looked into', 'investigated'],
  ['looked at', 'analyzed'],
  ['tried to', 'implemented'],
  ['dealt with', 'addressed'],
  ['made', 'developed'],
  ['did', 'executed'],
  ['handled', 'managed'],
  ['used', 'utilized'],
  ['fixed', 'resolved'],
]

const STRONG_VERBS = new Set([
  'achieved', 'analyzed', 'architected', 'automated', 'built', 'collaborated', 'configured',
  'created', 'delivered', 'designed', 'developed', 'engineered', 'enhanced', 'executed',
  'implemented', 'improved', 'increased', 'integrated', 'launched', 'led', 'maintained',
  'managed', 'optimized', 'orchestrated', 'produced', 'reduced', 'refactored', 'resolved',
  'streamlined', 'utilized',
])

export function enhanceVerbs(text) {
  let result = text
  for (const [weak, strong] of WEAK_VERBS) {
    const re = new RegExp(weak.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    if (re.test(result)) {
      result = result.replace(re, strong)
      break
    }
  }
  result = result.trim()
  if (result && result[0] === result[0].toLowerCase()) {
    result = result[0].toUpperCase() + result.slice(1)
  }
  return result
}

function startsWithVerb(text) {
  const first = text.split(/\s+/)[0]?.toLowerCase().replace(/[.,;:]$/, '') || ''
  return STRONG_VERBS.has(first) || first.endsWith('ed')
}

export function ensureActionVerbStart(text) {
  if (!text || startsWithVerb(text)) return text
  return `Developed ${text[0].toLowerCase()}${text.slice(1)}`
}
