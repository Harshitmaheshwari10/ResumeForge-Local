import { extractTextFromFile } from '../engine/documentParser'
import { analyzeJobDescription } from '../engine/jdAnalyzer'
import { exportToDocx, exportToPdf } from '../engine/exportService'
import { optimizeResume } from '../engine/optimizer'
import { storage } from './storage'

function requireUser() {
  const user = storage.getSession()
  if (!user) throw new Error('Not logged in')
  return user
}

export const authApi = {
  async signup(data) {
    const result = await storage.signup(data)
    localStorage.setItem('token', result.access_token)
    localStorage.setItem('user', JSON.stringify(result.user))
    return { data: result }
  },
  async login(data) {
    const result = await storage.login(data)
    localStorage.setItem('token', result.access_token)
    localStorage.setItem('user', JSON.stringify(result.user))
    return { data: result }
  },
  async me() {
    const user = storage.getSession()
    if (!user) throw new Error('Not authenticated')
    return { data: user }
  },
}

export const resumeApi = {
  async analyze({ resumeFile, jobDescription, template, title }) {
    requireUser()
    const resumeText = await extractTextFromFile(resumeFile)
    const result = optimizeResume(resumeText, jobDescription, template)
    const user = storage.getSession()
    storage.saveOptimization(user.id, title || resumeFile.name.replace(/\.[^.]+$/, ''), template, result)
    return { data: result }
  },

  async analyzeText({ resumeText, jobDescription, template, title }) {
    requireUser()
    const result = optimizeResume(resumeText, jobDescription, template)
    const user = storage.getSession()
    storage.saveOptimization(user.id, title || 'Pasted Resume', template, result)
    return { data: result }
  },

  async parseJdFile(file) {
    const text = await extractTextFromFile(file)
    return { data: analyzeJobDescription(text) }
  },

  async history() {
    const user = requireUser()
    return { data: storage.getHistory(user.id) }
  },

  async historyDetail(id) {
    const user = requireUser()
    const record = storage.getHistoryDetail(user.id, id)
    return { data: { ...record, analysis_json: record.analysis } }
  },

  async deleteHistory(id) {
    const user = requireUser()
    storage.deleteHistory(user.id, id)
    return { data: { message: 'Record deleted successfully' } }
  },
}

export const exportApi = {
  async pdf(resumeText) {
    requireUser()
    return { data: exportToPdf(resumeText) }
  },
  async docx(resumeText) {
    requireUser()
    return { data: await exportToDocx(resumeText) }
  },
}

export { downloadBlob } from './storage'
