/**
 * HighlightDetector - Utility for detecting and scoring highlights in LoL matches
 */
class HighlightDetector {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.75;
    this.weights = {
      pentaKill: 30,
      quadraKill: 20,
      tripleKill: 10,
      firstBlood: 5,
      baronKill: 8,
      dragonKill: 4,
      killingSpree: 3,
      perfectKDA: 10,
      highDamage: 5,
      highCS: 3,
      comeback: 8,
      closeGame: 5
    };
  }

  /**
   * Analyze a match and detect all highlights
   */
  detectHighlights(matchData) {
    if (!matchData || !matchData.participants) {
      return { highlights: [], score: 0 };
    }

    const highlights = [];

    for (const participant of matchData.participants) {
      highlights.push(...this._detectMultiKills(participant, matchData));
      highlights.push(...this._detectFirstBlood(participant, matchData));
      highlights.push(...this._detectPerfectKDA(participant, matchData));
      highlights.push(...this._detectHighDamage(participant, matchData));
      highlights.push(...this._detectKillingSprees(participant, matchData));
    }

    highlights.push(...this._detectTeamObjectives(matchData));
    highlights.push(...this._detectComeback(matchData));

    const score = this._calculateScore(highlights);

    return {
      highlights: highlights.sort((a, b) => (b.severity === 'critical' ? 4 : b.severity === 'high' ? 3 : b.severity === 'medium' ? 2 : 1) -
        (a.severity === 'critical' ? 4 : a.severity === 'high' ? 3 : a.severity === 'medium' ? 2 : 1)),
      score: Math.min(score, 100)
    };
  }

  _detectMultiKills(participant, matchData) {
    const highlights = [];
    const { stats, championName, participantId } = participant;

    if (stats.pentaKills > 0) {
      highlights.push(this._createHighlight('pentaKill', participantId, championName,
        `${championName} achieved a PentaKill!`, 'critical'));
    }
    if (stats.quadraKills > 0) {
      highlights.push(this._createHighlight('quadraKill', participantId, championName,
        `${championName} achieved a QuadraKill!`, 'high'));
    }
    if (stats.tripleKills > 0) {
      highlights.push(this._createHighlight('tripleKill', participantId, championName,
        `${championName} achieved a TripleKill!`, 'medium'));
    }
    return highlights;
  }

  _detectFirstBlood(participant, matchData) {
    if (participant.stats.firstBloodKill) {
      return [this._createHighlight('firstBlood', participant.participantId,
        participant.championName, `${participant.championName} drew First Blood!`, 'medium')];
    }
    return [];
  }

  _detectPerfectKDA(participant, matchData) {
    const { kills, deaths, assists } = participant.stats;
    if (kills > 0 && deaths === 0 && assists > 0) {
      return [this._createHighlight('perfectKDA', participant.participantId,
        participant.championName,
        `${participant.championName}: Perfect KDA (${kills}/${deaths}/${assists})`, 'high')];
    }
    return [];
  }

  _detectHighDamage(participant, matchData) {
    const avgDamage = matchData.participants.reduce((s, p) => s + p.stats.totalDamageDealtToChampions, 0)
      / matchData.participants.length;
    if (participant.stats.totalDamageDealtToChampions > avgDamage * 1.5) {
      return [this._createHighlight('highDamage', participant.participantId,
        participant.championName,
        `${participant.championName} dealt ${(participant.stats.totalDamageDealtToChampions / 1000).toFixed(1)}k damage to champions`,
        'low')];
    }
    return [];
  }

  _detectKillingSprees(participant, matchData) {
    const highlights = [];
    if (participant.stats.largestKillingSpree >= 5) {
      highlights.push(this._createHighlight('killingSpree', participant.participantId,
        participant.championName,
        `${participant.championName} had a ${participant.stats.largestKillingSpree} kill spree!`, 'medium'));
    }
    return highlights;
  }

  _detectTeamObjectives(matchData) {
    const highlights = [];
    if (!matchData.teams) return highlights;

    for (const team of matchData.teams) {
      if (team.firstBaron) {
        highlights.push(this._createHighlight('baronKill', 0, 'Team',
          'Team secured Baron Nashor', 'high'));
      }
      if (team.baronKills >= 2) {
        highlights.push(this._createHighlight('baronKill', 0, 'Team',
          `Team secured ${team.baronKills} Barons!`, 'high'));
      }
    }
    return highlights;
  }

  _detectComeback(matchData) {
    // Placeholder for comeback detection logic
    // Would need timeline data from Riot API to detect gold deficits
    return [];
  }

  _createHighlight(type, participantId, championName, description, severity) {
    return {
      type,
      participantId,
      championName,
      description,
      severity,
      timestamp: Date.now(),
      score: this.weights[type] || 0
    };
  }

  _calculateScore(highlights) {
    return highlights.reduce((total, h) => total + h.score, 0);
  }

  /**
   * Check if a match is highlight-worthy
   */
  isHighlightWorthy(matchData) {
    const { score } = this.detectHighlights(matchData);
    return score >= this.threshold * 100;
  }
}

module.exports = HighlightDetector;
