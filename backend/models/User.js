/**
 * ============================================================
 * USER MODEL — Tương tác với bảng `users` trong PostgreSQL
 * ============================================================
 * Cung cấp các static method để CRUD dữ liệu người dùng.
 * Tất cả query dùng parameterized ($1, $2...) để tránh SQL injection.
 * ============================================================
 */

const db = require('../configs/db');

class User {
  /**
   * Tạo tài khoản người dùng mới.
   * Elo mặc định = 1200 (theo schema.sql).
   *
   * @param {string} username - Tên đăng nhập (unique)
   * @param {string} password - Mật khẩu đã được hash bằng bcrypt
   * @returns {Object} User vừa tạo: { id, username, elo, matches_played, wins, losses }
   */
  static async create(username, password) {
    const query = `
      INSERT INTO users (username, password) 
      VALUES ($1, $2) 
      RETURNING id, username, elo, matches_played, wins, losses
    `;
    const { rows } = await db.query(query, [username, password]);
    return rows[0];
  }

  /**
   * Tìm người dùng theo username.
   * Dùng để kiểm tra username trùng (register) và xác thực mật khẩu (login).
   * Trả về toàn bộ row kể cả password hash.
   *
   * @param {string} username
   * @returns {Object|undefined} User object hoặc undefined nếu không tìm thấy
   */
  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const { rows } = await db.query(query, [username]);
    return rows[0]; // undefined nếu không có
  }

  /**
   * Tìm người dùng theo ID (không trả về password).
   * Dùng khi cần lấy thông tin user từ JWT payload.
   *
   * @param {number} id - User ID (SERIAL từ DB)
   * @returns {Object|undefined} User object không có password
   */
  static async findById(id) {
    const query = 'SELECT id, username, elo, matches_played, wins, losses FROM users WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  /**
   * Cập nhật Elo và thống kê sau một ván chơi (UC-04: vs AI).
   *
   * Luôn tăng matches_played thêm 1.
   * Nếu won=true  → wins   += 1, losses không đổi.
   * Nếu won=false → losses += 1, wins   không đổi.
   *
   * SQL dùng tham số $2 và $3 là 0 hoặc 1, tránh cần IF/CASE trong code.
   *
   * @param {number}  userId - ID người chơi (từ JWT decoded)
   * @param {number}  newElo - Elo mới đã được tính và làm tròn
   * @param {boolean} won    - true nếu người chơi thắng
   * @returns {Object} User object đã cập nhật
   */
  static async updateEloAndStats(userId, newElo, won) {
    const query = `
      UPDATE users
      SET elo            = $1,
          matches_played = matches_played + 1,
          wins           = wins + $2,
          losses         = losses + $3
      WHERE id = $4
      RETURNING id, username, elo, matches_played, wins, losses
    `;
    const { rows } = await db.query(query, [
      newElo,
      won ? 1 : 0, // $2: tăng wins nếu thắng
      won ? 0 : 1, // $3: tăng losses nếu thua
      userId
    ]);
    return rows[0];
  }

  /**
   * Cập nhật mật khẩu người dùng.
   */
  static async updatePassword(userId, hashedPassword) {
    const query = 'UPDATE users SET password = $1 WHERE id = $2 RETURNING id';
    const { rows } = await db.query(query, [hashedPassword, userId]);
    return rows[0];
  }
}

module.exports = User;
