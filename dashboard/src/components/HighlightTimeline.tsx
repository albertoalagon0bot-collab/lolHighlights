import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './HighlightTimeline.css'

interface Highlight {
  _id: string
  matchId: string
  timestamp: number
  type: string
  description: string
  impact: 'low' | 'medium' | 'high'
  champion: string
  duration?: number
  result?: 'win' | 'loss'
}

const HighlightTimeline: React.FC = () => {
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [filteredHighlights, setFilteredHighlights] = useState<Highlight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedChampion, setSelectedChampion] = useState<string>('all')

  useEffect(() => {
    fetchHighlights()
  }, [])

  useEffect(() => {
    filterHighlights()
  }, [highlights, selectedType, selectedChampion])

  const fetchHighlights = async () => {
    try {
      const response = await fetch('/api/highlights')
      if (!response.ok) throw new Error('Failed to fetch highlights')
      const data = await response.json()
      setHighlights(data)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  const filterHighlights = () => {
    let filtered = highlights

    if (selectedType !== 'all') {
      filtered = filtered.filter(highlight => highlight.type === selectedType)
    }

    if (selectedChampion !== 'all') {
      filtered = filtered.filter(highlight => highlight.champion === selectedChampion)
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp)
    setFilteredHighlights(filtered)
  }

  const getUniqueTypes = () => {
    return ['all', ...Array.from(new Set(highlights.map(h => h.type)))]
  }

  const getUniqueChampions = () => {
    return ['all', ...Array.from(new Set(highlights.map(h => h.champion)))]
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#ff6b6b'
      case 'medium': return '#ff9800'
      case 'low': return '#4caf50'
      default: return '#666'
    }
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return '🔥'
      case 'medium': return '⚡'
      case 'low': return '✨'
      default: return '•'
    }
  }

  // Prepare timeline data for chart
  const timelineData = highlights.reduce((acc, highlight) => {
    const date = new Date(highlight.timestamp).toLocaleDateString()
    const existing = acc.find(item => item.date === date)
    
    if (existing) {
      existing.highlights++
      if (highlight.impact === 'high') existing.highImpact++
      if (highlight.impact === 'medium') existing.mediumImpact++
      if (highlight.impact === 'low') existing.lowImpact++
    } else {
      acc.push({
        date,
        highlights: 1,
        highImpact: highlight.impact === 'high' ? 1 : 0,
        mediumImpact: highlight.impact === 'medium' ? 1 : 0,
        lowImpact: highlight.impact === 'low' ? 1 : 0,
      })
    }
    return acc
  }, [] as any[]).reverse()

  if (loading) {
    return <div className="loading">Loading highlights...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="highlight-timeline">
      <div className="filters">
        <div className="filter-group">
          <label>Type:</label>
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
          >
            {getUniqueTypes().map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Champion:</label>
          <select 
            value={selectedChampion} 
            onChange={(e) => setSelectedChampion(e.target.value)}
            className="filter-select"
          >
            {getUniqueChampions().map(champion => (
              <option key={champion} value={champion}>
                {champion === 'all' ? 'All Champions' : champion}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{highlights.length}</div>
          <div className="stat-label">Total Highlights</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {highlights.filter(h => h.impact === 'high').length}
          </div>
          <div className="stat-label">High Impact</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {highlights.filter(h => h.impact === 'medium').length}
          </div>
          <div className="stat-label">Medium Impact</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {highlights.filter(h => h.impact === 'low').length}
          </div>
          <div className="stat-label">Low Impact</div>
        </div>
      </div>

      <div className="card">
        <h2>Highlights Timeline</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#2a2a2a', borderColor: '#444' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="highlights" 
                stroke="#ff6b6b" 
                name="Total Highlights"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="highImpact" 
                stroke="#4caf50" 
                name="High Impact"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2>Recent Highlights</h2>
        <div className="highlights-list">
          {filteredHighlights.slice(0, 20).map((highlight) => (
            <div key={highlight._id} className="highlight-item">
              <div className="highlight-header">
                <span className="impact" style={{ color: getImpactColor(highlight.impact) }}>
                  {getImpactIcon(highlight.impact)} {highlight.impact.toUpperCase()}
                </span>
                <span className="champion">{highlight.champion}</span>
                <span className="type">{highlight.type}</span>
                <span className="timestamp">{formatTimestamp(highlight.timestamp)}</span>
              </div>
              <div className="highlight-description">
                {highlight.description}
              </div>
              <div className="highlight-details">
                {highlight.duration && (
                  <span className="duration">⏱️ {highlight.duration}s</span>
                )}
                {highlight.result && (
                  <span className={`result ${highlight.result}`}>
                    {highlight.result.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HighlightTimeline