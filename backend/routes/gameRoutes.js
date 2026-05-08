const express = require('express');
const router = express.Router();
const { updateElo } = require('../controllers/gameController');

// POST /api/game/update-elo
router.post('/update-elo', updateElo);

module.exports = router;
