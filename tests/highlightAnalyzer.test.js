const HighlightAnalyzer = require('../src/utils/HighlightAnalyzer');

describe('HighlightAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new HighlightAnalyzer({ threshold: 0.75 });
  });

  const sampleMatch = {
    gameDuration: 2100,
    participants: [
      {
        championName: 'Aatrox', participantId: 1,
        stats: { pentaKills: 1, quadraKills: 0, tripleKills: 0, firstBloodKill: true,
          kills: 15, deaths: 0, assists: 8, totalDamageDealtToChampions: 45000,
          largestKillingSpree: 8 }
      },
      {
        championName: 'Jinx', participantId: 2,
        stats: { tripleKills: 1, quadraKills: 0, pentaKills: 0, firstBloodKill: false,
          kills: 12, deaths: 1, assists: 5, totalDamageDealtToChampions: 38000,
          largestKillingSpree: 5 }
      },
      {
        championName: 'Thresh', participantId: 3,
        stats: { kills: 2, deaths: 3, assists: 22, firstBloodAssist: true,
          totalDamageDealtToChampions: 8000, largestKillingSpree: 0 }
      }
    ],
    teams: [
      { teamId: 100, win: 'Win', firstBaron: true, firstDragon: true, firstTower: true,
        baronKills: 1, dragonKills: 3, towerKills: 9 },
      { teamId: 200, win: 'Fail', firstBaron: false, firstDragon: false, firstTower: false,
        baronKills: 0, dragonKills: 1, towerKills: 3 }
    ]
  };

  describe('analyzeMatch', () => {
    it('should categorize highlights correctly', () => {
      const result = analyzer.analyzeMatch(sampleMatch);
      expect(result.categoryScores).toBeDefined();
      expect(result.categoryScores.combat).toBeDefined();
      expect(result.categoryScores.objectives).toBeDefined();
      expect(result.categoryScores.combat.count).toBeGreaterThan(0);
    });

    it('should generate a summary', () => {
      const result = analyzer.analyzeMatch(sampleMatch);
      expect(result.summary).toBeDefined();
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it('should determine if match is highlight-worthy', () => {
      const result = analyzer.analyzeMatch(sampleMatch);
      expect(result.isHighlightWorthy).toBe(true);
    });

    it('should calculate enhanced score with bonuses', () => {
      const result = analyzer.analyzeMatch(sampleMatch);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle match with no highlights', () => {
      const boringMatch = {
        gameDuration: 900,
        participants: [{
          championName: 'Annie', participantId: 1,
          stats: { kills: 2, deaths: 4, assists: 3, totalDamageDealtToChampions: 15000 }
        }],
        teams: [{ teamId: 100, win: 'Fail', baronKills: 0, dragonKills: 0, towerKills: 2 }]
      };
      const result = analyzer.analyzeMatch(boringMatch);
      expect(result.isHighlightWorthy).toBe(false);
    });
  });

  describe('categorize', () => {
    it('should categorize combat highlights', () => {
      expect(analyzer.categorize('pentaKill')).toBe('combat');
      expect(analyzer.categorize('tripleKill')).toBe('combat');
      expect(analyzer.categorize('perfectKDA')).toBe('combat');
    });

    it('should categorize objective highlights', () => {
      expect(analyzer.categorize('baronKill')).toBe('objectives');
      expect(analyzer.categorize('dragonKill')).toBe('objectives');
      expect(analyzer.categorize('towerDestroyed')).toBe('objectives');
    });

    it('should categorize early game highlights', () => {
      expect(analyzer.categorize('firstBlood')).toBe('earlyGame');
    });

    it('should return other for unknown types', () => {
      expect(analyzer.categorize('unknownType')).toBe('other');
    });
  });

  describe('searchHighlights', () => {
    it('should filter by type', () => {
      const result = analyzer.searchHighlights(sampleMatch, { type: 'pentaKill' });
      result.highlights.forEach(h => expect(h.type).toBe('pentaKill'));
    });

    it('should filter by category', () => {
      const result = analyzer.searchHighlights(sampleMatch, { category: 'combat' });
      result.highlights.forEach(h => expect(h.category).toBe('combat'));
    });

    it('should filter by severity', () => {
      const result = analyzer.searchHighlights(sampleMatch, { severity: 'critical' });
      result.highlights.forEach(h => expect(h.severity).toBe('critical'));
    });

    it('should filter by text search', () => {
      const result = analyzer.searchHighlights(sampleMatch, { search: 'PentaKill' });
      expect(result.highlights.length).toBeGreaterThan(0);
    });

    it('should sort by score', () => {
      const result = analyzer.searchHighlights(sampleMatch, { sort: 'score' });
      for (let i = 1; i < result.highlights.length; i++) {
        expect((result.highlights[i - 1].score || 0)).toBeGreaterThanOrEqual(result.highlights[i].score || 0);
      }
    });

    it('should report total filtered vs original', () => {
      const result = analyzer.searchHighlights(sampleMatch, { type: 'pentaKill' });
      expect(result.totalOriginal).toBeGreaterThan(0);
      expect(result.totalFiltered).toBeLessThanOrEqual(result.totalOriginal);
    });
  });

  describe('exportHighlights', () => {
    it('should export as JSON', () => {
      const exported = analyzer.exportHighlights(sampleMatch, 'json');
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should export as CSV', () => {
      const csv = analyzer.exportHighlights(sampleMatch, 'csv');
      expect(csv).toContain('type,category,severity');
      expect(csv).toContain('pentaKill');
    });

    it('should export as Markdown', () => {
      const md = analyzer.exportHighlights(sampleMatch, 'markdown');
      expect(md).toContain('# Match Highlights');
      expect(md).toContain('##');
    });
  });

  describe('analyzeTimeline', () => {
    it('should extract highlights from timeline frames', () => {
      const timeline = {
        frames: [
          {
            timestamp: 180000,
            events: [
              { type: 'ELITE_MONSTER_KILL', monsterType: 'BARON_NASHOR', teamId: 100 },
              { type: 'CHAMPION_KILL', participantId: 1, multiKillLength: 5, killingSpreeLength: 0 }
            ]
          },
          {
            timestamp: 600000,
            events: [
              { type: 'BUILDING_KILL', buildingType: 'TOWER_BUILDING', teamId: 100 }
            ]
          }
        ]
      };

      const result = analyzer.analyzeTimeline(sampleMatch, timeline);
      expect(result.timelineAnalyzed).toBe(true);
      expect(result.frameCount).toBe(2);
    });

    it('should fall back to analyzeMatch when no timeline', () => {
      const result = analyzer.analyzeTimeline(sampleMatch, null);
      expect(result.timelineAnalyzed).toBeUndefined();
      expect(result.highlights.length).toBeGreaterThan(0);
    });
  });

  describe('Inherited HighlightDetector tests', () => {
    it('should detect pentaKill', () => {
      const matchData = {
        participants: [{ championName: 'Aatrox', stats: { pentaKills: 1 }, participantId: 1 }],
        teams: []
      };
      const result = analyzer.detectHighlights(matchData);
      expect(result.highlights.some(h => h.type === 'pentaKill')).toBe(true);
    });

    it('should handle null data', () => {
      const result = analyzer.detectHighlights(null);
      expect(result.highlights).toEqual([]);
      expect(result.score).toBe(0);
    });
  });
});
