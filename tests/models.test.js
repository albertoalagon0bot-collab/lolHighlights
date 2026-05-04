const request = require('supertest');

// Test models in isolation (no DB connection needed for unit tests)
const Match = require('../src/models/Match');

describe('Match Model (Unit)', () => {
  describe('calculateHighlightScore', () => {
    it('should score a pentaKill highly', () => {
      const matchData = {
        participants: [{ stats: { pentaKills: 1, quadraKills: 0, tripleKills: 0, kills: 10, deaths: 0, assists: 5 } }],
        teams: [{ firstBlood: true, towerKills: 5, baronKills: 1, dragonKills: 2 }],
        gameDuration: 2400
      };
      const score = Match.calculateHighlightScore(matchData);
      expect(score).toBeGreaterThan(50);
    });

    it('should score a boring match low', () => {
      const matchData = {
        participants: [{ stats: { pentaKills: 0, quadraKills: 0, tripleKills: 0, kills: 2, deaths: 5, assists: 1 } }],
        teams: [{ firstBlood: false, towerKills: 1, baronKills: 0, dragonKills: 0 }],
        gameDuration: 1200
      };
      const score = Match.calculateHighlightScore(matchData);
      expect(score).toBeLessThan(30);
    });

    it('should cap score at 100', () => {
      const matchData = {
        participants: [
          { stats: { pentaKills: 1, quadraKills: 1, tripleKills: 1, kills: 20, deaths: 0, assists: 15 } },
          { stats: { pentaKills: 1, quadraKills: 1, tripleKills: 1, kills: 18, deaths: 0, assists: 12 } }
        ],
        teams: [{ firstBlood: true, towerKills: 11, baronKills: 3, dragonKills: 5, inhibitorKills: 3 }],
        gameDuration: 3600
      };
      const score = Match.calculateHighlightScore(matchData);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should not return negative score', () => {
      const matchData = {
        participants: [{ stats: { kills: 0, deaths: 10, assists: 0 } }],
        teams: [{ firstBlood: false, towerKills: 0, baronKills: 0, dragonKills: 0 }],
        gameDuration: 600
      };
      const score = Match.calculateHighlightScore(matchData);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('API Routes (Integration)', () => {
  let app;

  beforeAll(() => {
    // Suppress Mongoose connection errors for route-only tests
    process.env.MONGODB_URI = 'mongodb://localhost:27017/lolhighlights_test';
    process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017/lolhighlights_test';
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    jest.resetModules();
    app = require('../src/server');
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBeDefined();
    });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('lolHighlights API');
      expect(res.body.endpoints).toBeDefined();
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.statusCode).toBe(404);
    });
  });
});
