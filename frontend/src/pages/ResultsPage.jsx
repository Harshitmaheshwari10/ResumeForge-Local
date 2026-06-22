import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import KeywordTags from '../components/KeywordTags'
import LoadingSpinner from '../components/LoadingSpinner'
import ProgressBar from '../components/ProgressBar'
import ResumePreview from '../components/ResumePreview'
import ScoreChart from '../components/ScoreChart'
import ScoreRing from '../components/ScoreRing'
import { downloadBlob, exportApi, resumeApi } from '../services/api'
import { scoreLabel } from '../utils/helpers'

function ResultsView({ result }) {
  const [exporting, setExporting] = useState('')

  const handleExport = async (fmt) => {
    setExporting(fmt)
    try {
      const res = fmt === 'pdf' ? await exportApi.pdf(result.optimized_text) : await exportApi.docx(result.optimized_text)
      downloadBlob(res.data, `optimized_resume.${fmt}`)
    } catch {
      alert('Export failed')
    } finally {
      setExporting('')
    }
  }

  const { scores, keyword_analysis, skill_gap, suggestions } = result

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Optimization Results</h1>
          <p className="mt-1 text-slate-500">
            ATS Score: {scoreLabel(scores.overall)} ({Math.round(scores.overall)}/100)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('pdf')}
            className="btn-secondary"
            disabled={!!exporting}
          >
            {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
          </button>
          <button
            onClick={() => handleExport('docx')}
            className="btn-secondary"
            disabled={!!exporting}
          >
            {exporting === 'docx' ? 'Exporting...' : 'Export DOCX'}
          </button>
          <Link to="/optimize" className="btn-primary">
            New Optimization
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card flex flex-col items-center justify-center">
          <ScoreRing score={scores.overall} size={140} label="Overall ATS Score" />
        </div>
        <div className="card lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Score Breakdown</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <ProgressBar label="Keyword Match" value={scores.keyword_match} />
              <ProgressBar label="Skill Match" value={scores.skill_match} />
              <ProgressBar label="Experience Match" value={scores.experience_match} />
              <ProgressBar label="Education Match" value={scores.education_match} />
              <ProgressBar label="Formatting" value={scores.formatting} />
            </div>
            <ScoreChart scores={scores} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Keyword Analysis</h2>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-emerald-600">Found Keywords</p>
              <KeywordTags keywords={keyword_analysis.found_keywords} variant="found" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-red-600">Missing Keywords</p>
              <KeywordTags keywords={keyword_analysis.missing_keywords?.slice(0, 20)} variant="missing" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-amber-600">High Priority</p>
              <KeywordTags keywords={keyword_analysis.high_priority_keywords?.slice(0, 15)} variant="priority" />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Skill Gap Analysis</h2>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-emerald-600">Matching Skills</p>
              <KeywordTags keywords={skill_gap.matching_skills} variant="found" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-red-600">Missing Skills</p>
              <KeywordTags keywords={skill_gap.missing_skills} variant="missing" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-amber-600">Recommended</p>
              <KeywordTags keywords={skill_gap.recommended_skills} variant="priority" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Improvement Recommendations</h2>
        <ul className="space-y-2">
          {suggestions?.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="mt-0.5 text-brand-500">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ResumePreview title="Original Resume" text={result.original_resume?.raw_text} />
        <ResumePreview title="Optimized Resume" text={result.optimized_text} highlight />
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const { id } = useParams()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      resumeApi
        .historyDetail(id)
        .then((res) => {
          if (res.data.analysis_json) {
            setResult(res.data.analysis_json)
          }
        })
        .finally(() => setLoading(false))
    } else {
      const stored = sessionStorage.getItem('lastResult')
      if (stored) {
        try {
          setResult(JSON.parse(stored))
        } catch {
          /* ignore */
        }
      }
      setLoading(false)
    }
  }, [id])

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner className="py-20" />
      </Layout>
    )
  }

  if (!result) {
    return (
      <Layout>
        <div className="card py-12 text-center">
          <p className="text-lg text-slate-500">No results found.</p>
          <Link to="/optimize" className="btn-primary mt-4 inline-flex">
            Start Optimization
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <ResultsView result={result} />
    </Layout>
  )
}
