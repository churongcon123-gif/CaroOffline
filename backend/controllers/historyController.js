/**
 * ============================================================
 * HISTORY CONTROLLER — API lấy lịch sử trận đấu
 * ============================================================
 */
const MatchHistory = require('../models/MatchHistory');
const jwt = require('jsonwebtoken');

/**
 * GET /api/history
 * Query params: limit (mặc định 10)
 * Cần Bearer token để xác thực userId
 */
const getHistory = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const history = await MatchHistory.getByUserId(decoded.userId, limit);

    res.json({ history });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getHistory };
