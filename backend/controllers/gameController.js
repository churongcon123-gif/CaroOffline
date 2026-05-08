const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * POST /api/game/update-elo
 * Cập nhật Elo và thống kê sau mỗi ván chơi offline (vs AI hoặc 2 người)
 * Body: { newElo: number, won: boolean }
 * Header: Authorization: Bearer <token>
 */
const updateElo = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const { newElo, won } = req.body;
    if (newElo === undefined || won === undefined) {
      return res.status(400).json({ error: 'newElo and won are required' });
    }
    if (typeof newElo !== 'number' || newElo < 100 || newElo > 3500) {
      return res.status(400).json({ error: 'newElo must be a number between 100 and 3500' });
    }
    if (typeof won !== 'boolean') {
      return res.status(400).json({ error: 'won must be a boolean' });
    }

    const updatedUser = await User.updateEloAndStats(decoded.userId, Math.round(newElo), won);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Elo updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        elo: updatedUser.elo,
        wins: updatedUser.wins,
        losses: updatedUser.losses,
        matches_played: updatedUser.matches_played,
      }
    });
  } catch (error) {
    console.error('Update elo error:', error);
    res.status(500).json({ error: 'Server error during Elo update' });
  }
};

module.exports = { updateElo };
