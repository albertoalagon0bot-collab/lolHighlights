const express = require('express');
const router = express.Router();
const { getClient } = require('../services/riotApi');
const Summoner = require('../models/Summoner');
const Match = require('../models/Match');

// GET /api/summoners/:region/:name - Lookup summoner and fetch matches
router.get('/:region/:name', async (req, res) => {
  try {
    const { region, name } = req.params;
    const riotClient = getClient();

    // Fetch from Riot API
    const summonerData = await riotClient.getSummonerByName(name, region);

    // Upsert summoner in DB
    const summoner = await Summoner.findOneAndUpdate(
      { summonerId: summonerData.id },
      {
        summonerId: summonerData.id,
        puuid: summonerData.puuid,
        accountId: summonerData.accountId,
        name: summonerData.name,
        profileIconId: summonerData.profileIconId,
        summonerLevel: summonerData.summonerLevel,
        region
      },
      { upsert: true, new: true }
    );

    res.json(summoner);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: 'Summoner not found' });
    }
    if (error.response && error.response.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/summoners/:region/:name/matches - Get match history
router.get('/:region/:name/matches', async (req, res) => {
  try {
    const { region, name } = req.params;
    const { start = 0, count = 20 } = req.query;

    const riotClient = getClient();

    // Get summoner to find puuid
    let summoner = await Summoner.findOne({ name, region });
    if (!summoner) {
      const summonerData = await riotClient.getSummonerByName(name, region);
      summoner = await Summoner.create({
        summonerId: summonerData.id,
        puuid: summonerData.puuid,
        accountId: summonerData.accountId,
        name: summonerData.name,
        profileIconId: summonerData.profileIconId,
        summonerLevel: summonerData.summonerLevel,
        region
      });
    }

    // Fetch match IDs from Riot
    const matchIds = await riotClient.getMatchHistory(summoner.puuid, region, {
      start: parseInt(start),
      count: parseInt(count)
    });

    // Check which matches are already in DB
    const existingMatches = await Match.find(
      { matchId: { $in: matchIds } },
      { matchId: 1, highlightScore: 1, highlights: 1 }
    ).lean();

    const existingMap = new Map(existingMatches.map(m => [m.matchId, m]));

    // For matches not in DB, fetch from Riot
    const matches = [];
    const newMatchIds = matchIds.filter(id => !existingMap.has(id));

    for (const matchId of newMatchIds) {
      try {
        const matchData = await riotClient.getMatch(matchId, region);
        // Store match in DB
        const savedMatch = await Match.findOneAndUpdate(
          { matchId: matchData.metadata.matchId },
          {
            matchId: matchData.metadata.matchId,
            gameId: matchData.info.gameId,
            platformId: matchData.info.platformId,
            seasonId: matchData.info.seasonId || 0,
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
              spell1Id: p.summoner1Id,
              spell2Id: p.summoner2Id,
              stats: p.stats,
              timeline: p.timeline
            })),
            teams: matchData.info.teams
          },
          { upsert: true, new: true }
        );
        matches.push(savedMatch);
      } catch (err) {
        console.warn(`Failed to fetch match ${matchId}: ${err.message}`);
      }
    }

    // Add existing DB matches
    for (const matchId of matchIds) {
      if (existingMap.has(matchId) && !matches.find(m => m.matchId === matchId)) {
        matches.push(existingMap.get(matchId));
      }
    }

    // Update summoner's last fetched time
    await Summoner.updateOne({ _id: summoner._id }, {
      lastMatchFetchedAt: new Date(),
      matchesCount: matches.length
    });

    res.json({
      summoner: { name: summoner.name, region: summoner.region, level: summoner.summonerLevel },
      matches,
      pagination: { start: parseInt(start), count: matches.length, total: matchIds.length }
    });
  } catch (error) {
    if (error.response && error.response.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
