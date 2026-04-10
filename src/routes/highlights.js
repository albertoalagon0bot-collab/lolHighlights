const express = require('express');
const router = express.Router();
const Match = require('../models/Match');

// GET /api/highlights - Get all highlights
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const matches = await Match.find({ highlighted: true })
      .sort({ highlightScore: -1 })
      .skip(skip)
      .limit(limit);

    const highlights = matches.flatMap(m => 
      m.highlights.map(h => ({
        ...h._doc,
        matchId: m.matchId,
        gameDuration: m.gameDuration,
        participants: m.participants,
        highlightScore: m.highlightScore
      }))
    );

    const total = await Match.countDocuments({ highlighted: true });

    res.json({
      highlights,
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

// GET /api/highlights/:id - Get specific highlight
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.id });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json({ match, highlights: match.highlights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/highlights - Create new highlight (manually)
router.post('/', async (req, res) => {
  try {
    const { matchId, highlight } = req.body;
    const match = await Match.findOne({ matchId });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    match.highlights.push(highlight);
    match.highlighted = true;
    await match.save();

    res.status(201).json({ match, highlight });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/highlights/:matchId/:highlightId - Delete highlight
router.delete('/:matchId/:highlightId', async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    match.highlights.id(req.params.highlightId).remove();
    if (match.highlights.length === 0) {
      match.highlighted = false;
    }
    await match.save();

    res.json({ message: 'Highlight deleted', match });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
