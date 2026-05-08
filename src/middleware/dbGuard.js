/**
 * Database Guard Middleware
 * Returns 503 when database is unavailable instead of hanging.
 */
const db = require('../config/database')

module.exports = function dbGuard (req, res, next) {
  if (!db.isConnected()) {
    return res.status(503).json({
      error: 'Database unavailable',
      message: 'The database connection is not established. Please try again later.'
    })
  }
  next()
}
