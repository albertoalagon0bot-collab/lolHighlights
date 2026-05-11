/**
 * Riot Games Service - Main integration layer
 * Handles automatic match fetching and processing
 */
const { getClient } = require('../services/riotApi')
const Match = require('../models/Match')
const { run: runMigrations } = require('../config/migrations')
const db = require('../config/database')

class RiotService {
  constructor (options = {}) {
    this.client = getClient()
    this.processingQueue = []
    this.isProcessing = false
    this.autoFetchEnabled = options.autoFetch !== false
    this.fetchInterval = options.fetchInterval || 3600000 // 1 hour
  }

  /**
   * Enable/disable automatic match fetching
   */
  setAutoFetch (enabled) {
    this.autoFetchEnabled = enabled
    if (enabled && !this.isProcessing) {
      this.startAutoFetch()
    }
  }

  /**
   * Start automatic match fetching loop
   */
  startAutoFetch () {
    if (this.autoFetchInterval) {
      clearInterval(this.autoFetchInterval)
    }

    this.autoFetchInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processAutoFetch()
      }
    }, this.fetchInterval)

    console.log(`Auto-match fetching started (${this.fetchInterval / 1000 / 60} minute intervals)`)
  }

  /**
   * Stop automatic fetching
   */
  stopAutoFetch () {
    if (this.autoFetchInterval) {
      clearInterval(this.autoFetchInterval)
      this.autoFetchInterval = null
      console.log('Auto-match fetching stopped')
    }
  }

  /**
   * Main auto-fetch processing
   */
  async processAutoFetch () {
    try {
      const summoners = await this.getTrackedSummoners()
      for (const summoner of summoners) {
        await this.fetchSummonerMatches(summoner)
      }
    } catch (error) {
      console.error('Auto-fetch failed:', error.message)
    }
  }

  /**
   * Get summoners that are being tracked for matches
   */
  async getTrackedSummoners () {
    // This could be implemented with a Summoner collection
    // For now, return default summoners from environment
    const trackedNames = process.env.TRACKED_SUMMONERS?.split(',') || []
    const summoners = []

    for (const name of trackedNames) {
      try {
        const summonerData = await this.client.getSummonerByName(name.trim())
        summoners.push({
          name: name.trim(),
          ...summonerData,
          lastProcessed: new Date()
        })
      } catch (error) {
        console.warn(`Failed to get summoner ${name}: ${error.message}`)
      }
    }

    return summoners
  }

  /**
   * Fetch and process matches for a summoner
   */
  async fetchSummonerMatches (summoner) {
    try {
      console.log(`Fetching matches for ${summoner.name} (${summoner.puuid})`)

      // Get match history
      const matchIds = await this.client.getMatchHistory(
        summoner.puuid,
        summoner.region || 'euw1',
        { start: 0, count: 20 }
      )

      let processed = 0
      for (const matchId of matchIds) {
        try {
          const exists = await Match.findOne({ matchId })
          if (!exists) {
            await this.processMatch(matchId, summoner.region)
            processed++
          }
        } catch (error) {
          console.warn(`Failed to process match ${matchId}: ${error.message}`)
        }
      }

      if (processed > 0) {
        console.log(`Processed ${processed} new matches for ${summoner.name}`)
      }
    } catch (error) {
      console.error(`Failed to fetch matches for ${summoner.name}: ${error.message}`)
    }
  }

  /**
   * Process a single match from Riot API
   */
  async processMatch (matchId, region) {
    try {
      console.log(`Processing match ${matchId}`)

      // Fetch match data
      const matchData = await this.client.getMatch(matchId, region)

      // Fetch timeline data
      const timelineData = await this.client.getMatchTimeline(matchId, region)

      // Create match document
      const match = new Match({
        matchId: matchData.metadata.matchId,
        gameId: matchData.metadata.gameId,
        platformId: matchData.metadata.platformId,
        seasonId: matchData.info.gameSettings?.seasonId || 13,
        queueId: matchData.info.queueId,
        gameVersion: matchData.info.gameVersion,
        gameDuration: matchData.info.gameDuration,
        gameCreation: matchData.info.gameCreation,
        gameStartTimestamp: matchData.info.gameStartTimestamp,
        gameEndTimestamp: matchData.info.gameEndTimestamp,
        participants: matchData.info.participants.map(p => ({
          participantId: p.participantId,
          teamId: p.teamId,
          championId: p.championId,
          championName: p.championName,
          spell1Id: p.perks.styles[0].selections[0].perk,
          spell2Id: p.perks.styles[1]?.selections[0]?.perk || p.summoner2Id,
          stats: {
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            doubleKills: p.doubleKills,
            tripleKills: p.tripleKills,
            quadraKills: p.quadraKills,
            pentaKills: p.pentaKills,
            firstBloodKill: p.firstBloodKill,
            firstBloodAssist: p.firstBloodAssist,
            firstTowerKill: p.firstTowerKill,
            firstTowerAssist: p.firstTowerAssist,
            firstInhibitorKill: p.firstInhibitorKill,
            firstInhibitorAssist: p.firstInhibitorAssist,
            largestKillingSpree: p.largestKillingSpree,
            largestMultiKill: p.largestMultiKill,
            totalDamageDealt: p.totalDamageDealt,
            totalDamageDealtToChampions: p.totalDamageDealtToChampions,
            totalDamageTaken: p.totalDamageTaken,
            totalHeal: p.totalHeal,
            totalMinionsKilled: p.totalMinionsKilled,
            neutralMinionsKilled: p.neutralMinionsKilled,
            neutralMinionsKilledTeamJungle: p.neutralMinionsKilledTeamJungle,
            neutralMinionsKilledEnemyJungle: p.neutralMinionsKilledEnemyJungle,
            totalTimeCrowdControlDealt: p.totalTimeCrowdControlDealt,
            visionScore: p.visionScore,
            wardPlaced: p.wardPlaced,
            wardKilled: p.wardKilled,
            win: p.win
          },
          timeline: {
            lane: p.lane,
            role: p.role
          }
        })),
        teams: matchData.info.teams.map(t => ({
          teamId: t.teamId,
          win: t.win,
          firstBlood: t.objectives.firstBlood,
          firstTower: t.objectives.firstTower,
          firstInhibitor: t.objectives.firstInhibitor,
          firstBaron: t.objectives.firstBaron,
          firstDragon: t.objectives.firstDragon,
          firstRiftHerald: t.objectives.firstRiftHerald,
          towerKills: t.objectives.towerKills,
          inhibitorKills: t.objectives.inhibitorKills,
          baronKills: t.objectives.baronKills,
          dragonKills: t.objectives.dragonKills,
          riftHeraldKills: t.objectives.riftHeraldKills,
          vilemawKills: t.objectives.vilemawKills,
          dominionVictoryScore: t.objectives.dominionVictoryScore,
          riftBaronKills: t.objectives.riftBaronKills
        }))
      })

      // Detect highlights
      const detectedHighlights = match.detectHighlights()
      match.highlights = detectedHighlights
      match.highlightScore = Match.calculateHighlightScore(matchData.info)
      match.highlighted = match.highlightScore >= 75

      // Save to database
      await match.save()
      console.log(`✓ Match ${matchId} processed and saved`)

      return match
    } catch (error) {
      console.error(`Failed to process match ${matchId}: ${error.message}`)
      throw error
    }
  }

  /**
   * Get summoner by name and fetch their recent matches
   */
  async getSummonerWithMatches (summonerName, region, options = {}) {
    try {
      const summoner = await this.client.getSummonerByName(summonerName, region)
      const matchIds = await this.client.getMatchHistory(
        summoner.puuid,
        region,
        options
      )

      const matches = []
      for (const matchId of matchIds.slice(0, 10)) { // Limit to 10 matches
        try {
          const match = await this.client.getMatch(matchId, region)
          matches.push(match)
        } catch (error) {
          console.warn(`Failed to fetch match ${matchId}: ${error.message}`)
        }
      }

      return { summoner, matches }
    } catch (error) {
      console.error(`Failed to get summoner with matches: ${error.message}`)
      throw error
    }
  }

  /**
   * Validate API key and check connectivity
   */
  async validateConnection () {
    try {
      const status = await this.client.getStatus()
      const { valid } = await this.client.validateKey()

      return {
        valid,
        status,
        regions: Object.keys(require('../services/riotApi').REGIONS),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }
}

module.exports = RiotService
