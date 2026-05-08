import React from 'react';
import Cell from '../Cell';

/**
 * @param {Array[][]} board      - 20x20 board state
 * @param {Function}  onCellClick
 * @param {boolean}   disabled   - Disable all cells
 * @param {Array}     winCells   - Array of [row, col] to highlight (winning line)
 */
const Board = ({ board, onCellClick, disabled, winCells = [] }) => {
  const SIZE = 15;

  // Build a Set for O(1) lookup
  const winSet = new Set(winCells.map(([r, c]) => `${r},${c}`));

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${SIZE}, 30px)`,
      gridTemplateRows: `repeat(${SIZE}, 30px)`,
      gap: '1px',
      background: 'var(--steam-border)',
      border: '1px solid var(--steam-border)',
      padding: '1px'
    }}>
      {board.map((row, rIndex) =>
        row.map((cellValue, cIndex) => (
          <Cell
            key={`${rIndex}-${cIndex}`}
            value={cellValue}
            onClick={() => onCellClick(rIndex, cIndex)}
            disabled={disabled || cellValue !== null}
            highlighted={winSet.has(`${rIndex},${cIndex}`)}
          />
        ))
      )}
    </div>
  );
};

export default Board;
