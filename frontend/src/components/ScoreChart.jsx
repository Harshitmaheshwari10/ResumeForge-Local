import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

export default function ScoreChart({ scores }) {
  if (!scores) return null

  const data = {
    labels: ['Keywords', 'Skills', 'Experience', 'Education', 'Formatting'],
    datasets: [
      {
        label: 'ATS Scores',
        data: [
          scores.keyword_match,
          scores.skill_match,
          scores.experience_match,
          scores.education_match,
          scores.formatting,
        ],
        backgroundColor: 'rgba(26, 130, 245, 0.2)',
        borderColor: 'rgba(26, 130, 245, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(26, 130, 245, 1)',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { stepSize: 20, display: false },
        grid: { color: 'rgba(148, 163, 184, 0.3)' },
        pointLabels: { font: { size: 11 } },
      },
    },
    plugins: { legend: { display: false } },
  }

  return (
    <div className="h-64">
      <Radar data={data} options={options} />
    </div>
  )
}
