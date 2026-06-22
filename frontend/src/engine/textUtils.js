const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this', 'that', 'these',
  'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why',
  'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
])

export { STOP_WORDS }

export function normalizeText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function tokenizeWords(text) {
  return (text.toLowerCase().match(/[a-zA-Z][a-zA-Z0-9+#.-]*/g) || [])
}

export function extractSentences(text) {
  return text
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function wordFrequency(text) {
  const freq = {}
  for (const t of tokenizeWords(text)) {
    freq[t] = (freq[t] || 0) + 1
  }
  return freq
}

export function cleanBullet(text) {
  return text.trim().replace(/^[\s•\-*●○▪►]+\s*/, '')
}

export function isBulletLine(line) {
  return /^[\s•\-*●○▪►]/.test(line.trim())
}

export function dedupePreserveOrder(items) {
  const seen = new Set()
  const result = []
  for (const item of items) {
    const key = item.toLowerCase().trim()
    if (key && !seen.has(key)) {
      seen.add(key)
      result.push(item.trim())
    }
  }
  return result
}

export function containsTerm(text, term) {
  if (!term || !text) return false
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text)
}
