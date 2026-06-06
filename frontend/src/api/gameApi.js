/**
 * ============================================================
 * GAME API — HTTP calls liên quan đến game
 * ============================================================
 * Kết nối frontend với backend REST API:
 *   - updateEloApi: lưu Elo sau ván offline (UC-04, UC-06)
 *   - getLeaderboardApi: lấy bảng xếp hạng top N người chơi
 *
 * Base URL tự động chọn:
 *   - Có VITE_API_URL (production) → dùng Render backend
 *   - Không có (local dev)         → http://localhost:5000/api
 * ============================================================
 */

import axios from 'axios';

// Base URL game API — tự detect môi trường
const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/game`
  : 'http://localhost:5000/api/game';

/**
 * Gọi API cập nhật Elo sau ván chơi offline (vs AI hoặc 2 người).
 *
 * Endpoint: POST /api/game/update-elo
 * Auth: Bearer JWT token (bắt buộc, server sẽ verify)
 *
 * Backend sẽ:
 *   1. Verify JWT → lấy userId
 *   2. Validate newElo (100–3500) và won (boolean)
 *   3. UPDATE users SET elo, matches_played, wins/losses
 *   4. Trả về user object đã cập nhật
 *
 * @param {string}  token  - JWT token lấy từ authStore
 * @param {number}  newElo - Elo mới đã tính sẵn bằng calculateElo()
 * @param {boolean} won    - true nếu người chơi thắng
 * @returns {Promise<{ message: string, user: Object }>} User đã cập nhật từ DB
 */
export const updateEloApi = async (token, newElo, won) => {
  try {
    const response = await axios.post(
      `${API_URL}/update-elo`,
      { newElo, won },
      {
        headers: {
          Authorization: `Bearer ${token}` // JWT xác thực người dùng
        }
      }
    );
    return response.data;
  } catch (error) {
    // Ném lỗi từ server hoặc lỗi mạng chung
    throw error.response?.data || { error: 'Elo update failed' };
  }
};

/**
 * Lấy bảng xếp hạng Elo (top N người chơi).
 *
 * Endpoint: GET /api/leaderboard?limit=N
 * Auth: Không cần (public endpoint)
 *
 * Server trả về danh sách sort theo elo DESC, wins DESC,
 * kèm rank, win_rate được tính bằng SQL ROW_NUMBER().
 *
 * @param {number} limit - Số người tối đa muốn lấy (mặc định 50, tối đa 100)
 * @returns {Promise<{ leaderboard: Array }>}
 */
export const getLeaderboardApi = async (page = 1, limit = 10) => {
  try {
    const url = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/leaderboard?page=${page}&limit=${limit}`
      : `http://localhost:5000/api/leaderboard?page=${page}&limit=${limit}`;

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch leaderboard' };
  }
};
