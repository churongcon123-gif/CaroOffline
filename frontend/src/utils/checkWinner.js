/**
 * ============================================================
 * CHECK WINNER — Kiểm tra điều kiện thắng (5-in-a-row)
 * ============================================================
 * Dùng cho cả 3 chế độ: vs AI, 2 người offline, online.
 *
 * Có 2 hàm:
 *   - getWinningCells: trả về mảng ô tạo thành chuỗi thắng (để highlight)
 *   - checkWinner: trả về true/false đơn giản
 * ============================================================
 */

/**
 * Tìm các ô tạo thành chuỗi thắng (≥ 5 liên tiếp cùng symbol).
 *
 * Duyệt 4 hướng từ ô vừa đặt:
 *   - Ngang:      [0,1] + [0,-1]
 *   - Dọc:        [1,0] + [-1,0]
 *   - Chéo chính: [1,1] + [-1,-1]
 *   - Chéo phụ:   [1,-1] + [-1,1]
 *
 * @param {Array[][]} board  - Bàn cờ hiện tại
 * @param {number}    row    - Hàng vừa đặt quân
 * @param {number}    col    - Cột vừa đặt quân
 * @param {string}    symbol - 'X' hoặc 'O'
 * @returns {Array<[number, number]> | null}
 *   Mảng [row, col] của 5+ ô thắng, hoặc null nếu chưa thắng.
 *   Dùng kết quả này để highlight bàn cờ trên UI.
 */
export const getWinningCells = (board, row, col, symbol) => {
  const SIZE = 15;

  // Mỗi phần tử là cặp [hướng dương, hướng âm]
  const directions = [
    [[0, 1],  [0, -1] ], // Ngang
    [[1, 0],  [-1, 0] ], // Dọc
    [[1, 1],  [-1, -1]], // Chéo chính
    [[1, -1], [-1, 1] ]  // Chéo phụ
  ];

  for (let dir of directions) {
    let cells = [[row, col]]; // Bắt đầu với ô hiện tại

    // Duyệt 2 chiều của hướng (dương và âm)
    for (let i = 0; i < 2; i++) {
      let r = row + dir[i][0];
      let c = col + dir[i][1];
      // Đi tiếp khi còn trong bàn cờ và cùng symbol
      while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === symbol) {
        cells.push([r, c]);
        r += dir[i][0];
        c += dir[i][1];
      }
    }

    // ≥ 5 quân liên tiếp → thắng, trả về danh sách ô
    if (cells.length >= 5) return cells;
  }

  return null; // Chưa thắng
};

/**
 * Kiểm tra có thắng tại ô (row, col) không — phiên bản boolean.
 * Dùng ở GameRoom (online) nơi chỉ cần biết true/false.
 *
 * @param {Array[][]} board
 * @param {number}    row
 * @param {number}    col
 * @param {string}    symbol - 'X' hoặc 'O'
 * @returns {boolean} true nếu có chuỗi ≥ 5 liên tiếp
 */
export const checkWinner = (board, row, col, symbol) => {
  const SIZE = 15;

  const directions = [
    [[0, 1],  [0, -1] ], // Ngang
    [[1, 0],  [-1, 0] ], // Dọc
    [[1, 1],  [-1, -1]], // Chéo chính
    [[1, -1], [-1, 1] ]  // Chéo phụ
  ];

  for (let dir of directions) {
    let count = 1; // Kể cả ô hiện tại

    for (let i = 0; i < 2; i++) {
      let r = row + dir[i][0];
      let c = col + dir[i][1];
      while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === symbol) {
        count++;
        r += dir[i][0];
        c += dir[i][1];
      }
    }

    if (count >= 5) return true;
  }

  return false;
};
