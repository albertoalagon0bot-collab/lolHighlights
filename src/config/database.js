/**
 * Database Configuration Module
 * Handles MongoDB connection setup with connection pooling and health checks.
 */
const mongoose = require('mongoose');

let isConnected = false;
let connection = null;

/**
 * Connect to MongoDB with connection pooling and retry logic
 * @param {string} uri - MongoDB connection URI
 * @param {object} options - Connection options
 * @returns {Promise<mongoose.Connection>}
 */
async function connect(uri, options = {}) {
  if (isConnected && connection) {
    return connection;
  }

  const defaultOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
    minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,
    maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME) || 30000,
    connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,
    serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 5000,
    heartbeatFrequencyMS: parseInt(process.env.DB_HEARTBEAT_FREQ) || 10000,
    retryWrites: true,
    w: 'majority',
    ...options
  };

  try {
    connection = await mongoose.connect(uri, defaultOptions);
    isConnected = true;

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      console.log('MongoDB reconnected');
    });

    console.log(`Connected to MongoDB (pool: ${defaultOptions.minPoolSize}-${defaultOptions.maxPoolSize})`);
    return connection;
  } catch (error) {
    isConnected = false;
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnect() {
  if (connection) {
    await mongoose.disconnect();
    isConnected = false;
    connection = null;
    console.log('Disconnected from MongoDB');
  }
}

/**
 * Check database health
 * @returns {Promise<object>} Health status
 */
async function healthCheck() {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return { status: 'disconnected', latency: null };
    }

    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    const latency = Date.now() - start;

    const poolInfo = {
      ready: mongoose.connection.readyState === 1,
      poolSize: mongoose.connection.client?.topology?.s?.pool?.currentSize || 0
    };

    return { status: 'healthy', latency: `${latency}ms`, pool: poolInfo };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

/**
 * Initialize database with default indexes and data
 * @returns {Promise<void>}
 */
async function initialize() {
  try {
    const Match = require('../models/Match');

    // Ensure indexes are created
    await Match.init();

    console.log('Database initialization complete');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    throw error;
  }
}

module.exports = {
  connect,
  disconnect,
  healthCheck,
  initialize,
  getConnection: () => connection,
  isConnected: () => isConnected
};
