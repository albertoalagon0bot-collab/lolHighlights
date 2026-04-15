/**
 * HighlightAnalyzer - Enhanced highlight detection, categorization, scoring, and export
 */
const HighlightDetector = require('./HighlightDetector');

class HighlightAnalyzer extends HighlightDetector {
  constructor(options = {}) {
    super(options);
    this.categories = {
      combat: ['pentaKill', 'quadraKill', 'tripleKill', 'doubleKill', 'killingSpree', 'perfectKDA'],
      objectives: ['baronKill', 'dragonKill', 'towerDestroyed', 'inhibitorDestroyed', 'riftHeraldKill'],
      earlyGame: ['firstBlood', 'firstTower', 'earlyBounty'],
      comeback: ['comeback', 'closeGame'],
      damage: ['highDamage', 'highCS']
    };
    this.exportFormats = ['json', 'csv', 'markdown'];
  }

  /**
   * Analyze a match with full categorization and enhanced scoring
   */
  analyzeMatch(matchData) {
    const baseResult = this.detectHighlights(matchData);
    const highlights = baseResult.highlights;

    // Add categories to each highlight
    const categorizedHighlights = highlights.map(h => ({
      ...h,
      category: this.categorize(h.type)
    }));

    // Calculate scores by category
    const categoryScores = {};
    for (const [cat, types] of Object.entries(this.categories)) {
      const catHighlights = categorizedHighlights.filter(h => h.category === cat);
      categoryScores[cat] = {
        count: catHighlights.length,
        score: catHighlights.reduce((sum, h) => sum + (h.score || 0), 0),
        highlights: catHighlights
      };
    }

    // Enhanced scoring with bonus multipliers
    const enhancedScore = this._calculateEnhancedScore(categorizedHighlights, matchData);

    return {
      highlights: categorizedHighlights,
      score: enhancedScore,
      categoryScores,
      summary: this._generateSummary(categorizedHighlights, matchData),
      isHighlightWorthy: enhancedScore >= this.threshold * 100
    };
  }

  /**
   * Categorize a highlight type
   */
  categorize(type) {
    for (const [category, types] of Object.entries(this.categories)) {
      if (types.includes(type)) return category;
    }
    return 'other';
  }

  /**
   * Search and filter highlights
   */
  searchHighlights(matchData, filters = {}) {
    const result = this.analyzeMatch(matchData);
    let highlights = result.highlights;

    if (filters.type) {
      highlights = highlights.filter(h => h.type === filters.type);
    }
    if (filters.category) {
      highlights = highlights.filter(h => h.category === filters.category);
    }
    if (filters.severity) {
      highlights = highlights.filter(h => h.severity === filters.severity);
    }
    if (filters.participantId) {
      highlights = highlights.filter(h => h.participantId === filters.participantId);
    }
    if (filters.minScore) {
      highlights = highlights.filter(h => (h.score || 0) >= filters.minScore);
    }
    if (filters.search) {
      const term = filters.search.toLowerCase();
      highlights = highlights.filter(h => h.description.toLowerCase().includes(term));
    }

    // Sort options
    if (filters.sort === 'score') {
      highlights.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (filters.sort === 'timestamp') {
      highlights.sort((a, b) => a.timestamp - b.timestamp);
    }

    return {
      ...result,
      highlights,
      totalFiltered: highlights.length,
      totalOriginal: result.highlights.length
    };
  }

  /**
   * Export highlights in various formats
   */
  exportHighlights(matchData, format = 'json', filters = {}) {
    const result = this.searchHighlights(matchData, filters);
    const highlights = result.highlights;

    switch (format.toLowerCase()) {
      case 'csv':
        return this._exportCSV(highlights);
      case 'markdown':
        return this._exportMarkdown(highlights, matchData);
      case 'json':
      default:
        return JSON.stringify(highlights, null, 2);
    }
  }

  /**
   * Analyze match timeline for timestamp-based highlights
   */
  analyzeTimeline(matchData, timeline) {
    if (!timeline || !timeline.frames) {
      return this.analyzeMatch(matchData);
    }

    const baseResult = this.analyzeMatch(matchData);
    const highlights = [];

    for (const frame of timeline.frames) {
      const events = frame.events || [];

      for (const event of events) {
        const highlight = this._timelineEventToHighlight(event, frame, matchData);
        if (highlight) {
          highlights.push(highlight);
        }
      }
    }

    // Merge with base highlights, deduplicating by timestamp proximity
    const merged = this._mergeHighlights(baseResult.highlights, highlights);

    return {
      ...baseResult,
      highlights: merged,
      timelineAnalyzed: true,
      frameCount: timeline.frames.length
    };
  }

  _timelineEventToHighlight(event, frame, matchData) {
    const timestamp = event.timestamp || (frame.timestamp || 0);
    const participant = matchData.participants?.find(p => p.participantId === event.participantId);
    const championName = participant?.championName || 'Unknown';

    switch (event.type) {
      case 'CHAMPION_KILL':
        if (event.multiKillLength >= 3) {
          const multiType = event.multiKillLength >= 5 ? 'pentaKill' : event.multiKillLength >= 4 ? 'quadraKill' : 'tripleKill';
          return this._createHighlight(multiType, event.participantId, championName,
            `${championName} achieved a ${multiType}!`,
            event.multiKillLength >= 5 ? 'critical' : event.multiKillLength >= 4 ? 'high' : 'medium');
        }
        if (event.killingSpreeLength >= 5) {
          return this._createHighlight('killingSpree', event.participantId, championName,
            `${championName} had a ${event.killingSpreeLength} kill spree!`, 'medium');
        }
        return null; // Individual kills are not highlights

      case 'ELITE_MONSTER_KILL':
        if (event.monsterType === 'BARON_NASHOR') {
          return this._createHighlight('baronKill', 0, 'Team',
            `Team secured Baron Nashor at ${Math.floor(timestamp / 60000)}m`, 'high');
        }
        if (event.monsterType === 'DRAGON') {
          return this._createHighlight('dragonKill', 0, 'Team',
            `Team secured Dragon at ${Math.floor(timestamp / 60000)}m`, 'medium');
        }
        return null;

      case 'BUILDING_KILL':
        if (event.buildingType === 'TOWER_BUILDING') {
          return this._createHighlight('towerDestroyed', 0, 'Team',
            `Tower destroyed at ${Math.floor(timestamp / 60000)}m`, 'low');
        }
        if (event.buildingType === 'INHIBITOR_BUILDING') {
          return this._createHighlight('inhibitorDestroyed', 0, 'Team',
            `Inhibitor destroyed at ${Math.floor(timestamp / 60000)}m`, 'medium');
        }
        return null;

      default:
        return null;
    }
  }

  _mergeHighlights(baseHighlights, timelineHighlights) {
    const merged = [...baseHighlights];

    for (const tl of timelineHighlights) {
      const isDuplicate = merged.some(b =>
        b.type === tl.type &&
        b.participantId === tl.participantId &&
        Math.abs((b.timestamp || 0) - (tl.timestamp || 0)) < 60000 // Within 1 minute
      );

      if (!isDuplicate) {
        // Replace base timestamp with more accurate timeline timestamp
        merged.push({ ...tl, timestamp: tl.timestamp });
      }
    }

    return merged;
  }

  _calculateEnhancedScore(highlights, matchData) {
    let score = highlights.reduce((sum, h) => sum + (h.score || 0), 0);

    // Category diversity bonus (having highlights from multiple categories)
    const uniqueCategories = new Set(highlights.map(h => h.category));
    score += uniqueCategories.size * 3;

    // Streak bonus: multiple highlights in short succession
    const sorted = [...highlights].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    let streakCount = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].timestamp && sorted[i - 1].timestamp &&
        sorted[i].timestamp - sorted[i - 1].timestamp < 120000) { // Within 2 minutes
        streakCount++;
        if (streakCount >= 3) score += 5; // Streak bonus
      } else {
        streakCount = 1;
      }
    }

    // Critical highlight multiplier
    const criticalCount = highlights.filter(h => h.severity === 'critical').length;
    score += criticalCount * 5;

    return Math.min(score, 100);
  }

  _generateSummary(highlights, matchData) {
    if (!highlights.length) return 'No significant highlights detected.';

    const topHighlights = highlights
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 3);

    const summary = topHighlights.map(h => h.description).join('. ');
    const duration = matchData.gameDuration
      ? ` (${Math.floor(matchData.gameDuration / 60)}m)`
      : '';

    return `Highlights${duration}: ${summary}.`;
  }

  _exportCSV(highlights) {
    const headers = ['type', 'category', 'severity', 'participantId', 'championName', 'description', 'score', 'timestamp'];
    const rows = highlights.map(h => [
      h.type, h.category, h.severity, h.participantId,
      `"${h.championName || ''}"`, `"${h.description || ''}"`, h.score || 0, h.timestamp || 0
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  _exportMarkdown(highlights, matchData) {
    const lines = ['# Match Highlights\n'];

    if (matchData.gameDuration) {
      lines.push(`**Duration:** ${Math.floor(matchData.gameDuration / 60)}m ${matchData.gameDuration % 60}s\n`);
    }

    if (highlights.length === 0) {
      lines.push('*No highlights detected.*');
      return lines.join('\n');
    }

    const grouped = {};
    for (const h of highlights) {
      const cat = h.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(h);
    }

    for (const [category, catHighlights] of Object.entries(grouped)) {
      lines.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)}\n`);
      for (const h of catHighlights) {
        const severity = h.severity === 'critical' ? '🔴' : h.severity === 'high' ? '🟠' : h.severity === 'medium' ? '🟡' : '🟢';
        const time = h.timestamp ? ` (${Math.floor(h.timestamp / 60000)}m)` : '';
        lines.push(`- ${severity} **${h.type}**${time}: ${h.description} (${h.score || 0}pts)`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}

module.exports = HighlightAnalyzer;
