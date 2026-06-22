const USERS_KEY = 'resumeforge_users'
const HISTORY_KEY = 'resumeforge_history'
const SESSION_KEY = 'resumeforge_session'

async function hashPassword(password) {
  const data = new TextEncoder().encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || []
  } catch {
    return []
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []
  } catch {
    return []
  }
}

function saveHistory(records) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records))
}

export const storage = {
  async signup({ email, password, full_name }) {
    const users = loadUsers()
    const normalized = email.toLowerCase().trim()
    if (users.some((u) => u.email === normalized)) {
      throw new Error('Email already registered')
    }
    const user = {
      id: Date.now(),
      email: normalized,
      full_name: full_name.trim(),
      passwordHash: await hashPassword(password),
      created_at: new Date().toISOString(),
    }
    users.push(user)
    saveUsers(users)
    const session = { id: user.id, email: user.email, full_name: user.full_name, is_active: true, created_at: user.created_at }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return { user: session, access_token: `local-${user.id}` }
  },

  async login({ email, password }) {
    const users = loadUsers()
    const normalized = email.toLowerCase().trim()
    const user = users.find((u) => u.email === normalized)
    if (!user) throw new Error('Invalid email or password')
    const hash = await hashPassword(password)
    if (user.passwordHash !== hash) throw new Error('Invalid email or password')
    const session = { id: user.id, email: user.email, full_name: user.full_name, is_active: true, created_at: user.created_at }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return { user: session, access_token: `local-${user.id}` }
  },

  getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY))
    } catch {
      return null
    }
  },

  logout() {
    localStorage.removeItem(SESSION_KEY)
  },

  getHistory(userId) {
    return loadHistory()
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },

  getHistoryDetail(userId, id) {
    const record = loadHistory().find((r) => r.id === Number(id) && r.user_id === userId)
    if (!record) throw new Error('Record not found')
    return record
  },

  saveOptimization(userId, title, template, result) {
    const records = loadHistory()
    const record = {
      id: Date.now(),
      user_id: userId,
      title: title || 'Untitled Resume',
      template,
      ats_score: result.scores.overall,
      keyword_score: result.scores.keyword_match,
      skill_score: result.scores.skill_match,
      experience_score: result.scores.experience_match,
      education_score: result.scores.education_match,
      formatting_score: result.scores.formatting,
      analysis: result,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    records.unshift(record)
    saveHistory(records)
    return record
  },

  deleteHistory(userId, id) {
    const records = loadHistory().filter((r) => !(r.id === Number(id) && r.user_id === userId))
    saveHistory(records)
  },
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
