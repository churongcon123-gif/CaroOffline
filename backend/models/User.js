const db = require('../configs/db');

class User {
  static async create(username, password) {
    const query = `
      INSERT INTO users (username, password) 
      VALUES ($1, $2) 
      RETURNING id, username, elo, matches_played, wins, losses
    `;
    const { rows } = await db.query(query, [username, password]);
    return rows[0];
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const { rows } = await db.query(query, [username]);
    return rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, username, elo, matches_played, wins, losses FROM users WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async updateEloAndStats(userId, newElo, won) {
    const query = `
      UPDATE users
      SET elo = $1,
          matches_played = matches_played + 1,
          wins = wins + $2,
          losses = losses + $3
      WHERE id = $4
      RETURNING id, username, elo, matches_played, wins, losses
    `;
    const { rows } = await db.query(query, [
      newElo,
      won ? 1 : 0,
      won ? 0 : 1,
      userId
    ]);
    return rows[0];
  }
}

module.exports = User;
