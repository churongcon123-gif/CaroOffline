/**
 * ============================================================
 * GAME CONTROLLER — Xử lý logic game phía backend
 * ============================================================
 * Hiện tại chứa 1 endpoint chính:
 *   POST /api/game/update-elo
 *   → Cập nhật Elo và thống kê sau ván chơi offline (UC-04, UC-06)
 *
 * Authentication: JWT Bearer token bắt buộc.
 * ============================================================
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * POST /api/game/update-elo
 *
 * Cập nhật điểm Elo và số liệu thống kê (matches_played, wins, losses)
 * sau mỗi ván chơi offline (vs AI hoặc 2 người).
 *
 * Flow:
 *   1. Lấy và verify JWT từ Authorization header
 *   2. Validate body: newElo (100–3500, number) và won (boolean)
 *   3. Gọi User.updateEloAndStats() → UPDATE PostgreSQL
 *   4. Trả về user object đã cập nhật
 *
 * Request:
 *   Header: Authorization: Bearer <JWT>
 *   Body:   { newElo: number, won: boolean }
 *
 * Response 200:
 *   { message: string, user: { id, username, elo, wins, losses, matches_played } }
 *
 * Response errors:
 *   401 - Không có token hoặc token không hợp lệ
 *   400 - newElo hoặc won không hợp lệ
 *   404 - Không tìm thấy user (hiếm, chỉ xảy ra nếu account bị xóa sau khi login)
 *   500 - Lỗi server/DB
 */
const updateElo = async (req, res) => {
  try {
    // ── Bước 1: Xác thực JWT ──────────────────────────────────────
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      // Giải mã token → lấy userId và username
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // ── Bước 2: Validate request body ────────────────────────────
    const { newElo, won } = req.body;

    if (newElo === undefined || won === undefined) {
      return res.status(400).json({ error: 'newElo and won are required' });
    }
    // newElo phải là số hợp lệ trong khoảng cho phép
    if (typeof newElo !== 'number' || newElo < 100 || newElo > 3500) {
      return res.status(400).json({ error: 'newElo must be a number between 100 and 3500' });
    }
    // won phải là boolean (không chấp nhận string "true"/"false")
    if (typeof won !== 'boolean') {
      return res.status(400).json({ error: 'won must be a boolean' });
    }

    // ── Bước 3: Cập nhật DB ───────────────────────────────────────
    // Math.round() đảm bảo newElo là số nguyên trước khi lưu
    const updatedUser = await User.updateEloAndStats(decoded.userId, Math.round(newElo), won);

    if (!updatedUser) {
      // Hiếm gặp: user bị xóa sau khi login
      return res.status(404).json({ error: 'User not found' });
    }

    // ── Bước 4: Trả về user đã cập nhật ──────────────────────────
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
