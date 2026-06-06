/**
 * ============================================================
 * AUTH STORE — Quản lý trạng thái xác thực người dùng (Zustand)
 * ============================================================
 * Store toàn cục lưu thông tin người dùng đã đăng nhập.
 * Dữ liệu được persist vào localStorage để giữ session khi refresh.
 *
 * Được dùng trong UC-04 để:
 *   - Lấy user.elo (tính độ khó AI)
 *   - Lấy token (gửi request lưu Elo)
 *   - Cập nhật Elo mới sau ván (updateUserElo)
 * ============================================================
 */

import { create } from 'zustand';

/**
 * useAuthStore — Zustand store cho authentication.
 *
 * State:
 *   user  - Object chứa thông tin người dùng (id, username, elo, wins, losses, matches_played)
 *           hoặc null nếu chưa đăng nhập.
 *   token - JWT token string, hoặc null.
 *
 * Actions:
 *   setAuth(user, token)      - Gọi sau khi đăng nhập thành công
 *   updateUserElo(updatedUser)- Gọi sau khi lưu Elo lên server thành công
 *   logout()                  - Xóa session
 */
const useAuthStore = create((set) => ({
  // Khởi tạo từ localStorage để persist qua refresh trang
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,

  /**
   * Lưu thông tin đăng nhập vào store và localStorage.
   * Gọi sau khi login API trả về thành công.
   *
   * @param {Object} user  - { id, username, elo, wins, losses, matches_played }
   * @param {string} token - JWT token (hết hạn sau 24h)
   */
  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },

  /**
   * Cập nhật thông tin user (chủ yếu Elo) sau ván chơi.
   * Merge updatedUser vào state hiện tại thay vì replace hoàn toàn
   * → tránh mất các field không được server trả về.
   *
   * @param {Object} updatedUser - User object mới từ /api/game/update-elo
   */
  updateUserElo: (updatedUser) => {
    set((state) => {
      // Merge để giữ nguyên các field cũ, ghi đè field mới (elo, wins, losses...)
      const newUser = { ...state.user, ...updatedUser };
      // Đồng bộ localStorage
      localStorage.setItem('user', JSON.stringify(newUser));
      return { user: newUser };
    });
  },

  /**
   * Đăng xuất: xóa toàn bộ session khỏi store và localStorage.
   */
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  }
}));

export default useAuthStore;
