const express = require('express');
const router = express.Router();
const Match = require('../models/Match');

// GET /api/champions - List all champions with stats
router.get('/', async (req, res) => {
  try {
    const championStats = await Match.aggregate([
      { $unwind: '$participants' },
      {
        $group: {
          _id: '$participants.championName',
          gamesPlayed: { $sum: 1 },
          wins: { $sum: { $cond: ['$participants.stats.win', 1, 0] } },
          totalKills: { $sum: '$participants.stats.kills' },
          totalDeaths: { $sum: '$participants.stats.deaths' },
          totalAssists: { $sum: '$participants.stats.assists' },
          pentaKills: { $sum: '$participants.stats.pentaKills' }
        }
      },
      { $sort: { gamesPlayed: -1 } }
    ]);

    const champions = championStats.map(c => ({
      name: c._id,
      gamesPlayed: c.gamesPlayed,
      winRate: ((c.wins / c.gamesPlayed) * 100).toFixed(1),
      avgKDA: ((c.totalKills + c.totalAssists) / Math.max(c.totalDeaths, 1)).toFixed(2),
      pentaKills: c.pentaKills
    }));

    res.json({ champions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/champions/:name - Get champion details
router.get('/:name', async (req, res) => {
  try {
    const matches = await Match.find({ 'participants.championName': req.params.name })
      .sort({ gameCreation: -1 })
      .limit(10);

    res.json({ champion: req.params.name, recentMatches: matches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
