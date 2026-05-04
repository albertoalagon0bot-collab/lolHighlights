const HighlightDetector = require('../src/utils/HighlightDetector');

describe('HighlightDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new HighlightDetector({ threshold: 0.75 });
  });

  describe('detectHighlights', () => {
    it('should detect pentaKill', () => {
      const matchData = {
        participants: [{
          championName: 'Aatrox',
          stats: { pentaKills: 1, tripleKills: 0, quadraKills: 0 },
          participantId: 1
        }],
        teams: []
      };

      const result = detector.detectHighlights(matchData);
      expect(result.highlights.length).toBe(1);
      expect(result.highlights[0].type).toBe('pentaKill');
      expect(result.highlights[0].severity).toBe('critical');
      expect(result.score).toBeGreaterThan(0);
    });

    it('should detect quadraKill', () => {
      const matchData = {
        participants: [{
          championName: 'Katarina',
          stats: { quadraKills: 1, tripleKills: 0, pentaKills: 0 },
          participantId: 2
        }],
        teams: []
      };

      const result = detector.detectHighlights(matchData);
      expect(result.highlights.length).toBe(1);
      expect(result.highlights[0].type).toBe('quadraKill');
      expect(result.highlights[0].severity).toBe('high');
    });

    it('should detect tripleKill', () => {
      const matchData = {
        participants: [{
          championName: 'Vayne',
          stats: { tripleKills: 1, quadraKills: 0, pentaKills: 0 },
          participantId: 3
        }],
        teams: []
      };

      const result = detector.detectHighlights(matchData);
      expect(result.highlights.length).toBe(1);
      expect(result.highlights[0].type).toBe('tripleKill');
      expect(result.highlights[0].severity).toBe('medium');
    });

    it('should detect perfectKDA', () => {
      const matchData = {
        participants: [{
          championName: 'Jinx',
          stats: { kills: 10, deaths: 0, assists: 5 },
          participantId: 4
        }],
        teams: []
      };

      const result = detector.detectHighlights(matchData);
      expect(result.highlights.length).toBe(1);
      expect(result.highlights[0].type).toBe('perfectKDA');
      expect(result.highlights[0].severity).toBe('high');
    });

    it('should detect firstBlood', () => {
      const matchData = {
        participants: [{
          championName: 'Yasuo',
          stats: { firstBloodKill: true },
          participantId: 5
        }],
        teams: []
      };

      const result = detector.detectHighlights(matchData);
      expect(result.highlights.length).toBe(1);
      expect(result.highlights[0].type).toBe('firstBlood');
      expect(result.highlights[0].severity).toBe('medium');
    });

    it('should combine multiple highlights', () => {
      const matchData = {
        participants: [
          {
            championName: 'Aatrox',
            stats: { pentaKills: 1, quadraKills: 0, tripleKills: 0 },
            participantId: 1
          },
          {
            championName: 'Katarina',
            stats: { quadraKills: 1, tripleKills: 0, pentaKills: 0 },
            participantId: 2
          },
          {
            championName: 'Vayne',
            stats: { tripleKills: 1, quadraKills: 0, pentaKills: 0 },
            participantId: 3
          }
        ],
        teams: []
      };

      const result = detector.detectHighlights(matchData);
      expect(result.highlights.length).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThan(50);
    });

    it('should return empty highlights for invalid data', () => {
      const result = detector.detectHighlights(null);
      expect(result.highlights).toEqual([]);
      expect(result.score).toBe(0);
    });

    it('should return empty highlights for missing participants', () => {
      const result = detector.detectHighlights({});
      expect(result.highlights).toEqual([]);
      expect(result.score).toBe(0);
    });

    it('should be highlight-worthy when score threshold is met', () => {
      const detector = new HighlightDetector({ threshold: 0.5 });
      const matchData = {
        participants: [{
          championName: 'Aatrox',
          stats: { pentaKills: 1, quadraKills: 1, kills: 20, deaths: 0, assists: 15 },
          participantId: 1
        }],
        teams: [{ firstBlood: true, baronKills: 1, dragonKills: 1, towerKills: 4 }]
      };

      const isWorthy = detector.isHighlightWorthy(matchData);
      expect(isWorthy).toBe(true);
    });

    it('should not be highlight-worthy when score threshold is not met', () => {
      const matchData = {
        participants: [{
          championName: 'Aatrox',
          stats: { kills: 5, deaths: 10, assists: 2 },
          participantId: 1
        }],
        teams: []
      };

      const isWorthy = detector.isHighlightWorthy(matchData);
      expect(isWorthy).toBe(false);
    });
  });

  describe('weights', () => {
    it('should have correct weights for highlight types', () => {
      const weights = detector.weights;
      expect(weights.pentaKill).toBeGreaterThan(weights.quadraKill);
      expect(weights.quadraKill).toBeGreaterThan(weights.tripleKill);
      expect(weights.perfectKDA).toBeGreaterThan(weights.killingSpree);
    });
  });
});
