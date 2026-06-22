import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import { resumeApi } from '../services/api'
import { TEMPLATES } from '../utils/helpers'

export default function OptimizePage() {
  const navigate = useNavigate()
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [useText, setUseText] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [template, setTemplate] = useState('generic')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleJdFile = async (file) => {
    if (!file) return
    try {
      const res = await resumeApi.parseJdFile(file)
      setJobDescription(res.data.raw_text)
    } catch (err) {
      setError(err.message || 'Failed to parse job description file')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let res
      if (useText) {
        res = await resumeApi.analyzeText({
          resumeText,
          jobDescription,
          template,
          title: title || 'Pasted Resume',
        })
      } else {
        if (!resumeFile) {
          setError('Please upload a resume file')
          setLoading(false)
          return
        }
        res = await resumeApi.analyze({
          resumeFile,
          jobDescription,
          template,
          title: title || resumeFile.name.replace(/\.[^.]+$/, ''),
        })
      }

      sessionStorage.setItem('lastResult', JSON.stringify(res.data))
      navigate('/results')
    } catch (err) {
      setError(err.message || 'Optimization failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Optimize Resume</h1>
        <p className="mt-1 text-slate-500">
          Everything runs in your browser — no server required
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold">Your Resume</h2>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUseText(false)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  !useText ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40' : 'text-slate-500'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setUseText(true)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  useText ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40' : 'text-slate-500'
                }`}
              >
                Paste Text
              </button>
            </div>

            {!useText ? (
              <div>
                <label className="label">Resume (PDF or DOCX)</label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  className="input"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div>
                <label className="label">Resume Text</label>
                <textarea
                  className="input min-h-[200px] font-mono text-xs"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here..."
                  required={useText}
                />
              </div>
            )}

            <div>
              <label className="label">Title (optional)</label>
              <input
                type="text"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Engineer Resume"
              />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold">Job Description</h2>

            <div>
              <label className="label">Upload JD (PDF/DOCX/TXT) — optional</label>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="input"
                onChange={(e) => handleJdFile(e.target.files[0])}
              />
            </div>

            <div>
              <label className="label">Job Description Text</label>
              <textarea
                className="input min-h-[200px] text-sm"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                required
                minLength={20}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Resume Template</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((t) => (
              <label
                key={t.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${
                  template === t.id
                    ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-950/30'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value={t.id}
                  checked={template === t.id}
                  onChange={() => setTemplate(t.id)}
                  className="text-brand-600"
                />
                <div>
                  <p className="font-medium text-sm">{t.label}</p>
                  <p className="text-xs text-slate-500">ATS-safe single column</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary px-8" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" /> Analyzing locally...
              </span>
            ) : (
              'Analyze & Optimize'
            )}
          </button>
        </div>
      </form>
    </Layout>
  )
}
