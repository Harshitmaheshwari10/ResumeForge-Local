import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api

export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

export const resumeApi = {
  analyze: (formData) =>
    api.post('/resume/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  analyzeText: (formData) =>
    api.post('/resume/analyze-text', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  parseJd: (formData) =>
    api.post('/resume/parse-jd', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  history: () => api.get('/resume/history'),
  historyDetail: (id) => api.get(`/resume/history/${id}`),
  deleteHistory: (id) => api.delete(`/resume/history/${id}`),
}

export const exportApi = {
  pdf: (resumeText) => {
    const form = new FormData()
    form.append('resume_text', resumeText)
    return api.post('/export/pdf', form, { responseType: 'blob' })
  },
  docx: (resumeText) => {
    const form = new FormData()
    form.append('resume_text', resumeText)
    return api.post('/export/docx', form, { responseType: 'blob' })
  },
}

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}
