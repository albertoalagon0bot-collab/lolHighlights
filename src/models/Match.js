const mongoose = require('mongoose');
const moment = require('moment');

const MatchSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true,
    unique: true
  },
  gameId: {
    type: Number,
    required: true
  },
  platformId: {
    type: String,
    required: true,
    enum: ['BR1', 'EUN1', 'EUW1', 'JP1', 'KR', 'LA1', 'LA2', 'NA1', 'OC1', 'TR1', 'RU']
  },
  seasonId: {
    type: Number,
    required: true
  },
  queueId: {
    type: Number,
    required: true
  },
  gameVersion: {
    type: String,
    required: true
  },
  gameDuration: {
    type: Number,
    required: true
  },
  gameCreation: {
    type: Number,
    required: true
  },
  gameStartTimestamp: {
    type: Number,
    required: true
  },
  gameEndTimestamp: {
    type: Number,
    required: true
  },
  participants: [{
    participantId: {
      type: Number,
      required: true
    },
    teamId: {
      type: Number,
      required: true
    },
    championId: {
      type: Number,
      required: true
    },
    championName: {
      type: String,
      required: true
    },
    spell1Id: {
      type: Number,
      required: true
    },
    spell2Id: {
      type: Number,
      required: true
    },
    stats: {
      kills: {
        type: Number,
        default: 0,
        min: 0
      },
      deaths: {
        type: Number,
        default: 0,
        min: 0
      },
      assists: {
        type: Number,
        default: 0,
        min: 0
      },
      doubleKills: {
        type: Number,
        default: 0
      },
      tripleKills: {
        type: Number,
        default: 0
      },
      quadraKills: {
        type: Number,
        default: 0
      },
      pentaKills: {
        type: Number,
        default: 0
      },
      firstBloodKill: {
        type: Boolean,
        default: false
      },
      firstBloodAssist: {
        type: Boolean,
        default: false
      },
      firstTowerKill: {
        type: Boolean,
        default: false
      },
      firstTowerAssist: {
        type: Boolean,
        default: false
      },
      firstInhibitorKill: {
        type: Boolean,
        default: false
      },
      firstInhibitorAssist: {
        type: Boolean,
        default: false
      },
      largestKillingSpree: {
        type: Number,
        default: 0
      },
      largestMultiKill: {
        type: Number,
        default: 0
      },
      totalDamageDealt: {
        type: Number,
        default: 0
      },
      totalDamageDealtToChampions: {
        type: Number,
        default: 0
      },
      totalDamageTaken: {
        type: Number,
        default: 0
      },
      totalHeal: {
        type: Number,
        default: 0
      },
      totalMinionsKilled: {
        type: Number,
        default: 0
      },
      neutralMinionsKilled: {
        type: Number,
        default: 0
      },
      neutralMinionsKilledTeamJungle: {
        type: Number,
        default: 0
      },
      neutralMinionsKilledEnemyJungle: {
        type: Number,
        default: 0
      },
      totalTimeCrowdControlDealt: {
        type: Number,
        default: 0
      },
      visionScore: {
        type: Number,
        default: 0
      },
      wardPlaced: {
        type: Number,
        default: 0
      },
      wardKilled: {
        type: Number,
        default: 0
      },
      win: {
        type: Boolean,
        required: true
      }
    },
    timeline: {
      lane: {
        type: String,
        required: true,
        enum: ['TOP', 'JUNGLE', 'MIDDLE', 'BOT', 'UTILITY']
      },
      role: {
        type: String,
        required: true,
        enum: ['SOLO', 'NONE', 'DUO_CARRY', 'DUO_SUPPORT', 'DUO', 'BOT', 'CARRY', 'SUPPORT', 'TOP', 'MIDDLE', 'JUNGLE']
      }
    }
  }],
  teams: [{
    teamId: {
      type: Number,
      required: true
    },
    win: {
      type: String,
      required: true,
      enum: 'Win' | 'Fail'
    },
    firstBlood: {
      type: Boolean,
      default: false
    },
    firstTower: {
      type: Boolean,
      default: false
    },
    firstInhibitor: {
      type: Boolean,
      default: false
    },
    firstBaron: {
      type: Boolean,
      default: false
    },
    firstDragon: {
      type: Boolean,
      default: false
    },
    firstRiftHerald: {
      type: Boolean,
      default: false
    },
    towerKills: {
      type: Number,
      default: 0
    },
    inhibitorKills: {
      type: Number,
      default: 0
    },
    baronKills: {
      type: Number,
      default: 0
    },
    dragonKills: {
      type: Number,
      default: 0
    },
    riftHeraldKills: {
      type: Number,
      default: 0
    },
    vilemawKills: {
      type: Number,
      default: 0
    },
    dominionVictoryScore: {
      type: Number,
      default: 0
    },
    riftBaronKills: {
      type: Number,
      default: 0
    }
  }],
  highlighted: {
    type: Boolean,
    default: false
  },
  highlightScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  highlights: [{
    type: {
      type: String,
      enum: ['pentaKill', 'quadraKill', 'tripleKill', 'firstBlood', 'baronBuff', 'dragonBuff', 'inhibitorDestroyed', 'towerDestroyed', 'baronKilled', 'dragonKilled', 'epicTeamfight', 'perfectKDA']
    },
    timestamp: {
      type: Number,
      required: true
    },
    participantId: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
MatchSchema.index({ matchId: 1 });
MatchSchema.index({ gameId: 1 });
MatchSchema.index({ 'participants.championId': 1 });
MatchSchema.index({ 'participants.teamId': 1 });
MatchSchema.index({ gameCreation: -1 });
MatchSchema.index({ highlighted: 1, highlightScore: -1 });

// Virtual for KDA calculation
MatchSchema.virtual('kda').get(function() {
  const stats = this.participants.map(p => ({
    kills: p.stats.kills,
    deaths: p.stats.deaths,
    assists: p.stats.assists
  }));
  
  return stats.map(s => {
    const deaths = s.deaths || 1; // Avoid division by zero
    return (s.kills + s.assists) / deaths;
  });
});

// Virtual for game duration in human readable format
MatchSchema.virtual('durationFormatted').get(function() {
  return moment.duration(this.gameDuration * 1000).humanize();
});

// Virtual for game creation date
MatchSchema.virtual('creationDate').get(function() {
  return moment(this.gameCreation).format('YYYY-MM-DD HH:mm:ss');
});

// Virtual for total kills in the match
MatchSchema.virtual('totalKills').get(function() {
  return this.participants.reduce((total, p) => total + p.stats.kills, 0);
});

// Static method to calculate highlight score
MatchSchema.statics.calculateHighlightScore = function(matchData) {
  let score = 0;
  
  // Check for multi-kills
  const multiKills = matchData.participants.filter(p => 
    p.stats.pentaKills > 0 || p.stats.quadraKills > 0 || p.stats.tripleKills > 0
  );
  
  score += multiKills.reduce((total, p) => {
    if (p.stats.pentaKills > 0) total += 30;
    if (p.stats.quadraKills > 0) total += 20;
    if (p.stats.tripleKills > 0) total += 10;
    return total;
  }, 0);
  
  // Check for first blood objectives
  if (matchData.teams.some(t => t.firstBlood)) {
    score += 5;
  }
  
  // Check for epic objectives
  const objectives = matchData.teams.reduce((total, t) => {
    total += t.towerKills;
    total += t.inhibitorKills;
    total += t.baronKills * 3;
    total += t.dragonKills * 2;
    return total;
  }, 0);
  
  score += Math.min(objectives * 2, 40); // Cap objective contribution
  
  // Check for long game duration (more likely to have highlights)
  if (matchData.gameDuration > 1800) { // 30+ minutes
    score += 5;
  }
  
  // Check for perfect KDA
  const perfectKDA = matchData.participants.filter(p => 
    p.stats.kills > 0 && p.stats.deaths === 0 && p.stats.assists > 0
  );
  score += perfectKDA.length * 5;
  
  return Math.min(Math.max(score, 0), 100); // Ensure score is between 0-100
};

// Method to detect potential highlights
MatchSchema.methods.detectHighlights = function() {
  const highlights = [];
  
  this.participants.forEach(participant => {
    // Multi-kill highlights
    if (participant.stats.pentaKills > 0) {
      highlights.push({
        type: 'pentaKill',
        timestamp: this.gameCreation + participant.stats.pentaKillTime,
        participantId: participant.participantId,
        description: `${participant.championName} achieved a PentaKill!`,
        severity: 'critical'
      });
    }
    
    if (participant.stats.quadraKills > 0) {
      highlights.push({
        type: 'quadraKill',
        timestamp: this.gameCreation + participant.stats.quadraKillTime,
        participantId: participant.participantId,
        description: `${participant.championName} achieved a QuadraKill!`,
        severity: 'high'
      });
    }
    
    if (participant.stats.tripleKills > 0) {
      highlights.push({
        type: 'tripleKill',
        timestamp: this.gameCreation + participant.stats.tripleKillTime,
        participantId: participant.participantId,
        description: `${participant.championName} achieved a TripleKill!`,
        severity: 'medium'
      });
    }
    
    // First blood highlight
    if (participant.stats.firstBloodKill) {
      highlights.push({
        type: 'firstBlood',
        timestamp: this.gameCreation + participant.stats.firstBloodKillTime,
        participantId: participant.participantId,
        description: `${participant.championName} got First Blood!`,
        severity: 'medium'
      });
    }
    
    // Perfect KDA highlight
    if (participant.stats.kills > 0 && participant.stats.deaths === 0 && participant.stats.assists > 0) {
      highlights.push({
        type: 'perfectKDA',
        timestamp: this.gameCreation,
        participantId: participant.participantId,
        description: `${participant.championName} achieved a perfect KDA (${participant.stats.kills}/${participant.stats.deaths}/${participant.stats.assists})`,
        severity: 'high'
      });
    }
  });
  
  // Team objective highlights
  this.teams.forEach(team => {
    if (team.firstTower) {
      highlights.push({
        type: 'towerDestroyed',
        timestamp: this.gameCreation + 300, // Approximate time
        participantId: 0, // Team highlight
        description: 'Team destroyed first tower',
        severity: 'low'
      });
    }
    
    if (team.firstBaron) {
      highlights.push({
        type: 'baronKilled',
        timestamp: this.gameCreation + 1800, // Approximate time
        participantId: 0, // Team highlight
        description: 'Team secured Baron Nashor',
        severity: 'high'
      });
    }
    
    if (team.firstDragon) {
      highlights.push({
        type: 'dragonKilled',
        timestamp: this.gameCreation + 900, // Approximate time
        participantId: 0, // Team highlight
        description: 'Team secured Dragon',
        severity: 'medium'
      });
    }
  });
  
  // Sort highlights by timestamp
  highlights.sort((a, b) => a.timestamp - b.timestamp);
  
  return highlights;
};

// Update timestamps before saving
MatchSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Cascade delete highlights when match is deleted
MatchSchema.pre('remove', function(next) {
  // This could be expanded to clean up related data
  next();
});

module.exports = mongoose.model('Match', MatchSchema);