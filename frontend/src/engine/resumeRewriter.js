import { enhanceVerbs, ensureActionVerbStart } from './verbEnhancer'
import { cleanBullet, containsTerm, dedupePreserveOrder, normalizeText } from './textUtils'

const WEAK_PATTERNS = [
  [/^worked on (.+)$/i, 'Developed and maintained $1'],
  [/^made (.+)$/i, 'Developed $1'],
  [/^did (.+)$/i, 'Executed $1'],
  [/^helped (?:with )?(.+)$/i, 'Contributed to $1'],
  [/^used (.+) to (.+)$/i, 'Utilized $1 to $2'],
  [/^built (.+) using (.+)$/i, 'Developed $1 using $2'],
]

function enhanceBullet(bullet) {
  let text = cleanBullet(bullet).trim()
  if (!text) return text

  for (const [pattern, replacement] of WEAK_PATTERNS) {
    if (pattern.test(text)) {
      text = text.replace(pattern, replacement)
      break
    }
  }

  text = enhanceVerbs(text)
  text = ensureActionVerbStart(text)
  if (text && !/[.!?]$/.test(text)) text += '.'
  if (text) text = text[0].toUpperCase() + text.slice(1)
  return text
}

function enhanceProjectDescription(name, description, skills) {
  let desc = description.trim()
  if (!desc) return desc

  desc = ensureActionVerbStart(enhanceVerbs(desc))
  const mentioned = skills.filter((s) => desc.toLowerCase().includes(s.toLowerCase()))
  const techStr = mentioned.slice(0, 3).join(', ') || 'relevant technologies'

  if (desc.length < 40) {
    if (!/using/i.test(desc) && mentioned.length) desc = `Developed ${desc} using ${techStr}.`
    else if (!/[.!?]$/.test(desc)) desc = `Developed ${desc.charAt(0).toLowerCase()}${desc.slice(1)}.`
  }
  return desc
}

function generateSummary(resume, jd) {
  const skills = resume.sections.skills.slice(0, 8)
  const parts = []

  if (resume.sections.summary) {
    parts.push(enhanceVerbs(resume.sections.summary))
  } else {
    let opener = 'Results-driven professional'
    if (skills.length) opener += ` with expertise in ${skills.slice(0, 5).join(', ')}`
    if (resume.sections.experience.length) {
      opener += ` and ${resume.sections.experience.length} professional experience${resume.sections.experience.length > 1 ? 's' : ''}`
    }
    parts.push(`${opener}.`)
  }

  const projNames = resume.sections.projects.slice(0, 2).map((p) => p.name).filter(Boolean)
  if (projNames.length) {
    parts.push(`Demonstrated capabilities through projects including ${projNames.join(', ')}.`)
  }

  if (jd?.technical_skills?.length) {
    const matching = jd.technical_skills.filter((s) => containsTerm(resume.raw_text, s)).slice(0, 5)
    if (matching.length) {
      parts.push(`Proficient in ${matching.join(', ')} with a track record of delivering quality outcomes.`)
    }
  }

  return parts.join(' ')
}

export function renderResumeText(sections) {
  const lines = []
  const { contact } = sections

  if (contact.name) lines.push(contact.name.toUpperCase())
  const contactLine = ['email', 'phone', 'linkedin', 'website']
    .filter((k) => contact[k])
    .map((k) => contact[k])
    .join(' | ')
  if (contactLine) lines.push(contactLine)
  lines.push('')

  if (sections.summary) {
    lines.push('PROFESSIONAL SUMMARY', sections.summary, '')
  }
  if (sections.skills?.length) {
    lines.push('SKILLS', sections.skills.join(', '), '')
  }
  if (sections.experience?.length) {
    lines.push('PROFESSIONAL EXPERIENCE')
    for (const exp of sections.experience) {
      if (exp.title) lines.push(exp.dates ? `${exp.title} | ${exp.dates}` : exp.title)
      for (const b of exp.bullets || []) lines.push(`• ${b}`)
      lines.push('')
    }
  }
  if (sections.projects?.length) {
    lines.push('PROJECTS')
    for (const p of sections.projects) {
      if (p.name) lines.push(p.name)
      if (p.description) lines.push(`• ${p.description}`)
    }
    lines.push('')
  }
  if (sections.education?.length) {
    lines.push('EDUCATION')
    for (const edu of sections.education) {
      if (edu.institution) lines.push(edu.institution)
      if (edu.degree) lines.push(edu.degree)
      for (const d of edu.details || []) lines.push(`• ${d}`)
    }
    lines.push('')
  }
  if (sections.certifications?.length) {
    lines.push('CERTIFICATIONS')
    for (const c of sections.certifications) lines.push(`• ${c}`)
    lines.push('')
  }
  if (sections.achievements?.length) {
    lines.push('ACHIEVEMENTS')
    for (const a of sections.achievements) lines.push(`• ${a}`)
  }

  return normalizeText(lines.join('\n'))
}

export function rewriteResume(resume, jd, template = 'generic') {
  const { sections } = resume
  const jdSkillLower = new Set([...jd.technical_skills, ...jd.soft_skills].map((s) => s.toLowerCase()))
  const prioritySkills = sections.skills.filter((s) => jdSkillLower.has(s.toLowerCase()))
  const otherSkills = sections.skills.filter((s) => !jdSkillLower.has(s.toLowerCase()))

  const newSections = {
    contact: { ...sections.contact },
    summary: generateSummary(resume, jd),
    education: sections.education,
    experience: sections.experience.map((e) => ({
      ...e,
      bullets: (e.bullets || []).map(enhanceBullet),
    })),
    projects: sections.projects.map((p) => ({
      ...p,
      description: enhanceProjectDescription(p.name, p.description, sections.skills),
    })),
    skills: dedupePreserveOrder([...prioritySkills, ...otherSkills]),
    certifications: sections.certifications,
    achievements: sections.achievements.map(enhanceBullet),
  }

  const optimized_text = renderResumeText(newSections)
  return {
    raw_text: optimized_text,
    sections: newSections,
    word_count: optimized_text.split(/\s+/).filter(Boolean).length,
    template,
  }
}
