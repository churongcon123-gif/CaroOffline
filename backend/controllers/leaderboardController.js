const db = require('../configs/db');

/**
 * GET /api/leaderboard
 * Trả về top 50 người chơi xếp theo Elo giảm dần.
 * Bao gồm: rank, username, elo, wins, losses, matches_played, win_rate
 */
const getLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const { rows } = await db.query(
      `SELECT
         ROW_NUMBER() OVER (ORDER BY elo DESC, wins DESC) AS rank,
         username,
         elo,
         wins,
         losses,
         matches_played,
         CASE
           WHEN matches_played > 0
           THEN ROUND((wins::NUMERIC / matches_played) * 100, 1)
           ELSE 0
         END AS win_rate
       FROM users
       ORDER BY elo DESC, wins DESC
       LIMIT $1`,
      [limit]
    );

    res.json({ leaderboard: rows });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error fetching leaderboard' });
  }
};

module.exports = { getLeaderboard };
