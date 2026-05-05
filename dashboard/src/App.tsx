import React, { useState, useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import MatchHistory from './components/MatchHistory'
import ChampionStats from './components/ChampionStats'
import HighlightTimeline from './components/HighlightTimeline'
import './App.css'

function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check API connection
    checkApiConnection()
  }, [])

  const checkApiConnection = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      if (data.status === 'ok') {
        setLoading(false)
      } else {
        setError('API connection error')
        setLoading(false)
      }
    } catch (err) {
      setError('Failed to connect to API')
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <h1>lolHighlights Dashboard</h1>
          <nav className="nav">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
              Match History
            </NavLink>
            <NavLink to="/champions" className={({ isActive }) => isActive ? 'active' : ''}>
              Champion Stats
            </NavLink>
            <NavLink to="/highlights" className={({ isActive }) => isActive ? 'active' : ''}>
              Highlights
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          <Routes>
            <Route path="/" element={<MatchHistory />} />
            <Route path="/champions" element={<ChampionStats />} />
            <Route path="/highlights" element={<HighlightTimeline />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App