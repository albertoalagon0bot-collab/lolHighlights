const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
require('dotenv').config()

const db = require('./config/database')
const { run: runMigrations } = require('./config/migrations')
const dbGuard = require('./middleware/dbGuard')
const matchesRouter = require('./routes/matches')
const championsRouter = require('./routes/champions')
const highlightsRouter = require('./routes/highlights')
const summonersRouter = require('./routes/summoners')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Database connection
const MONGODB_URI = process.env.NODE_ENV === 'test'
  ? process.env.MONGODB_TEST_URI
  : process.env.MONGODB_URI

// Root endpoint — before static middleware so it takes priority
app.get('/', (req, res) => {
  res.json({
    name: 'lolHighlights API',
    version: '1.0.0',
    description: 'League of Legends Highlights Analyzer API',
    endpoints: {
      health: '/health',
      matches: '/api/matches',
      champions: '/api/champions',
      highlights: '/api/highlights'
    }
  })
})

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../dashboard/dist')))

// Routes — DB-dependent routes protected by dbGuard
app.use('/api/matches', dbGuard, matchesRouter)
app.use('/api/champions', dbGuard, championsRouter)
app.use('/api/highlights', dbGuard, highlightsRouter)
app.use('/api/summoners', dbGuard, summonersRouter)

// Health check
app.get('/health', async (req, res) => {
  const dbHealth = await db.healthCheck()
  res.json({
    status: dbHealth.status === 'healthy' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbHealth
  })
})

// 404 handler for API routes — MUST come before SPA fallback
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' })
})

// SPA fallback for dashboard — catches all non-API GET requests
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../dashboard/dist/index.html')
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).json({ error: 'Dashboard not built. Run npm run dashboard:build' })
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
if (require.main === module) {
  (async () => {
    try {
      await db.connect(MONGODB_URI)
      await db.initialize()
      await runMigrations(mongoose.connection)
      console.log(`lolHighlights server running on port ${PORT}`)
      app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`)
      })
    } catch (err) {
      console.error('Failed to start server:', err.message)
      process.exit(1)
    }
  })()
}

module.exports = app
