const express = require('express');
const router = express.Router();
const Match = require('../models/Match');

// GET /api/matches - Get all matches with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const matches = await Match.find()
      .sort({ gameCreation: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Match.countDocuments();

    res.json({
      matches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/matches/:id - Get specific match
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.id });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/matches - Create new match
router.post('/', async (req, res) => {
  try {
    const match = new Match(req.body);
    await match.save();
    res.status(201).json(match);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Match already exists' });
    }
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
