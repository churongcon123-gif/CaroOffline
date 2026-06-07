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
  static async create({ winnerId, loserId, player1Id, player2Id, winnerEloChange, loserEloChange, isDraw = false, moves = null, mode = 'online' }) {
    const query = `
      INSERT INTO match_history (winner_id, loser_id, player1_id, player2_id, winner_elo_change, loser_elo_change, is_draw, moves, mode)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      winnerId || null,
      loserId || null,
      player1Id || null,
      player2Id || null,
      winnerEloChange || 0,
      loserEloChange || 0,
      isDraw,
      moves ? JSON.stringify(moves) : null,
      mode
    ]);
    return rows[0];
  }

  /**
   * Lấy lịch sử gần nhất của 1 user (limit = 10)
   * Gộp cả ván thắng, thua và hòa.
   */
  static async getByUserId(userId, limit = 10) {
    const query = `
      SELECT 
        mh.id,
        mh.ended_at,
        mh.mode,
        mh.is_draw,
        mh.moves,
        CASE 
          WHEN mh.is_draw = TRUE THEN 'draw'
          WHEN mh.winner_id = $1 THEN 'win' 
          ELSE 'loss' 
        END AS result,
        CASE 
          WHEN mh.winner_id = $1 THEN mh.winner_elo_change 
          WHEN mh.loser_id = $1 THEN mh.loser_elo_change
          ELSE 0 
        END AS elo_change,
        COALESCE(
          CASE WHEN mh.player1_id = $1 THEN u2.username ELSE u1.username END,
          CASE WHEN mh.winner_id = $1 THEN u_loser.username ELSE u_winner.username END
        ) AS opponent_username,
        COALESCE(
          CASE WHEN mh.player1_id = $1 THEN u2.elo ELSE u1.elo END,
          CASE WHEN mh.winner_id = $1 THEN u_loser.elo ELSE u_winner.elo END
        ) AS opponent_elo
      FROM match_history mh
      LEFT JOIN users u1 ON u1.id = mh.player1_id
      LEFT JOIN users u2 ON u2.id = mh.player2_id
      LEFT JOIN users u_winner ON u_winner.id = mh.winner_id
      LEFT JOIN users u_loser ON u_loser.id = mh.loser_id
      WHERE mh.player1_id = $1 OR mh.player2_id = $1 OR mh.winner_id = $1 OR mh.loser_id = $1
      ORDER BY mh.ended_at DESC
      LIMIT $2
    `;
    const { rows } = await db.query(query, [userId, limit]);
    return rows;
  }
}

module.exports = MatchHistory;
