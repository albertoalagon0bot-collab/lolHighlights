const express = require('express')
const router = express.Router()
const RiotService = require('../services/riotService')
const Match = require('../models/Match')

// Initialize riot service
const riotService = new RiotService({
  autoFetch: process.env.AUTO_FETCH !== 'false',
  fetchInterval: parseInt(process.env.FETCH_INTERVAL) || 3600000 // 1 hour default
})

// GET /api/riot/status - Check API connectivity
router.get('/status', async (req, res) => {
  try {
    const status = await riotService.validateConnection()
    res.json(status)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/riot/fetch-summoner - Fetch matches for a specific summoner
router.post('/fetch-summoner', async (req, res) => {
  try {
    const { summonerName, region } = req.body

    if (!summonerName) {
      return res.status(400).json({ error: 'Summoner name is required' })
    }

    const result = await riotService.getSummonerWithMatches(
      summonerName,
      region || 'euw1',
      { count: 10 }
    )

    // Process and save matches
    const processedMatches = []
    for (const matchData of result.matches) {
      try {
        const match = await riotService.processMatch(
          matchData.metadata.matchId,
          region || 'euw1'
        )
        processedMatches.push(match)
      } catch (error) {
        console.warn(`Failed to process match: ${error.message}`)
      }
    }

    res.json({
      summoner: result.summoner,
      processedMatches: processedMatches.length,
      matches: processedMatches
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/riot/process-match - Process a specific match ID
router.post('/process-match', async (req, res) => {
  try {
    const { matchId, region } = req.body

    if (!matchId) {
      return res.status(400).json({ error: 'Match ID is required' })
    }

    const match = await riotService.processMatch(matchId, region || 'euw1')

    res.json({
      match,
      message: 'Match processed successfully'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/riot/summoners/:name - Get summoner by name
router.get('/summoners/:name', async (req, res) => {
  try {
    const { name } = req.params
    const { region } = req.query

    const summoner = await riotService.client.getSummonerByName(name, region)
    res.json(summoner)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
})

// GET /api/riot/matches/:puuid - Get match history for a PUUID
router.get('/matches/:puuid', async (req, res) => {
  try {
    const { puuid } = req.params
    const { region, start, count, queue } = req.query

    const matchIds = await riotService.client.getMatchHistory(
      puuid,
      region || 'euw1',
      { start: parseInt(start) || 0, count: parseInt(count) || 20, queue }
    )

    const matches = []
    for (const matchId of matchIds) {
      try {
        const match = await Match.findOne({ matchId })
        if (match) {
          matches.push(match)
        }
      } catch (error) {
        console.warn(`Failed to get match ${matchId}: ${error.message}`)
      }
    }

    res.json({
      puuid,
      matchIds,
      matches: matches.length,
      data: matches
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/riot/auto-fetch/toggle - Toggle automatic match fetching
router.post('/auto-fetch/toggle', async (req, res) => {
  try {
    const { enabled } = req.body

    if (enabled) {
      riotService.startAutoFetch()
      res.json({ message: 'Auto-fetch enabled' })
    } else {
      riotService.stopAutoFetch()
      res.json({ message: 'Auto-fetch disabled' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/riot/auto-fetch/status - Get auto-fetch status
router.get('/auto-fetch/status', async (req, res) => {
  try {
    const status = {
      enabled: riotService.autoFetchEnabled,
      isProcessing: riotService.isProcessing,
      interval: riotService.fetchInterval,
      lastProcessed: riotService.lastProcessed || null
    }

    res.json(status)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/riot/champions - Get champion list
router.get('/champions', async (req, res) => {
  try {
    const { version } = req.query
    const champions = await riotService.client.getChampionList(version)
    res.json(champions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/riot/champions/:name - Get specific champion
router.get('/champions/:name', async (req, res) => {
  try {
    const { name } = req.params
    const { version } = req.query
    const champion = await riotService.client.getChampionByName(name, version)
    res.json(champion)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
})

module.exports = router
