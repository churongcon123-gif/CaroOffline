import React from 'react';
import Cell from '../Cell';

const SIZE = 15;
const COLS = 'ABCDEFGHIJKLMNO'.split('');

/**
 * Board component nâng cao:
 * - Pass currentSymbol xuống Cell để hiển thị hover preview
 * - Coordinate labels: A-O (cột) và 1-15 (hàng)
 *
 * @param {Array[][]} board
 * @param {Function}  onCellClick
 * @param {boolean}   disabled
 * @param {Array}     winCells   - [[row,col], ...]
 * @param {string}    currentSymbol - 'X' hoặc 'O' (lượt hiện tại)
 */
const Board = ({ board, onCellClick, disabled, winCells = [], currentSymbol }) => {
  const winSet = new Set(winCells.map(([r, c]) => `${r},${c}`));

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 0 }}>
      {/* Column labels row */}
      <div style={{ display: 'flex', marginLeft: '22px', marginBottom: '2px' }}>
        {COLS.map(col => (
          <div key={col} style={{
            width: '30px', textAlign: 'center',
            fontSize: '9px', color: 'rgba(255,255,255,0.3)',
            fontWeight: '600', letterSpacing: '0.02em',
            userSelect: 'none'
          }}>
            {col}
          </div>
        ))}
        <div style={{ width: '1px' }} /> {/* gap compensation */}
      </div>

      {/* Board rows with row label */}
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Row number labels */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {board.map((_, rIndex) => (
            <div key={rIndex} style={{
              width: '20px', height: '30px',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              paddingRight: '3px',
              fontSize: '9px', color: 'rgba(255,255,255,0.3)',
              fontWeight: '600', userSelect: 'none',
              marginBottom: rIndex < SIZE - 1 ? '1px' : '0'
            }}>
              {rIndex + 1}
            </div>
          ))}
        </div>

        {/* Grid */}
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
                currentSymbol={currentSymbol}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Board;
