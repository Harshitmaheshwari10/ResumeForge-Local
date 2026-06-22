import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import { resumeApi } from '../services/api'
import { scoreLabel } from '../utils/helpers'

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const loadHistory = () => {
    setLoading(true)
    resumeApi
      .history()
      .then((res) => setHistory(res.data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return
    try {
      await resumeApi.deleteHistory(id)
      loadHistory()
    } catch {
      alert('Failed to delete')
    }
  }

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resume History</h1>
          <p className="mt-1 text-slate-500">All your past optimizations</p>
        </div>
        <Link to="/optimize" className="btn-primary">
          New Optimization
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : history.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-lg text-slate-500">No history yet.</p>
          <Link to="/optimize" className="btn-primary mt-4 inline-flex">
            Optimize Your First Resume
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 font-semibold">Title</th>
                <th className="px-6 py-3 font-semibold">Template</th>
                <th className="px-6 py-3 font-semibold">ATS Score</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {history.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4 font-medium">{record.title}</td>
                  <td className="px-6 py-4 capitalize text-slate-500">
                    {record.template?.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                      {Math.round(record.ats_score)} — {scoreLabel(record.ats_score)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(record.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link
                        to={`/history/${record.id}`}
                        className="text-brand-600 hover:text-brand-700 text-xs font-medium"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-500 hover:text-red-600 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
