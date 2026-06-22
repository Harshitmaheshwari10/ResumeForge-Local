import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import ProgressBar from '../components/ProgressBar'
import ScoreRing from '../components/ScoreRing'
import { resumeApi } from '../services/api'
import { scoreLabel } from '../utils/helpers'

export default function DashboardPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    resumeApi
      .history()
      .then((res) => setHistory(res.data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [])

  const latest = history[0]
  const avgScore =
    history.length > 0
      ? history.reduce((sum, r) => sum + r.ats_score, 0) / history.length
      : 0

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner className="py-20" />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-slate-500">Your resume optimization overview</p>
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm text-slate-500">Total Optimizations</p>
          <p className="mt-1 text-3xl font-bold">{history.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Average ATS Score</p>
          <p className="mt-1 text-3xl font-bold">{history.length ? Math.round(avgScore) : '—'}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Latest Score</p>
          <p className="mt-1 text-3xl font-bold">
            {latest ? Math.round(latest.ats_score) : '—'}
          </p>
        </div>
        <div className="card flex flex-col justify-center">
          <Link to="/optimize" className="btn-primary text-center">
            New Optimization
          </Link>
        </div>
      </div>

      {latest ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card flex flex-col items-center justify-center lg:col-span-1">
            <ScoreRing score={latest.ats_score} label={`Latest — ${scoreLabel(latest.ats_score)}`} />
          </div>
          <div className="card space-y-4 lg:col-span-2">
            <h2 className="text-lg font-semibold">Latest Score Breakdown</h2>
            <ProgressBar label="Keyword Match" value={latest.keyword_score} />
            <ProgressBar label="Skill Match" value={latest.skill_score} />
            <ProgressBar label="Experience Match" value={latest.experience_score} />
            <ProgressBar label="Education Match" value={latest.education_score} />
            <ProgressBar label="Formatting" value={latest.formatting_score} />
          </div>
        </div>
      ) : (
        <div className="card py-12 text-center">
          <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
            No optimizations yet
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Upload your resume and a job description to get started.
          </p>
          <Link to="/optimize" className="btn-primary mt-6 inline-flex">
            Optimize Your Resume
          </Link>
        </div>
      )}

      {history.length > 1 && (
        <div className="card mt-8">
          <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {history.slice(0, 5).map((record) => (
              <Link
                key={record.id}
                to={`/history/${record.id}`}
                className="flex items-center justify-between py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded-lg"
              >
                <div>
                  <p className="font-medium">{record.title}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(record.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  {Math.round(record.ats_score)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}
