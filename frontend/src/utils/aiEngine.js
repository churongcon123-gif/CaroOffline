/**
 * AI Engine cho game Caro 20x20 — Phiên bản nâng cao
 *
 * Thứ tự ưu tiên tuyệt đối (override mọi random):
 *   1. Thắng ngay nếu có thể (FIVE)
 *   2. Chặn người chơi thắng ngay (FIVE)
 *   3. Tạo open-4 (AI thắng ở nước tiếp theo, không thể chặn)
 *   4. Chặn open-4 của người chơi
 *   5. Tạo closed-4 (vẫn là mối đe dọa lớn)
 *   6. Chặn closed-4 hoặc open-3 của người chơi
 *   7. Heuristic tổng hợp + random theo Elo (pickFrom)
 *
 * Elo chỉ ảnh hưởng đến bước 7 — các bước 1–6 luôn thực hiện tối ưu.
 */

import { getAIDifficulty } from './eloCalculator';

const SIZE = 15;

const SCORE = {
  FIVE:          1_000_000,
  OPEN_FOUR:       100_000,
  CLOSED_FOUR:      10_000,
  OPEN_THREE:       10_000,
  CLOSED_THREE:      1_000,
  OPEN_TWO:          1_000,
  CLOSED_TWO:          100,
};

const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]];

/** Tính điểm cho một chuỗi dựa trên độ dài và số đầu mở */
function scoreSequence(count, openEnds) {
  if (count >= 5) return SCORE.FIVE;
  if (count === 4) return openEnds >= 2 ? SCORE.OPEN_FOUR  : SCORE.CLOSED_FOUR;
  if (count === 3) return openEnds >= 2 ? SCORE.OPEN_THREE : SCORE.CLOSED_THREE;
  if (count === 2) return openEnds >= 2 ? SCORE.OPEN_TWO   : SCORE.CLOSED_TWO;
  return 1;
}

/**
 * Đánh giá tổng điểm của symbol tại (row, col) trên board
 * (board phải đã có symbol tại ô đó).
 */
function evaluatePosition(board, row, col, symbol) {
  let total = 0;
  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    let openEnds = 0;

    let r = row + dr, c = col + dc;
    while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === symbol) {
      count++; r += dr; c += dc;
    }
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === null) openEnds++;

    r = row - dr; c = col - dc;
    while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === symbol) {
      count++; r -= dr; c -= dc;
    }
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === null) openEnds++;

    total += scoreSequence(count, openEnds);
  }
  return total;
}

/**
 * Lấy danh sách ô trống trong bán kính 2 quanh các quân đã đặt.
 * Tăng bán kính lên 3 nếu bàn còn ít quân (đầu trận).
 */
function getCandidateMoves(board) {
  let pieceCount = 0;
  const candidates = new Set();

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== null) {
        pieceCount++;
      }
    }
  }

  if (pieceCount === 0) return [[7, 7]];

  const RANGE = pieceCount < 6 ? 3 : 2;

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
 * Tính điểm tấn công và phòng thủ cho mỗi ô ứng viên.
 * Trả về mảng đã sort theo combined score giảm dần.
 */
function scoreMoves(board, aiSymbol, playerSymbol, candidates) {
  const scored = candidates.map(([r, c]) => {
    const boardAI = board.map(row => [...row]);
    boardAI[r][c] = aiSymbol;
    const atkScore = evaluatePosition(boardAI, r, c, aiSymbol);

    const boardP = board.map(row => [...row]);
    boardP[r][c] = playerSymbol;
    const defScore = evaluatePosition(boardP, r, c, playerSymbol);

    // Defense có trọng số cao hơn (1.5x) để ưu tiên chặn trong heuristic
    const combined = Math.max(atkScore, defScore * 1.5);
    return { r, c, atkScore, defScore, score: combined };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * AI chọn nước đi tốt nhất.
 *
 * @param {Array[][]} board      - Bàn cờ 15x15
 * @param {string}   aiSymbol   - Ký hiệu của AI ('X' hoặc 'O')
 * @param {number}   playerElo  - Elo người chơi (quyết định độ khó ở bước heuristic)
 * @returns {{ row: number, col: number }}
 */
export function getBestMove(board, aiSymbol, playerElo) {
  const playerSymbol = aiSymbol === 'X' ? 'O' : 'X';
  const rawCandidates = getCandidateMoves(board);
  const candidates = rawCandidates.filter(([r, c]) => board[r][c] === null);

  if (candidates.length === 0) return { row: 7, col: 7 };

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
  // pickFrom = 1 (Elo cao) → luôn chọn nước tốt nhất
  // pickFrom = 12 (Elo thấp) → random trong top 12 nước
  const { pickFrom } = getAIDifficulty(playerElo);
  const actualPickFrom = Math.min(pickFrom, scored.length);
  const idx = Math.floor(Math.random() * actualPickFrom);
  return { row: scored[idx].r, col: scored[idx].c };
}
