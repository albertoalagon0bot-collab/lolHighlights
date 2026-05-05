import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import './ChampionStats.css'

interface Champion {
  _id: string
  name: string
  key: string
  image: string
  winRate: number
  totalMatches: number
  avgKda: {
    kills: number
    deaths: number
    assists: number
  }
}

interface ChampionPerformance {
  champion: string
  wins: number
  losses: number
  kda: number
  highlights: number
}

const ChampionStats: React.FC = () => {
  const [champions, setChampions] = useState<Champion[]>([])
  const [performance, setPerformance] = useState<ChampionPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [championsResponse, matchesResponse] = await Promise.all([
        fetch('/api/champions'),
        fetch('/api/matches')
      ])

      if (!championsResponse.ok || !matchesResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const championsData = await championsResponse.json()
      const matchesData = await matchesResponse.json()

      // Calculate champion performance
      const performanceMap = new Map<string, ChampionPerformance>()

      matchesData.forEach((match: any) => {
        const championName = match.champion
        if (!performanceMap.has(championName)) {
          performanceMap.set(championName, {
            champion: championName,
            wins: 0,
            losses: 0,
            kda: 0,
            highlights: 0
          })
        }

        const perf = performanceMap.get(championName)!
        if (match.result === 'win') {
          perf.wins++
        } else {
          perf.losses++
        }
        
        perf.kda += match.kda.kills + match.kda.assists
        perf.highlights += match.highlights.length
      })

      // Calculate averages and sort by performance
      const performanceArray = Array.from(performanceMap.values()).map(perf => ({
        ...perf,
        winRate: perf.wins + perf.losses > 0 ? (perf.wins / (perf.wins + perf.losses)) * 100 : 0,
        avgKda: (perf.wins + perf.losses) > 0 ? (perf.kda / (perf.wins + perf.losses)).toFixed(1) : 0
      })).sort((a, b) => parseFloat(b.avgKda) - parseFloat(a.avgKda))

      setChampions(championsData)
      setPerformance(performanceArray)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 60) return '#4caf50'
    if (winRate >= 50) return '#ff9800'
    return '#f44336'
  }

  const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff']

  if (loading) {
    return <div className="loading">Loading champion stats...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="champion-stats">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{champions.length}</div>
          <div className="stat-label">Champions Played</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {performance.length > 0 
              ? (performance.reduce((sum, perf) => sum + perf.winRate, 0) / performance.length).toFixed(1)
              : '0'
            }%
          </div>
          <div className="stat-label">Avg Win Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {performance.length > 0 
              ? (performance.reduce((sum, perf) => sum + parseFloat(perf.avgKda), 0) / performance.length).toFixed(1)
              : '0'
            }
          </div>
          <div className="stat-label">Avg KDA</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {performance.length > 0 
              ? Math.round(performance.reduce((sum, perf) => sum + perf.highlights, 0) / performance.length)
              : 0
            }
          </div>
          <div className="stat-label">Avg Highlights/Match</div>
        </div>
      </div>

      <div className="card">
        <h2>Champion Win Rates</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performance.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="champion" stroke="#666" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#2a2a2a', borderColor: '#444' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar 
                dataKey="winRate" 
                fill="#ff6b6b"
                name="Win Rate %"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2>Champion Distribution</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={performance.slice(0, 8)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ champion, wins, losses }) => 
                  `${champion}: ${wins + losses} matches`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="wins"
                nameKey="champion"
              >
                {performance.slice(0, 8).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#2a2a2a', borderColor: '#444' }}
                labelStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2>Top Champions by KDA</h2>
        <div className="champions-list">
          {performance.slice(0, 10).map((perf, index) => (
            <div key={perf.champion} className="champion-item">
              <div className="champion-rank">#{index + 1}</div>
              <div className="champion-name">{perf.champion}</div>
              <div className="champion-stats">
                <span className="win-rate" style={{ color: getWinRateColor(perf.winRate) }}>
                  {perf.winRate.toFixed(1)}%
                </span>
                <span className="kda">{perf.avgKda} KDA</span>
                <span className="matches">{perf.wins + perf.losses} matches</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ChampionStats