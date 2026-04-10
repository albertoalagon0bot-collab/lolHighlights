const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

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

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log(`Connected to MongoDB (${process.env.NODE_ENV || 'development'})`))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/matches', matchesRouter);
app.use('/api/champions', championsRouter);
app.use('/api/highlights', highlightsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
  app.listen(PORT, () => {
    console.log(`lolHighlights server running on port ${PORT}`);
  });
}

module.exports = app;
