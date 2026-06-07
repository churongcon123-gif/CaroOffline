import React, { useState, useEffect, useRef } from 'react';
import Board from '../Board';

const ReplayModal = ({ isOpen, onClose, moves = [], opponentName, result, winningCells = [] }) => {
  if (!isOpen) return null;

  const [currentIdx, setCurrentIdx] = useState(-1); // -1 là chưa đi nước nào
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef(null);
  const movesEndRef = useRef(null);

  // Parse moves nếu nó là chuỗi JSON từ backend
  let parsedMoves = [];
  try {
    parsedMoves = typeof moves === 'string' ? JSON.parse(moves) : moves;
  } catch (e) {
    console.error('Error parsing moves:', e);
  }

  // Tự động cuộn danh sách nước đi bên phải đến nước đi hiện tại
  useEffect(() => {
    const activeEl = document.getElementById(`replay-move-${currentIdx}`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentIdx]);

  // Xử lý tự động chạy (Auto Play)
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentIdx(prev => {
          if (prev >= parsedMoves.length - 1) {
            setIsPlaying(false);
            clearInterval(playIntervalRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }

    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, parsedMoves.length]);

  // Dừng auto play khi close modal
  useEffect(() => {
    return () => {
      setIsPlaying(false);
    };
  }, []);

  // Tạo board ảo 15x15
  const displayBoard = Array(15).fill(null).map(() => Array(15).fill(null));
  for (let i = 0; i <= currentIdx; i++) {
    const mv = parsedMoves[i];
    if (mv && mv.row !== undefined && mv.col !== undefined) {
      displayBoard[mv.row][mv.col] = mv.symbol;
    }
  }

  // Tìm winning cells tự động tại board trạng thái hiện tại
  const getWinningCellsClient = (board) => {
    const SIZE = 15;
    const directions = [
      [[0, 1],  [0, -1] ],
      [[1, 0],  [-1, 0] ],
      [[1, 1],  [-1, -1]],
      [[1, -1], [-1, 1] ]
    ];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const symbol = board[r][c];
        if (!symbol) continue;
        for (const dir of directions) {
          const cells = [[r, c]];
          for (let i = 0; i < 2; i++) {
            let row = r + dir[i][0];
            let col = c + dir[i][1];
            while (row >= 0 && row < SIZE && col >= 0 && col < SIZE && board[row][col] === symbol) {
              cells.push([row, col]);
              row += dir[i][0];
              col += dir[i][1];
            }
          }
          if (cells.length >= 5) return cells;
        }
      }
    }
    return [];
  };

  // Chỉ highlight winning cells khi xem đến nước cuối cùng
  const showWinCells = currentIdx === parsedMoves.length - 1 ? getWinningCellsClient(displayBoard) : [];

  const handleNext = () => {
    setIsPlaying(false);
    if (currentIdx < parsedMoves.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    setIsPlaying(false);
    if (currentIdx > -1) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleFirst = () => {
    setIsPlaying(false);
    setCurrentIdx(-1);
  };

  const handleLast = () => {
    setIsPlaying(false);
    setCurrentIdx(parsedMoves.length - 1);
  };

  const togglePlay = () => {
    if (currentIdx >= parsedMoves.length - 1) {
      setCurrentIdx(-1);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const getCoordinate = (row, col) => {
    const colLetter = String.fromCharCode(65 + col);
    const rowNumber = row + 1;
    return `${colLetter}${rowNumber}`;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(10,14,22,0.85)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: 'var(--steam-card-bg)', border: '1px solid var(--steam-border)',
        borderRadius: '8px', padding: '24px', maxWidth: '820px', width: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
        maxHeight: '90vh'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--steam-border)', paddingBottom: '12px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--steam-highlight)', fontSize: '18px' }}>
              👁️ Xem lại ván đấu
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)', marginTop: '4px' }}>
              Đối thủ: <strong style={{ color: 'var(--steam-orange)' }}>{opponentName}</strong> | Kết quả: <span style={{ color: result === 'win' ? 'var(--steam-green-bright)' : result === 'draw' ? 'var(--steam-orange)' : '#e84c3d', fontWeight: 'bold' }}>{result === 'win' ? 'THẮNG' : result === 'draw' ? 'HÒA' : 'THUA'}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--steam-text-dim)', fontSize: '24px', cursor: 'pointer', outline: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--steam-text-dim)'}>
            &times;
          </button>
        </div>

        {/* Content Body */}
        <div style={{ display: 'flex', gap: '20px', overflow: 'hidden', flexWrap: 'wrap', justifyContent: 'center' }}>
          
          {/* Left: Board & Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 420px' }}>
            <div style={{ transform: 'scale(0.95)', transformOrigin: 'top center', marginBottom: '10px' }}>
              <Board board={displayBoard} disabled={true} winCells={showWinCells} />
            </div>

            {/* Controls */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              
              {/* Slider timeline */}
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--steam-text-dim)', minWidth: '24px' }}>-1</span>
                <input
                  type="range"
                  min="-1"
                  max={parsedMoves.length - 1}
                  value={currentIdx}
                  onChange={(e) => { setIsPlaying(false); setCurrentIdx(parseInt(e.target.value)); }}
                  style={{ flex: 1, accentColor: 'var(--steam-blue)', cursor: 'pointer', height: '4px', background: 'var(--steam-border)', borderRadius: '2px' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--steam-text-dim)', minWidth: '24px', textAlign: 'right' }}>{parsedMoves.length - 1}</span>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button onClick={handleFirst} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} title="Về nước đầu">
                  ⏮️
                </button>
                <button onClick={handlePrev} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} title="Lùi 1 nước">
                  ◀️
                </button>
                <button onClick={togglePlay} className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '12px', minWidth: '80px', justifyContent: 'center' }}>
                  {isPlaying ? '⏸️ Tạm dừng' : '▶️ Tự động'}
                </button>
                <button onClick={handleNext} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} title="Tiến 1 nước">
                  ▶️
                </button>
                <button onClick={handleLast} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} title="Đến nước cuối">
                  ⏭️
                </button>
              </div>

              {/* Info notation */}
              <div style={{ fontSize: '13px', color: 'var(--steam-highlight)', background: 'rgba(0,0,0,0.2)', padding: '6px 16px', borderRadius: '4px', border: '1px solid var(--steam-border)', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                {currentIdx === -1 ? (
                  <span>🏁 Ván đấu chưa bắt đầu (Lượt của X)</span>
                ) : (
                  <span>
                    Nước <strong>{currentIdx + 1}/{parsedMoves.length}</strong>: Người chơi <strong style={{ color: parsedMoves[currentIdx].symbol === 'X' ? 'var(--steam-blue)' : 'var(--steam-orange)' }}>{parsedMoves[currentIdx].username}</strong> đi quân <strong>{parsedMoves[currentIdx].symbol}</strong> tại <strong>{getCoordinate(parsedMoves[currentIdx].row, parsedMoves[currentIdx].col)}</strong>
                  </span>
                )}
              </div>

            </div>
          </div>

          {/* Right: Moves list */}
          <div style={{
            flex: '1 1 200px', display: 'flex', flexDirection: 'column',
            maxHeight: '480px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--steam-border)',
            borderRadius: '4px', overflow: 'hidden'
          }}>
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--steam-border)', fontSize: '12px', fontWeight: 'bold', color: 'var(--steam-highlight)' }}>
              📜 Trình tự nước đi ({parsedMoves.length})
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {parsedMoves.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--steam-text-dim)', fontSize: '11px', marginTop: '20px' }}>
                  Không có nước đi nào được ghi nhận.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {parsedMoves.map((mv, idx) => {
                    const isActive = currentIdx === idx;
                    return (
                      <button
                        key={idx}
                        id={`replay-move-${idx}`}
                        onClick={() => { setIsPlaying(false); setCurrentIdx(idx); }}
                        style={{
                          display: 'flex', justifyContent: 'space-between', padding: '6px 10px',
                          background: isActive ? 'rgba(42,122,186,0.25)' : 'none',
                          border: isActive ? '1px solid var(--steam-blue)' : '1px solid transparent',
                          borderRadius: '3px', color: isActive ? '#fff' : 'var(--steam-text-dim)',
                          cursor: 'pointer', fontSize: '11px', textAlign: 'left', outline: 'none',
                          transition: 'background 0.15s, color 0.15s'
                        }}
                        onMouseEnter={e => { if(!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { if(!isActive) e.currentTarget.style.background = 'none'; }}
                      >
                        <span style={{ fontWeight: 'bold' }}>{idx + 1}. {mv.symbol} : {getCoordinate(mv.row, mv.col)}</span>
                        <span>{mv.username}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ReplayModal;
