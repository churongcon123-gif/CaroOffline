/**
 * Tính Elo mới theo công thức chuẩn FIDE
 * @param {number} playerElo  - Elo hiện tại của người chơi
 * @param {number} opponentElo - Elo của đối thủ (người hoặc AI reference)
 * @param {number} result - 1 = thắng, 0.5 = hòa, 0 = thua
 * @returns {number} Elo mới (tối thiểu 100)
 */
export const calculateElo = (playerElo, opponentElo, result) => {
  const K = playerElo < 2100 ? 32 : 16;
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const newElo = Math.round(playerElo + K * (result - expected));
  return Math.max(100, newElo);
};

/**
 * Xác định thông tin độ khó AI dựa trên Elo người chơi
 * @param {number} playerElo
 * @returns {{ level: string, label: string, aiElo: number, color: string, pickFrom: number }}
 */
export const getAIDifficulty = (playerElo) => {
  if (playerElo < 1200) {
    return { level: 'Dễ', label: 'EASY', aiElo: 1000, color: '#57cbde', pickFrom: 12 };
  }
  if (playerElo < 1400) {
    return { level: 'Trung Bình', label: 'MEDIUM', aiElo: 1300, color: '#f4b942', pickFrom: 5 };
  }
  if (playerElo < 1600) {
    return { level: 'Khó', label: 'HARD', aiElo: 1500, color: '#e87c23', pickFrom: 2 };
  }
  return { level: 'Chuyên Gia', label: 'EXPERT', aiElo: 1800, color: '#e84c3d', pickFrom: 1 };
};
