import {
  cleanBullet, isBulletLine, normalizeText,
} from './textUtils'

const SECTION_PATTERNS = {
  contact: ['contact', 'personal information', 'personal details'],
  summary: ['summary', 'professional summary', 'profile', 'objective', 'career objective', 'about me', 'professional profile'],
  education: ['education', 'academic background', 'academics', 'qualifications'],
  experience: ['experience', 'work experience', 'professional experience', 'employment history', 'work history', 'career history'],
  projects: ['projects', 'personal projects', 'key projects', 'project experience'],
  skills: ['skills', 'technical skills', 'core competencies', 'competencies', 'technologies'],
  certifications: ['certifications', 'certificates', 'licenses', 'credentials'],
  achievements: ['achievements', 'awards', 'honors', 'accomplishments'],
}

function isSectionHeader(line) {
  const cleaned = line.replace(/[^a-zA-Z\s/&]/g, '').trim().toLowerCase()
  if (!cleaned || cleaned.length > 60) return null
  for (const [key, aliases] of Object.entries(SECTION_PATTERNS)) {
    for (const alias of aliases) {
      if (cleaned === alias || cleaned.startsWith(`${alias} `)) return key
    }
  }
  return null
}

function parseContact(lines) {
  const contact = {}
  const emailRe = /[\w.+-]+@[\w-]+\.[\w.-]+/
  const phoneRe = /(\+?\d[\d\s().-]{7,}\d)/
  const urlRe = /https?:\/\/\S+|www\.\S+|linkedin\.com\/\S+|github\.com\/\S+/i

  for (const line of lines) {
    const email = line.match(emailRe)
    if (email) contact.email = email[0]
    const phone = line.match(phoneRe)
    if (phone) contact.phone = phone[0].trim()
    const url = line.match(urlRe)
    if (url) contact[url[0].toLowerCase().includes('linkedin') ? 'linkedin' : 'website'] = url[0]
    if (!contact.name && line && !line.includes('@') && !line.toLowerCase().includes('http')) {
      if (line.split(/\s+/).length <= 5 && !/\d{3}/.test(line)) contact.name = line.trim()
    }
  }
  return contact
}

function looksLikeHeader(line) {
  return line === line.toUpperCase() || (line.length < 60 && line.endsWith(':'))
}

function parseBulletSection(content) {
  const items = []
  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (isBulletLine(line)) items.push(cleanBullet(line))
    else if (items.length && !looksLikeHeader(line)) items[items.length - 1] += ` ${line}`
    else if (!looksLikeHeader(line) && line.length > 10) items.push(line)
  }
  return items
}

function parseExperience(content) {
  const entries = []
  const blocks = content.split(/\n(?=[A-Z][^\n]{5,}(?:\|| at | - |\d{4}))/)

  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue
    const lines = trimmed.split('\n')
    const dateMatch = trimmed.match(/(\w+\s+\d{4}|\d{4})\s*[-–—]\s*(\w+\s+\d{4}|\d{4}|present|current)/i)
    entries.push({
      title: lines[0]?.trim() || '',
      dates: dateMatch ? dateMatch[0] : '',
      bullets: parseBulletSection(lines.slice(1).join('\n')),
      raw: trimmed,
    })
  }

  if (!entries.length) {
    const bullets = parseBulletSection(content)
    if (bullets.length) entries.push({ title: '', dates: '', bullets, raw: content })
  }
  return entries
}

function parseEducation(content) {
  return content.split(/\n{2,}/).filter(Boolean).map((block) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    return {
      institution: lines[0] || '',
      degree: lines[1] || '',
      details: lines.slice(2),
      raw: block.trim(),
    }
  })
}

function parseProjects(content) {
  return content.split(/\n{2,}/).filter(Boolean).map((block) => {
    const lines = block.split('\n')
    return {
      name: lines[0]?.trim() || '',
      description: lines.slice(1).filter((l) => l.trim()).map(cleanBullet).join(' '),
      raw: block.trim(),
    }
  })
}

export function parseResume(text) {
  const normalized = normalizeText(text)
  const lines = normalized.split('\n')
  const sectionContent = Object.fromEntries(Object.keys(SECTION_PATTERNS).map((k) => [k, []]))
  let current = 'contact'

  for (const line of lines) {
    const section = isSectionHeader(line)
    if (section) {
      current = section
      continue
    }
    sectionContent[current].push(line)
  }

  const sections = {
    contact: parseContact([...sectionContent.contact, ...lines.slice(0, 5)]),
    summary: sectionContent.summary.join('\n').trim(),
    education: parseEducation(sectionContent.education.join('\n')),
    experience: parseExperience(sectionContent.experience.join('\n')),
    projects: parseProjects(sectionContent.projects.join('\n')),
    skills: sectionContent.skills.join('\n').split(/[,;|•\n]/).map((s) => s.trim()).filter((s) => s.length > 1),
    certifications: parseBulletSection(sectionContent.certifications.join('\n')),
    achievements: parseBulletSection(sectionContent.achievements.join('\n')),
  }

  return {
    raw_text: normalized,
    sections,
    word_count: normalized.split(/\s+/).filter(Boolean).length,
  }
}
