import { computeSimilarity, matchKeywords } from './nlpEngine'
import { containsTerm, wordFrequency } from './textUtils'

function scoreKeywordMatch(resumeText, jd) {
  if (!jd.keywords?.length) return 50
  const [found] = matchKeywords(resumeText, jd.keywords)
  const ratio = found.length / jd.keywords.length
  if (jd.high_priority_keywords?.length) {
    const [hpFound] = matchKeywords(resumeText, jd.high_priority_keywords)
    const hpRatio = hpFound.length / jd.high_priority_keywords.length
    return Math.min(100, (ratio * 0.6 + hpRatio * 0.4) * 100)
  }
  return Math.min(100, ratio * 100)
}

function scoreSkillMatch(resume, jd) {
  const resumeSkills = new Set(resume.sections.skills.map((s) => s.toLowerCase()))
  const jdSkills = [...jd.technical_skills, ...jd.soft_skills].map((s) => s.toLowerCase())
  if (!jdSkills.length) return 60
  let matched = 0
  for (const skill of jdSkills) {
    if (resumeSkills.has(skill) || containsTerm(resume.raw_text, skill)) matched++
  }
  return Math.min(100, (matched / jdSkills.length) * 100)
}

function scoreExperienceMatch(resume, jd) {
  const expText = resume.sections.experience
    .map((e) => `${e.title} ${(e.bullets || []).join(' ')}`)
    .join(' ')
  if (!expText.trim()) return 30

  let sim = computeSimilarity(expText, jd.raw_text)
  const yearsJd = [...jd.raw_text.toLowerCase().matchAll(/(\d+)\+?\s*years?/g)].map((m) => parseInt(m[1], 10))
  const yearsRes = [...resume.raw_text.toLowerCase().matchAll(/(\d+)\+?\s*years?/g)].map((m) => parseInt(m[1], 10))
  let bonus = 0
  if (yearsJd.length && yearsRes.length) {
    const req = Math.max(...yearsJd)
    const res = Math.max(...yearsRes)
    if (res >= req) bonus = 0.15
    else if (res >= req * 0.7) bonus = 0.08
  }
  return Math.min(100, (sim + bonus) * 100)
}

function scoreEducationMatch(resume, jd) {
  const eduText = resume.sections.education
    .map((e) => `${e.institution} ${e.degree}`)
    .join(' ')
  if (!eduText.trim()) return 40

  const degrees = ['bachelor', 'master', 'phd', 'doctorate', 'associate', 'mba', 'b.s.', 'm.s.', 'b.a.', 'm.a.']
  const required = degrees.filter((d) => jd.raw_text.toLowerCase().includes(d))
  if (!required.length) return 75
  const eduLower = eduText.toLowerCase()
  const matched = required.filter((d) => eduLower.includes(d)).length
  return matched ? Math.min(100, (matched / required.length) * 100) : 45
}

function scoreFormatting(resume) {
  const text = resume.raw_text
  let score = 100
  score -= Math.min(20, text.split('\n').filter((l) => (l.match(/\|/g) || []).length >= 3).length * 5)
  score -= Math.min(15, text.split('\n').filter((l) => l.length > 120).length * 3)
  score += Math.min(10, text.split('\n').filter((l) => {
    const t = l.trim()
    return t && t === t.toUpperCase() && t.length < 40
  }).length * 2)
  score += Math.min(10, text.split('\n').filter((l) => /^[\s•\-*]/.test(l)).length)
  if (/\[image\]|<img|\.png|\.jpg|\.svg/i.test(text)) score -= 15
  if (resume.word_count < 200) score -= 10
  else if (resume.word_count > 1200) score -= 5
  return Math.max(0, Math.min(100, score))
}

export function calculateAtsScores(resume, jd) {
  const keyword_match = scoreKeywordMatch(resume.raw_text, jd)
  const skill_match = scoreSkillMatch(resume, jd)
  const experience_match = scoreExperienceMatch(resume, jd)
  const education_match = scoreEducationMatch(resume, jd)
  const formatting = scoreFormatting(resume)
  const overall =
    keyword_match * 0.3 +
    skill_match * 0.25 +
    experience_match * 0.25 +
    education_match * 0.1 +
    formatting * 0.1

  const round = (n) => Math.round(n * 10) / 10
  return {
    keyword_match: round(keyword_match),
    skill_match: round(skill_match),
    experience_match: round(experience_match),
    education_match: round(education_match),
    formatting: round(formatting),
    overall: round(overall),
  }
}

export function analyzeKeywords(resumeText, jd) {
  const [found_keywords, missing_keywords] = matchKeywords(resumeText, jd.keywords)
  const [hpFound, hpMissing] = matchKeywords(resumeText, jd.high_priority_keywords)
  const freq = wordFrequency(resumeText)
  const keyword_frequency = Object.fromEntries(jd.keywords.map((kw) => [kw, freq[kw.toLowerCase()] || 0]))

  return {
    found_keywords,
    missing_keywords,
    high_priority_keywords: [...hpFound, ...hpMissing.filter((k) => !hpFound.includes(k))],
    keyword_frequency,
  }
}

export function analyzeSkillGap(resume, jd) {
  const resume_skills = [...new Set(resume.sections.skills)]
  const jd_skills = [...new Set([...jd.technical_skills, ...jd.soft_skills])]
  const matching_skills = []
  const missing_skills = []

  for (const skill of jd_skills) {
    if (resume_skills.some((s) => s.toLowerCase() === skill.toLowerCase()) || containsTerm(resume.raw_text, skill)) {
      matching_skills.push(skill)
    } else {
      missing_skills.push(skill)
    }
  }

  const reqText = jd.requirements.join(' ').toLowerCase()
  let recommended_skills = missing_skills.filter((s) => reqText.includes(s.toLowerCase())).slice(0, 10)
  if (!recommended_skills.length) recommended_skills = missing_skills.slice(0, 8)

  return { matching_skills, missing_skills, recommended_skills, resume_skills, jd_skills }
}

export function generateSuggestions(scores, keywordAnalysis, skillGap) {
  const suggestions = []
  if (scores.keyword_match < 70 && keywordAnalysis.missing_keywords.length) {
    suggestions.push(`Incorporate these JD keywords naturally into your experience bullets: ${keywordAnalysis.missing_keywords.slice(0, 5).join(', ')}.`)
  }
  if (scores.skill_match < 70 && skillGap.missing_skills.length) {
    suggestions.push(`Highlight relevant experience with: ${skillGap.missing_skills.slice(0, 5).join(', ')}.`)
  }
  if (scores.formatting < 80) {
    suggestions.push('Use a single-column layout with clear section headers and standard bullet points for ATS compatibility.')
  }
  if (scores.experience_match < 65) {
    suggestions.push('Align experience bullets with job responsibilities using similar terminology from the job description.')
  }
  if (scores.education_match < 60) {
    suggestions.push('Ensure education section clearly lists your degree and institution as stated in your original resume.')
  }
  if (!suggestions.length) {
    suggestions.push('Your resume is well-aligned. Fine-tune bullet points to mirror high-priority keywords from the job description.')
  }
  return suggestions
}
