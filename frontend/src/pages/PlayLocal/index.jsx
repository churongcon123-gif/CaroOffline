import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../states/authStore';
import Board from '../../components/Board';
import { getWinningCells } from '../../utils/checkWinner';

const SIZE = 15;
const TURN_TIME = 30;
const emptyBoard = () => Array(SIZE).fill(null).map(() => Array(SIZE).fill(null));

const TimerRing = ({ timeLeft, total = TURN_TIME, color }) => {
  const r = 26, stroke = 4;
  const circ = 2 * Math.PI * r;
  const pct = timeLeft / total;
  return (
    <svg width={64} height={64} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={32} cy={32} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <circle cx={32} cy={32} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s' }}
      />
      <text x={32} y={32} textAnchor="middle" dominantBaseline="central"
        style={{ transform: 'rotate(90deg)', transformOrigin: '32px 32px', fill: color, fontSize: '15px', fontWeight: 700, fontFamily: 'Inter,sans-serif' }}>
        {timeLeft}
      </text>
    </svg>
  );
};

const PlayLocal = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Setup
  const [setupDone, setSetupDone] = useState(false);
  const [p2Name, setP2Name] = useState('Player 2');
  const [bestOf, setBestOf] = useState(3); // Best of 3/5/7

  // Game state
  const [board, setBoard] = useState(emptyBoard);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [status, setStatus] = useState('playing');
  const [winCells, setWinCells] = useState([]);
  const [moveCount, setMoveCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TURN_TIME);
  const [history, setHistory] = useState([]); // [{board, currentTurn, moveCount}]
  const [undoUsed, setUndoUsed] = useState([false, false]); // per player

  // Score tracking (per series)
  const [score, setScore] = useState([0, 0]); // [p1Wins, p2Wins]
  const [gameNumber, setGameNumber] = useState(1);
  const [seriesOver, setSeriesOver] = useState(false);
  const [seriesWinner, setSeriesWinner] = useState(null);

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  useEffect(() => {
    if (status !== 'playing' || seriesOver) return;
    setTimeLeft(TURN_TIME);
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id);
          setStatus(currentTurn === 0 ? 'p1_timeout' : 'p2_timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [currentTurn, status, seriesOver]);

  const handleCellClick = (row, col) => {
    if (status !== 'playing' || seriesOver) return;
    if (board[row][col] !== null) return;

    const symbol = currentTurn === 0 ? 'X' : 'O';
    const nb = board.map(r => [...r]);
    nb[row][col] = symbol;

    // Save history before move
    setHistory(h => [...h, { board: board.map(r => [...r]), currentTurn, moveCount, undoUsed: [...undoUsed] }]);

    setBoard(nb);
    setMoveCount(c => c + 1);

    const wc = getWinningCells(nb, row, col, symbol);
    if (wc) {
      setWinCells(wc);
      const winner = currentTurn === 0 ? 'p1_win' : 'p2_win';
      setStatus(winner);
      // Update score
      const newScore = [...score];
      newScore[currentTurn]++;
      setScore(newScore);
      const winsNeeded = Math.ceil(bestOf / 2);
      if (newScore[currentTurn] >= winsNeeded) {
        setSeriesOver(true);
        setSeriesWinner(currentTurn);
      }
    } else {
      setCurrentTurn(t => 1 - t);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    if (undoUsed[currentTurn]) return; // Already used undo this round

    const prev = history[history.length - 1];
    setBoard(prev.board);
    setCurrentTurn(prev.currentTurn);
    setMoveCount(prev.moveCount);
    setHistory(h => h.slice(0, -1));
    setUndoUsed(u => { const n = [...u]; n[prev.currentTurn] = true; return n; });
    setStatus('playing');
    setWinCells([]);
  };

  const resetGame = () => {
    setBoard(emptyBoard());
    setCurrentTurn(0);
    setStatus('playing');
    setWinCells([]);
    setMoveCount(0);
    setTimeLeft(TURN_TIME);
    setHistory([]);
    setUndoUsed([false, false]);
    setGameNumber(g => g + 1);
  };

  const resetSeries = () => {
    resetGame();
    setScore([0, 0]);
    setGameNumber(1);
    setSeriesOver(false);
    setSeriesWinner(null);
  };

  if (!user) return null;

  if (!setupDone) {
    return (
      <div className="container fade-in" style={{ padding: '40px 16px', maxWidth: '500px', margin: '0 auto' }}>
        <h2 className="section-title">👥 2 Người Offline</h2>
        <div style={{ background: 'var(--steam-card-bg)', border: '1px solid var(--steam-border)', borderRadius: '8px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)', marginBottom: '6px', textTransform: 'uppercase' }}>Người chơi 1 (X) – Đã đăng nhập</div>
            <div style={{ padding: '10px 14px', background: 'var(--steam-darker-bg)', borderRadius: '4px', border: '1px solid var(--steam-border)', color: 'var(--steam-blue)', fontWeight: 'bold' }}>
              {user.username}
              <span style={{ color: 'var(--steam-text-dim)', fontWeight: 'normal', fontSize: '12px', marginLeft: '8px' }}>Elo: {user.elo}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)', marginBottom: '6px', textTransform: 'uppercase' }}>Người chơi 2 (O)</div>
            <input type="text" value={p2Name} onChange={e => setP2Name(e.target.value)}
              placeholder="Nhập tên người chơi 2" maxLength={20}
              style={{ width: '100%', padding: '10px 14px', background: 'var(--steam-darker-bg)', border: '1px solid var(--steam-border)', color: 'var(--steam-highlight)', borderRadius: '4px', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'var(--steam-blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--steam-border)'}
            />
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>Chế độ đấu</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 3, 5, 7].map(n => (
                <button key={n} onClick={() => setBestOf(n)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
                    background: bestOf === n ? 'var(--steam-blue)' : 'var(--steam-darker-bg)',
                    border: `1px solid ${bestOf === n ? 'var(--steam-blue)' : 'var(--steam-border)'}`,
                    color: bestOf === n ? 'white' : 'var(--steam-text-dim)',
                    transition: 'all 0.2s'
                  }}>
                  {n === 1 ? '1 Ván' : `BO${n}`}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)', marginTop: '6px' }}>
              {bestOf === 1 ? '1 ván duy nhất' : `Thắng ${Math.ceil(bestOf / 2)} ván trước để chiến thắng series`}
            </div>
          </div>

          <div style={{ background: 'rgba(100,149,237,0.08)', border: '1px solid rgba(100,149,237,0.2)', borderRadius: '4px', padding: '10px 14px', fontSize: '12px', color: 'var(--steam-text-dim)' }}>
            ℹ️ Mỗi ván <b style={{ color: 'var(--steam-highlight)' }}>không tính Elo</b>. Mỗi lượt <b style={{ color: 'var(--steam-highlight)' }}>{TURN_TIME}s</b>. Mỗi người được <b style={{ color: 'var(--steam-orange)' }}>1 lần undo</b>/ván.
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setSetupDone(true)} className="btn btn-primary" style={{ flex: 1 }}>🎮 Bắt đầu</button>
            <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>← Quay lại</Link>
          </div>
        </div>
      </div>
    );
  }

  const over = status !== 'playing';
  const p1Display = user.username;
  const p2Display = p2Name || 'Player 2';
  const curName = currentTurn === 0 ? p1Display : p2Display;
  const curColor = currentTurn === 0 ? 'var(--steam-blue)' : 'var(--steam-orange)';
  const timerColor = timeLeft > 20 ? 'var(--steam-green-bright)' : timeLeft > 10 ? '#f4b942' : '#e84c3d';
  const isTimeout = status === 'p1_timeout' || status === 'p2_timeout';
  const winnerName = ['p1_win', 'p2_timeout'].includes(status) ? p1Display : p2Display;
  const winsNeeded = Math.ceil(bestOf / 2);
  const canUndo = history.length > 0 && !undoUsed[currentTurn] && !over;

  return (
    <div className="container fade-in" style={{ padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', background: 'var(--steam-card-bg)', padding: '10px 20px', borderRadius: '6px', border: '1px solid var(--steam-border)' }}>
        <Link to="/" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>← Quay lại</Link>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--steam-highlight)', fontWeight: 'bold', fontSize: '16px' }}>👥 2 Người Offline</div>
          {bestOf > 1 && (
            <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)' }}>
              Best of {bestOf} – Ván {gameNumber} — Thắng {winsNeeded} ván
            </div>
          )}
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* Score bar */}
      {bestOf > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px',
          background: 'var(--steam-card-bg)', padding: '12px 24px', borderRadius: '6px',
          border: '1px solid var(--steam-border)', marginBottom: '12px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--steam-blue)' }}>{score[0]}</div>
            <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)' }}>{p1Display}</div>
          </div>
          <div style={{ fontSize: '14px', color: 'var(--steam-text-dim)', fontWeight: 'bold' }}>—</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--steam-orange)' }}>{score[1]}</div>
            <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)' }}>{p2Display}</div>
          </div>
        </div>
      )}

      {/* Series over overlay */}
      {seriesOver && (
        <div style={{
          background: 'rgba(0,0,0,0.85)', borderRadius: '8px', border: '2px solid var(--steam-green)',
          padding: '28px', textAlign: 'center', marginBottom: '12px',
          animation: 'fadeIn 0.4s ease'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏆</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--steam-green-bright)', marginBottom: '8px' }}>
            {seriesWinner === 0 ? p1Display : p2Display} thắng series!
          </div>
          <div style={{ fontSize: '14px', color: 'var(--steam-text-dim)', marginBottom: '20px' }}>
            Tỉ số: <span style={{ color: 'var(--steam-blue)' }}>{score[0]}</span> – <span style={{ color: 'var(--steam-orange)' }}>{score[1]}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={resetSeries} className="btn btn-primary" style={{ padding: '10px 24px' }}>🔄 Series mới</button>
            <Link to="/" className="btn btn-secondary" style={{ padding: '10px 24px' }}>← Trang chủ</Link>
          </div>
        </div>
      )}

      {/* VS bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '16px', marginBottom: '12px', background: 'var(--steam-card-bg)', padding: '10px 20px', borderRadius: '6px', border: '1px solid var(--steam-border)' }}>
        <div style={{ opacity: (currentTurn === 0 && !over) || ['p1_win', 'p2_timeout'].includes(status) ? 1 : 0.4, transition: 'opacity 0.3s' }}>
          <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)' }}>Người 1 (X)</div>
          <div style={{ color: 'var(--steam-blue)', fontWeight: 'bold', fontSize: '16px' }}>{p1Display}</div>
          <div style={{ fontSize: '11px', color: '#c6a614' }}>{'⭐'.repeat(score[0])}</div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', color: '#c6a614' }}>VS</div>
        <div style={{ textAlign: 'right', opacity: (currentTurn === 1 && !over) || ['p2_win', 'p1_timeout'].includes(status) ? 1 : 0.4, transition: 'opacity 0.3s' }}>
          <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)' }}>Người 2 (O)</div>
          <div style={{ color: 'var(--steam-orange)', fontWeight: 'bold', fontSize: '16px' }}>{p2Display}</div>
          <div style={{ fontSize: '11px', color: '#c6a614' }}>{'⭐'.repeat(score[1])}</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px', width: '100%', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
              {over
                ? <span style={{ color: 'var(--steam-green-bright)' }}>{isTimeout ? '⏰' : '🏆'} {winnerName} thắng{isTimeout ? ' (hết giờ)' : ''}!</span>
                : <span style={{ color: curColor }}>Lượt: {curName} ({currentTurn === 0 ? 'X' : 'O'})</span>
              }
            </div>
            {!over && <TimerRing timeLeft={timeLeft} color={timerColor} />}
          </div>
          <Board board={board} onCellClick={handleCellClick} disabled={over || seriesOver} winCells={winCells} />
        </div>

        {/* Side */}
        <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
          <div style={{ background: 'var(--steam-card-bg)', borderRadius: '6px', border: '1px solid var(--steam-border)', padding: '14px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: 'var(--steam-highlight)', fontSize: '12px', borderBottom: '1px solid var(--steam-border)', paddingBottom: '7px' }}>Thông Tin Ván</div>
            <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                ['Chế độ', bestOf === 1 ? '1 Ván' : `Best of ${bestOf}`],
                ['Số nước đi', <b style={{ color: 'var(--steam-highlight)' }}>{moveCount}</b>],
                ['Undo P1', undoUsed[0] ? <span style={{ color: '#e84c3d' }}>Đã dùng</span> : <span style={{ color: 'var(--steam-green-bright)' }}>Còn</span>],
                ['Undo P2', undoUsed[1] ? <span style={{ color: '#e84c3d' }}>Đã dùng</span> : <span style={{ color: 'var(--steam-green-bright)' }}>Còn</span>],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--steam-text-dim)' }}>{k}</span><span>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {canUndo && (
            <button onClick={handleUndo} className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', color: '#f4b942', borderColor: 'rgba(244,185,66,0.4)' }}>
              ↩ Hoàn tác
            </button>
          )}

          {!over && !seriesOver && (
            <button onClick={resetGame} className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', color: '#e87c23', borderColor: 'rgba(232,124,35,0.4)' }}>
              🔄 Ván mới
            </button>
          )}

          {over && !seriesOver && (
            <div style={{ background: 'rgba(70,197,67,0.1)', borderRadius: '6px', border: '1px solid var(--steam-green)', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '26px', marginBottom: '4px' }}>{isTimeout ? '⏰' : '🏆'}</div>
              <div style={{ fontWeight: 'bold', color: 'var(--steam-green-bright)', marginBottom: '4px', fontSize: '13px' }}>
                {winnerName} thắng!
              </div>
              {isTimeout && <div style={{ fontSize: '11px', color: '#f4b942', marginBottom: '4px' }}>Đối thủ hết giờ!</div>}
              {bestOf > 1 && <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)', marginBottom: '10px' }}>Tỉ số: {score[0]}–{score[1]}</div>}
              <button onClick={resetGame} className="btn btn-primary" style={{ width: '100%', marginBottom: '6px', fontSize: '12px' }}>
                ▶ Ván tiếp
              </button>
              <button onClick={resetSeries} className="btn btn-secondary" style={{ width: '100%', fontSize: '12px' }}>🔄 Series mới</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayLocal;
