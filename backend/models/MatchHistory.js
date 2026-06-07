/**
 * ============================================================
 * MATCH HISTORY MODEL — Bảng lưu lịch sử trận đấu
 * ============================================================
 */
const db = require('../configs/db');

class MatchHistory {
  /**
   * Ghi lịch sử 1 ván đấu vào DB
   */
  static async create({ winnerId, loserId, winnerEloChange, loserEloChange, mode = 'online' }) {
    const query = `
      INSERT INTO match_history (winner_id, loser_id, winner_elo_change, loser_elo_change, mode)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const { rows } = await db.query(query, [winnerId, loserId, winnerEloChange, loserEloChange, mode]);
    return rows[0];
  }

  /**
   * Lấy lịch sử gần nhất của 1 user (limit = 10)
   * Gộp cả ván thắng và thua.
   */
  static async getByUserId(userId, limit = 10) {
    const query = `
      SELECT 
        mh.id,
        mh.ended_at,
        mh.mode,
        CASE WHEN mh.winner_id = $1 THEN 'win' ELSE 'loss' END AS result,
        CASE WHEN mh.winner_id = $1 THEN mh.winner_elo_change ELSE mh.loser_elo_change END AS elo_change,
        CASE WHEN mh.winner_id = $1 THEN u2.username ELSE u1.username END AS opponent_username,
        CASE WHEN mh.winner_id = $1 THEN u2.elo ELSE u1.elo END AS opponent_elo
      FROM match_history mh
      JOIN users u1 ON u1.id = mh.winner_id
      JOIN users u2 ON u2.id = mh.loser_id
      WHERE mh.winner_id = $1 OR mh.loser_id = $1
      ORDER BY mh.ended_at DESC
      LIMIT $2
    `;
    const { rows } = await db.query(query, [userId, limit]);
    return rows;
  }
}

module.exports = MatchHistory;
