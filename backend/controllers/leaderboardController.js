const db = require('../configs/db');

/**
 * GET /api/leaderboard
 * Trả về danh sách người chơi phân trang, xếp theo Elo giảm dần.
 * Hỗ trợ tham số: page, limit
 * Trả về: leaderboard, totalUsers, page, totalPages
 */
const getLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    // Lấy tổng số người chơi
    const countRes = await db.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(countRes.rows[0].count) || 0;
    const totalPages = Math.ceil(totalUsers / limit);

    // Lấy danh sách kèm theo xếp hạng toàn cục
    const { rows } = await db.query(
      `SELECT
         sub.rank,
         sub.username,
         sub.elo,
         sub.wins,
         sub.losses,
         sub.matches_played,
         sub.win_rate
       FROM (
         SELECT
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
       ) sub
       ORDER BY sub.rank ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ 
      leaderboard: rows,
      totalUsers,
      page,
      totalPages
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error fetching leaderboard' });
  }
};

module.exports = { getLeaderboard };
