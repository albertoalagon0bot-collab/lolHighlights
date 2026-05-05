import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './MatchHistory.css'

interface Match {
  _id: string
  matchId: string
  summonerName: string
  champion: string
  kda: {
    kills: number
    deaths: number
    assists: number
  }
  result: 'win' | 'loss'
  duration: number
  timestamp: string
  highlights: any[]
}

const MatchHistory: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/matches')
      if (!response.ok) throw new Error('Failed to fetch matches')
      const data = await response.json()
      setMatches(data)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString()
  }

  const getWinRate = () => {
    const wins = matches.filter(match => match.result === 'win').length
    return matches.length > 0 ? ((wins / matches.length) * 100).toFixed(1) : '0'
  }

  // Prepare chart data
  const chartData = matches.map(match => ({
    date: formatDate(match.timestamp),
    kda: match.kda.kills + match.kda.assists,
    result: match.result === 'win' ? 1 : 0
  })).reverse()

  if (loading) {
    return <div className="loading">Loading matches...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="match-history">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{matches.length}</div>
          <div className="stat-label">Total Matches</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{getWinRate()}%</div>
          <div className="stat-label">Win Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {matches.length > 0 
              ? (matches.reduce((sum, match) => sum + match.kda.kills, 0) / matches.length).toFixed(1)
              : '0'
            }
          </div>
          <div className="stat-label">Avg Kills</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {matches.length > 0 
              ? (matches.reduce((sum, match) => sum + match.kda.assists, 0) / matches.length).toFixed(1)
              : '0'
            }
          </div>
          <div className="stat-label">Avg Assists</div>
        </div>
      </div>

      <div className="card">
        <h2>Performance Over Time</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#2a2a2a', borderColor: '#444' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="kda" 
                stroke="#ff6b6b" 
                name="KDA"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2>Recent Matches</h2>
        <div className="matches-list">
          {matches.slice(0, 10).map((match) => (
            <div key={match._id} className="match-item">
              <div className="match-header">
                <span className={`result ${match.result}`}>{match.result.toUpperCase()}</span>
                <span className="champion">{match.champion}</span>
                <span className="date">{formatDate(match.timestamp)}</span>
              </div>
              <div className="match-details">
                <span className="kda">
                  K: {match.kda.kills} / D: {match.kda.deaths} / A: {match.kda.assists}
                </span>
                <span className="duration">{formatDuration(match.duration)}</span>
                <span className="highlights">{match.highlights.length} highlights</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MatchHistory