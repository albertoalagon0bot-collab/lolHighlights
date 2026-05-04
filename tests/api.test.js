const request = require('supertest');
const app = require('../src/server');

describe('API Routes', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(['ok', 'degraded']).toContain(res.body.status);
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

  describe('GET /', () => {
    it('should return API information', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('lolHighlights API');
      expect(res.body.endpoints).toBeDefined();
    });
  });

  // DB-dependent tests skipped — require running MongoDB instance
  // TODO: add mock setup for integration tests
  describe.skip('GET /api/matches', () => {
    it('should return matches array with pagination', async () => {
      const res = await request(app).get('/api/matches');
      expect(res.statusCode).toBe(200);
      expect(res.body.matches).toBeDefined();
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe.skip('GET /api/matches/:id', () => {
    it('should return 404 for non-existent match', async () => {
      const res = await request(app).get('/api/matches/nonexistent');
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });

  describe.skip('GET /api/champions', () => {
    it('should return champions array', async () => {
      const res = await request(app).get('/api/champions');
      expect(res.statusCode).toBe(200);
      expect(res.body.champions).toBeDefined();
    });
  });

  describe.skip('GET /api/highlights', () => {
    it('should return highlights array with pagination', async () => {
      const res = await request(app).get('/api/highlights');
      expect(res.statusCode).toBe(200);
      expect(res.body.highlights).toBeDefined();
      expect(res.body.pagination).toBeDefined();
    });
  });
});
