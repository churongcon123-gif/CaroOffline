import axios from 'axios';

const API_URL = 'http://localhost:5000/api/game';

/**
 * Gọi API cập nhật Elo sau ván chơi offline
 * @param {string}  token  - JWT token của người dùng
 * @param {number}  newElo - Elo mới đã tính sẵn
 * @param {boolean} won    - Người chơi có thắng không
 * @returns {{ user: Object }} - User object đã cập nhật từ DB
 */
export const updateEloApi = async (token, newElo, won) => {
  try {
    const response = await axios.post(
      `${API_URL}/update-elo`,
      { newElo, won },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Elo update failed' };
  }
};

/**
 * Lấy bảng xếp hạng Elo
 * @param {number} limit - Số người tối đa (mặc định 50)
 */
export const getLeaderboardApi = async (limit = 50) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/leaderboard?limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch leaderboard' };
  }
};
