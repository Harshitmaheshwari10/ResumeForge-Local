import { extractKeywordsTfidf, extractSkillsFromText } from './nlpEngine'
import { dedupePreserveOrder, extractSentences, normalizeText } from './textUtils'

function extractListItems(text, headers) {
  const pattern = headers.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const sections = text.split(new RegExp(`(?:${pattern})\\s*:?\\s*\\n`, 'i'))
  const items = []
  if (sections.length > 1) {
    for (const line of sections[1].split('\n')) {
      const trimmed = line.trim()
      if (/^[\s•\-*]/.test(trimmed)) items.push(trimmed.replace(/^[\s•\-*]+\s*/, ''))
      else if (trimmed.length > 15 && !/^[A-Z\s]{3,}$/.test(trimmed) && items.length < 20) items.push(trimmed)
    }
  }
  return items.slice(0, 15)
}

export function analyzeJobDescription(text) {
  const raw_text = normalizeText(text)
  const [technical_skills, soft_skills] = extractSkillsFromText(raw_text)

  let responsibilities = extractListItems(raw_text, ['responsibilities', 'duties', 'what you will do', "what you'll do", 'role'])
  let requirements = extractListItems(raw_text, ['requirements', 'qualifications', 'must have', 'required', 'minimum qualifications'])

  if (!responsibilities.length) {
    responsibilities = extractSentences(raw_text).filter((s) =>
      /responsible|develop|manage|lead|design|implement/i.test(s),
    ).slice(0, 8)
  }
  if (!requirements.length) {
    requirements = extractSentences(raw_text).filter((s) =>
      /required|must|minimum|years|degree|experience/i.test(s),
    ).slice(0, 8)
  }

  const keywords = extractKeywordsTfidf([raw_text], 40)
  const reqText = requirements.join(' ').toLowerCase()
  const techText = technical_skills.join(' ').toLowerCase()
  const high_priority_keywords = dedupePreserveOrder(
    keywords.filter((kw) => reqText.includes(kw.toLowerCase()) || techText.includes(kw.toLowerCase())),
  ).slice(0, 20)

  const allKeywords = dedupePreserveOrder([...keywords, ...technical_skills, ...soft_skills])

  return {
    raw_text,
    technical_skills,
    soft_skills,
    responsibilities,
    requirements,
    keywords: allKeywords,
    high_priority_keywords: high_priority_keywords.length ? high_priority_keywords : allKeywords.slice(0, 15),
  }
}
