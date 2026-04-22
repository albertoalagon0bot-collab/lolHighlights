const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const db = require('./config/database');
const { run: runMigrations } = require('./config/migrations');
const matchesRouter = require('./routes/matches');
const championsRouter = require('./routes/champions');
const highlightsRouter = require('./routes/highlights');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const MONGODB_URI = process.env.NODE_ENV === 'test'
  ? process.env.MONGODB_TEST_URI
  : process.env.MONGODB_URI;

// Routes
app.use('/api/matches', matchesRouter);
app.use('/api/champions', championsRouter);
app.use('/api/highlights', highlightsRouter);

// Health check
app.get('/health', async (req, res) => {
  const dbHealth = await db.healthCheck();
  res.json({
    status: dbHealth.status === 'healthy' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbHealth
  });
});

// Root endpoint
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
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
if (require.main === module) {
  (async () => {
    try {
      await db.connect(MONGODB_URI);
      await db.initialize();
      await runMigrations(mongoose.connection);
      console.log(`lolHighlights server running on port ${PORT}`);
      app.listen(PORT);
    } catch (err) {
      console.error('Failed to start server:', err.message);
      process.exit(1);
    }
  })();
}

module.exports = app;
