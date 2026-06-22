import {
  STOP_WORDS, containsTerm, dedupePreserveOrder, tokenizeWords,
} from './textUtils'

export const TECH_SKILLS = [
  'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue', 'node', 'nodejs',
  'express', 'fastapi', 'django', 'flask', 'spring', 'sql', 'mysql', 'postgresql', 'mongodb',
  'redis', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins',
  'git', 'github', 'gitlab', 'ci/cd', 'linux', 'bash', 'powershell', 'html', 'css', 'tailwind',
  'sass', 'webpack', 'vite', 'graphql', 'rest', 'api', 'microservices', 'machine learning',
  'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'nlp',
  'computer vision', 'data analysis', 'tableau', 'power bi', 'excel', 'spark', 'hadoop', 'kafka',
  'cybersecurity', 'siem', 'penetration testing', 'network security', 'firewall', 'owasp',
  'encryption', 'ssl', 'tls', 'vpn', 'iam', 'oauth', 'jwt', 'agile', 'scrum', 'jira', 'figma',
  'selenium', 'pytest', 'junit', 'maven', 'gradle', 'npm', 'yarn', 'go', 'golang', 'rust',
  'scala', 'kotlin', 'swift', 'c++', 'c#', '.net', 'devops', 'mlops', 'etl', 'snowflake',
  'databricks', 'airflow', 'bigquery',
]

export const SOFT_SKILLS = [
  'communication', 'leadership', 'teamwork', 'collaboration', 'problem solving',
  'critical thinking', 'time management', 'adaptability', 'creativity', 'attention to detail',
  'analytical', 'interpersonal', 'presentation', 'negotiation', 'mentoring',
  'stakeholder management', 'project management', 'strategic planning', 'decision making',
  'initiative', 'self-motivated', 'organized', 'multitasking', 'cross-functional',
]

function buildNgrams(tokens, n) {
  const ngrams = []
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '))
  }
  return ngrams
}

export function extractKeywordsTfidf(texts, topN = 30) {
  const joined = texts.filter((t) => t?.trim()).join(' ')
  if (!joined.trim()) return []

  const tokens = tokenizeWords(joined).filter((t) => !STOP_WORDS.has(t) && t.length > 2)
  const unigrams = tokens
  const bigrams = buildNgrams(tokens, 2)
  const terms = [...unigrams, ...bigrams]

  const freq = {}
  for (const term of terms) {
    freq[term] = (freq[term] || 0) + 1
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([term]) => term)
}

function termVector(text) {
  const tokens = tokenizeWords(text)
  const unigrams = tokens.filter((t) => !STOP_WORDS.has(t))
  const terms = [...unigrams, ...buildNgrams(unigrams, 2)]
  const vec = {}
  for (const t of terms) vec[t] = (vec[t] || 0) + 1
  return vec
}

export function computeSimilarity(textA, textB) {
  if (!textA?.trim() || !textB?.trim()) return 0
  const vecA = termVector(textA)
  const vecB = termVector(textB)
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)])
  let dot = 0
  let normA = 0
  let normB = 0
  for (const k of keys) {
    const a = vecA[k] || 0
    const b = vecB[k] || 0
    dot += a * b
    normA += a * a
    normB += b * b
  }
  if (!normA || !normB) return 0
  return Math.max(0, Math.min(1, dot / (Math.sqrt(normA) * Math.sqrt(normB))))
}

export function extractSkillsFromText(text) {
  const technical = []
  const soft = []

  for (const skill of TECH_SKILLS) {
    if (containsTerm(text, skill)) {
      technical.push(skill.length > 3 ? skill.replace(/\b\w/g, (c) => c.toUpperCase()) : skill.toUpperCase())
    }
  }
  for (const skill of SOFT_SKILLS) {
    if (containsTerm(text, skill)) {
      soft.push(skill.replace(/\b\w/g, (c) => c.toUpperCase()))
    }
  }

  return [dedupePreserveOrder(technical), dedupePreserveOrder(soft)]
}

export function matchKeywords(resumeText, jdKeywords) {
  const found = []
  const missing = []
  for (const kw of jdKeywords) {
    if (containsTerm(resumeText, kw)) found.push(kw)
    else missing.push(kw)
  }
  return [found, missing]
}
