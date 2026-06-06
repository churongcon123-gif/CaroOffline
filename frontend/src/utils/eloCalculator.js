/**
 * ============================================================
 * ELO CALCULATOR — Hệ thống tính điểm Elo chuẩn FIDE
 * ============================================================
 * Dùng cho UC-04: sau mỗi ván vs AI, tính Elo mới của người chơi
 * và xác định độ khó AI dựa trên Elo hiện tại.
 * ============================================================
 */

/**
 * Tính Elo mới theo công thức chuẩn FIDE.
 *
 * Công thức:
 *   K        = playerElo < 2100 ? 32 : 16   (hệ số biến động)
 *   expected = 1 / (1 + 10^((opponentElo - playerElo) / 400))
 *   newElo   = playerElo + K × (result - expected)
 *
 * Ví dụ: player=1200, AI=1300, thắng (result=1)
 *   K=32, expected≈0.36 → newElo = 1200 + 32×(1-0.36) ≈ 1220
 *
 * @param {number} playerElo   - Elo hiện tại của người chơi
 * @param {number} opponentElo - Elo của đối thủ (AI reference Elo)
 * @param {number} result      - 1 = thắng, 0.5 = hòa, 0 = thua
 * @returns {number} Elo mới (tối thiểu 100, tránh Elo âm)
 */
export const calculateElo = (playerElo, opponentElo, result) => {
  // K-factor: người chơi dưới 2100 biến động mạnh hơn (32 vs 16)
  const K = playerElo < 2100 ? 32 : 16;

  // Xác suất kỳ vọng thắng theo công thức Elo
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));

  // Elo mới = Elo cũ + K × (kết quả thực - kỳ vọng)
  const newElo = Math.round(playerElo + K * (result - expected));

  // Đảm bảo Elo không xuống dưới 100
  return Math.max(100, newElo);
};

/**
 * Xác định thông tin độ khó AI dựa trên Elo người chơi.
 *
 * Mapping:
 *   Elo < 1200  → Dễ       (aiElo=1000, pickFrom=12) — AI chơi tệ nhất
 *   Elo < 1400  → Trung Bình (aiElo=1300, pickFrom=5)
 *   Elo < 1600  → Khó      (aiElo=1500, pickFrom=2)
 *   Elo ≥ 1600  → Chuyên Gia (aiElo=1800, pickFrom=1) — AI chọn nước tốt nhất
 *
 * `pickFrom`: số nước AI random trong top N nước heuristic (bước 7 của getBestMove).
 * pickFrom=1 → deterministic (luôn chọn nước số 1).
 * pickFrom=12 → rất random (chọn ngẫu nhiên trong top 12).
 *
 * @param {number} playerElo
 * @returns {{ level: string, label: string, aiElo: number, color: string, pickFrom: number }}
 */
export const getAIDifficulty = (playerElo) => {
  if (playerElo < 1200) {
    // Dễ: AI yếu nhất, chơi ngẫu nhiên nhiều
    return { level: 'Dễ', label: 'EASY', aiElo: 1000, color: '#57cbde', pickFrom: 12 };
  }
  if (playerElo < 1400) {
    // Trung bình: AI chọn trong top 5 nước
    return { level: 'Trung Bình', label: 'MEDIUM', aiElo: 1300, color: '#f4b942', pickFrom: 5 };
  }
  if (playerElo < 1600) {
    // Khó: AI chọn trong top 2 nước
    return { level: 'Khó', label: 'HARD', aiElo: 1500, color: '#e87c23', pickFrom: 2 };
  }
  // Chuyên gia: AI luôn chọn nước tốt nhất
  return { level: 'Chuyên Gia', label: 'EXPERT', aiElo: 1800, color: '#e84c3d', pickFrom: 1 };
};
