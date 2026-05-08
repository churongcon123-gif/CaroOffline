const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/leaderboardController');

// GET /api/leaderboard?limit=50
router.get('/', getLeaderboard);

module.exports = router;
