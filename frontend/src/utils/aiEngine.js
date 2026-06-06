/**
 * ============================================================
 * AI ENGINE — Game Caro 15×15
 * ============================================================
 * Thuật toán chọn nước đi tốt nhất cho AI theo 7 bước ưu tiên:
 *
 *   1. Thắng ngay nếu có thể (FIVE)
 *   2. Chặn người chơi thắng ngay (FIVE)
 *   3. Tạo open-4 (AI chắc chắn thắng nước tiếp)
 *   4. Chặn open-4 của người chơi
 *   5. Tạo closed-4
 *   6. Chặn closed-4 hoặc open-3 của người chơi
 *   7. Heuristic tổng hợp + random theo Elo (bước duy nhất bị ảnh hưởng bởi độ khó)
 *
 * Bước 1–6 luôn thực hiện tối ưu bất kể Elo.
 * ============================================================
 */

import { getAIDifficulty } from './eloCalculator';

const SIZE = 15; // Kích thước bàn cờ 15×15

/**
 * Bảng điểm heuristic cho từng dạng chuỗi quân.
 * Giá trị cao hơn = mối đe doạ lớn hơn.
 */
const SCORE = {
  FIVE:          1_000_000, // 5 liên tiếp → thắng ngay
  OPEN_FOUR:       100_000, // 4 liên tiếp, 2 đầu mở → chắc thắng nước sau
  CLOSED_FOUR:      10_000, // 4 liên tiếp, 1 đầu mở
  OPEN_THREE:       10_000, // 3 liên tiếp, 2 đầu mở → nguy hiểm
  CLOSED_THREE:      1_000, // 3 liên tiếp, 1 đầu mở
  OPEN_TWO:          1_000, // 2 liên tiếp, 2 đầu mở
  CLOSED_TWO:          100, // 2 liên tiếp, 1 đầu mở
};

/** 4 hướng kiểm tra: ngang, dọc, chéo chính, chéo phụ */
const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]];

/**
 * Tính điểm cho một chuỗi quân dựa trên độ dài và số đầu mở.
 * @param {number} count     - Số quân liên tiếp
 * @param {number} openEnds  - Số đầu mở (0, 1, hoặc 2)
 * @returns {number} Điểm heuristic
 */
function scoreSequence(count, openEnds) {
  if (count >= 5) return SCORE.FIVE;
  if (count === 4) return openEnds >= 2 ? SCORE.OPEN_FOUR  : SCORE.CLOSED_FOUR;
  if (count === 3) return openEnds >= 2 ? SCORE.OPEN_THREE : SCORE.CLOSED_THREE;
  if (count === 2) return openEnds >= 2 ? SCORE.OPEN_TWO   : SCORE.CLOSED_TWO;
  return 1;
}

/**
 * Đánh giá tổng điểm của một symbol tại vị trí (row, col).
 * Board phải đã có symbol tại ô đó trước khi gọi hàm này.
 *
 * @param {Array[][]} board  - Bàn cờ hiện tại
 * @param {number}    row    - Hàng vừa đặt
 * @param {number}    col    - Cột vừa đặt
 * @param {string}    symbol - 'X' hoặc 'O'
 * @returns {number} Tổng điểm tất cả 4 hướng
 */
function evaluatePosition(board, row, col, symbol) {
  let total = 0;

  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;    // Đếm quân liên tiếp (kể cả ô hiện tại)
    let openEnds = 0; // Đếm số đầu mở

    // Duyệt theo hướng dương (dr, dc)
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === symbol) {
      count++; r += dr; c += dc;
    }
    // Kiểm tra đầu mở theo hướng dương
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === null) openEnds++;

    // Duyệt theo hướng âm (-dr, -dc)
    r = row - dr; c = col - dc;
    while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === symbol) {
      count++; r -= dr; c -= dc;
    }
    // Kiểm tra đầu mở theo hướng âm
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === null) openEnds++;

    total += scoreSequence(count, openEnds);
  }

  return total;
}

/**
 * Lấy danh sách ô ứng viên (trống, trong bán kính quanh quân đã đặt).
 * - Bán kính 3 nếu < 6 quân (đầu trận, mở rộng tìm kiếm).
 * - Bán kính 2 nếu ≥ 6 quân (giữa/cuối trận, tập trung vùng chiến đấu).
 * - Nếu bàn trống hoàn toàn → trả về ô trung tâm (7,7).
 *
 * @param {Array[][]} board
 * @returns {Array<[number, number]>} Danh sách [row, col] ứng viên
 */
function getCandidateMoves(board) {
  let pieceCount = 0;
  const candidates = new Set();

  // Đếm tổng quân đã đặt
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== null) pieceCount++;
    }
  }

  // Bàn trống → AI đánh trung tâm
  if (pieceCount === 0) return [[7, 7]];

  const RANGE = pieceCount < 6 ? 3 : 2;

  // Lấy các ô trống quanh quân đã đặt trong bán kính RANGE
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== null) {
        for (let dr = -RANGE; dr <= RANGE; dr++) {
          for (let dc = -RANGE; dc <= RANGE; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === null) {
              candidates.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
  }

  return Array.from(candidates).map(s => s.split(',').map(Number));
}

/**
 * Tính điểm tấn công (atk) và phòng thủ (def) cho mỗi ô ứng viên.
 * - atkScore: điểm nếu AI đặt quân tại ô này
 * - defScore: điểm nếu người chơi đặt quân tại ô này (cần chặn)
 * - combined: max(atk, def×1.5) — ưu tiên phòng thủ hơn tấn công
 *
 * @returns {Array} Mảng đã sort theo combined score giảm dần
 */
function scoreMoves(board, aiSymbol, playerSymbol, candidates) {
  const scored = candidates.map(([r, c]) => {
    // Tính điểm tấn công: giả sử AI đặt tại (r,c)
    const boardAI = board.map(row => [...row]);
    boardAI[r][c] = aiSymbol;
    const atkScore = evaluatePosition(boardAI, r, c, aiSymbol);

    // Tính điểm phòng thủ: giả sử người chơi đặt tại (r,c)
    const boardP = board.map(row => [...row]);
    boardP[r][c] = playerSymbol;
    const defScore = evaluatePosition(boardP, r, c, playerSymbol);

    // Phòng thủ có hệ số 1.5× → ưu tiên chặn địch trong heuristic
    const combined = Math.max(atkScore, defScore * 1.5);
    return { r, c, atkScore, defScore, score: combined };
  });

  // Sort giảm dần theo combined score
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * Hàm chính: AI chọn nước đi tốt nhất.
 *
 * @param {Array[][]} board      - Bàn cờ 15×15 hiện tại
 * @param {string}    aiSymbol   - Ký hiệu AI ('O')
 * @param {number}    playerElo  - Elo người chơi (quyết định pickFrom ở bước 7)
 * @returns {{ row: number, col: number }} Ô tốt nhất để AI đặt quân
 */
export function getBestMove(board, aiSymbol, playerElo) {
  const playerSymbol = aiSymbol === 'X' ? 'O' : 'X';

  // Lấy ứng viên và lọc ô còn trống (tránh race condition)
  const rawCandidates = getCandidateMoves(board);
  const candidates = rawCandidates.filter(([r, c]) => board[r][c] === null);

  // Không còn ô nào → fallback trung tâm
  if (candidates.length === 0) return { row: 7, col: 7 };

  // Tính điểm cho tất cả ứng viên
  const scored = scoreMoves(board, aiSymbol, playerSymbol, candidates);

  // ── Bước 1: Thắng ngay ───────────────────────────────────────
  const winMove = scored.find(s => s.atkScore >= SCORE.FIVE);
  if (winMove) return { row: winMove.r, col: winMove.c };

  // ── Bước 2: Chặn người chơi thắng ngay ───────────────────────
  const blockWin = scored.find(s => s.defScore >= SCORE.FIVE);
  if (blockWin) return { row: blockWin.r, col: blockWin.c };

  // ── Bước 3: Tạo open-4 (AI thắng ván tiếp theo chắc chắn) ───
  const createOpenFour = scored.find(s => s.atkScore >= SCORE.OPEN_FOUR);
  if (createOpenFour) return { row: createOpenFour.r, col: createOpenFour.c };

  // ── Bước 4: Chặn open-4 của người chơi ───────────────────────
  const blockOpenFour = scored.find(s => s.defScore >= SCORE.OPEN_FOUR);
  if (blockOpenFour) return { row: blockOpenFour.r, col: blockOpenFour.c };

  // ── Bước 5: Tạo closed-4 ─────────────────────────────────────
  const createClosedFour = scored.find(s => s.atkScore >= SCORE.CLOSED_FOUR);
  if (createClosedFour) return { row: createClosedFour.r, col: createClosedFour.c };

  // ── Bước 6: Chặn closed-4 hoặc open-3 của người chơi ─────────
  const blockThreat = scored.find(
    s => s.defScore >= SCORE.CLOSED_FOUR || s.defScore >= SCORE.OPEN_THREE
  );
  if (blockThreat) return { row: blockThreat.r, col: blockThreat.c };

  // ── Bước 7: Heuristic + random theo Elo ──────────────────────
  // pickFrom=1  (Elo cao)  → luôn chọn nước tốt nhất (deterministic)
  // pickFrom=12 (Elo thấp) → random trong top 12 nước (dễ tính)
  const { pickFrom } = getAIDifficulty(playerElo);
  const actualPickFrom = Math.min(pickFrom, scored.length);
  const idx = Math.floor(Math.random() * actualPickFrom);
  return { row: scored[idx].r, col: scored[idx].c };
}
