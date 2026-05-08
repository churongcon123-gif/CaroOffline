/**
 * Trả về mảng các ô [row, col] tạo thành chuỗi chiến thắng, hoặc null nếu chưa thắng.
 */
export const getWinningCells = (board, row, col, symbol) => {
  const SIZE = 15;
  const directions = [
    [[0, 1], [0, -1]],
    [[1, 0], [-1, 0]],
    [[1, 1], [-1, -1]],
    [[1, -1], [-1, 1]]
  ];

  for (let dir of directions) {
    let cells = [[row, col]];
    for (let i = 0; i < 2; i++) {
      let r = row + dir[i][0];
      let c = col + dir[i][1];
      while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === symbol) {
        cells.push([r, c]);
        r += dir[i][0];
        c += dir[i][1];
      }
    }
    if (cells.length >= 5) return cells;
  }
  return null;
};

export const checkWinner = (board, row, col, symbol) => {
  const SIZE = 15;
  
  // Directions: [dRow, dCol]
  // Horizontal, Vertical, Diagonal 1, Diagonal 2
  const directions = [
    [[0, 1], [0, -1]],
    [[1, 0], [-1, 0]],
    [[1, 1], [-1, -1]],
    [[1, -1], [-1, 1]]
  ];

  for (let dir of directions) {
    let count = 1; // Count the current piece
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
