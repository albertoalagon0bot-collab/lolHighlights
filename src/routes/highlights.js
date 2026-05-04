const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const HighlightAnalyzer = require('../utils/HighlightAnalyzer');

const analyzer = new HighlightAnalyzer();

// GET /api/highlights - Get all highlights with search and filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter query
    const query = { highlighted: true };
    if (req.query.type) query['highlights.type'] = req.query.type;
    if (req.query.severity) query['highlights.severity'] = req.query.severity;

    const sortField = req.query.sort === 'score' ? { highlightScore: -1 } : { gameCreation: -1 };

    const matches = await Match.find(query)
      .sort(sortField)
      .skip(skip)
      .limit(limit);

    let highlights = matches.flatMap(m =>
      m.highlights.map(h => ({
        ...h._doc,
        matchId: m.matchId,
        gameDuration: m.gameDuration,
        highlightScore: m.highlightScore
      }))
    );

    // Client-side filtering for text search and category
    if (req.query.search) {
      const term = req.query.search.toLowerCase();
      highlights = highlights.filter(h =>
        (h.description && h.description.toLowerCase().includes(term)) ||
        (h.type && h.type.toLowerCase().includes(term))
      );
    }

    const total = await Match.countDocuments(query);

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

// POST /api/highlights/:matchId/export - Export highlights
router.get('/:matchId/export', async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const format = (req.query.format || 'json').toLowerCase();
    const matchObj = match.toObject();

    const exported = analyzer.exportHighlights(matchObj, format);

    if (format === 'csv') {
      res.type('text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="highlights-${req.params.matchId}.csv"`);
    } else if (format === 'markdown') {
      res.type('text/markdown');
    } else {
      res.type('application/json');
    }

    res.send(exported);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/highlights/:matchId/analyze - Run enhanced analysis on a match
router.post('/:matchId/analyze', async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const matchObj = match.toObject();
    const analysis = analyzer.analyzeMatch(matchObj);

    // Update match with new highlights and score
    match.highlights = analysis.highlights;
    match.highlightScore = analysis.score;
    match.highlighted = analysis.isHighlightWorthy;
    await match.save();

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
