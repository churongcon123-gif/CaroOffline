import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../states/authStore';
import Board from '../../components/Board';
import { getWinningCells } from '../../utils/checkWinner';

const SIZE = 15;
const TURN_TIME = 30; // giây mỗi lượt
const emptyBoard = () => Array(SIZE).fill(null).map(() => Array(SIZE).fill(null));

/** Đồng hồ đếm ngược hình vòng tròn */
const TimerRing = ({ timeLeft, total = TURN_TIME, color }) => {
  const r = 26, stroke = 4;
  const circ = 2 * Math.PI * r;
  const pct = timeLeft / total;
  return (
    <svg width={64} height={64} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={32} cy={32} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <circle
        cx={32} cy={32} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s' }}
      />
      <text
        x={32} y={32}
        textAnchor="middle" dominantBaseline="central"
        style={{ transform: 'rotate(90deg)', transformOrigin: '32px 32px', fill: color, fontSize: '15px', fontWeight: 700, fontFamily: 'Inter,sans-serif' }}
      >
        {timeLeft}
      </text>
    </svg>
  );
};

/**
 * Chế độ 2 người chơi offline — KHÔNG tính Elo.
 * Có đồng hồ đếm ngược, đếm số nước, và nút reset bất cứ lúc nào.
 */
const PlayLocal = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [setupDone, setSetupDone]     = useState(false);
  const [p2Name, setP2Name]           = useState('Player 2');

  const [board, setBoard]             = useState(emptyBoard);
  const [currentTurn, setCurrentTurn] = useState(0); // 0=P1(X), 1=P2(O)
  const [status, setStatus]           = useState('playing'); // 'playing'|'p1_win'|'p2_win'|'p1_timeout'|'p2_timeout'
  const [winCells, setWinCells]       = useState([]);
  const [moveCount, setMoveCount]     = useState(0);
  const [timeLeft, setTimeLeft]       = useState(TURN_TIME);

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  /* ── Đồng hồ: reset + chạy mỗi khi đổi lượt ── */
  useEffect(() => {
    if (status !== 'playing') return;
    setTimeLeft(TURN_TIME);
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id);
          // Hết giờ → người kia thắng
          setStatus(currentTurn === 0 ? 'p1_timeout' : 'p2_timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [currentTurn, status]); // re-run khi đổi lượt

  const handleCellClick = (row, col) => {
    if (status !== 'playing') return;
    if (board[row][col] !== null) return;

    const symbol = currentTurn === 0 ? 'X' : 'O';
    const nb = board.map(r => [...r]);
    nb[row][col] = symbol;
    setBoard(nb);
    setMoveCount(c => c + 1);

    const wc = getWinningCells(nb, row, col, symbol);
    if (wc) {
      setWinCells(wc);
      setStatus(currentTurn === 0 ? 'p1_win' : 'p2_win');
    } else {
      setCurrentTurn(t => 1 - t);
    }
  };

  const reset = () => {
    setBoard(emptyBoard());
    setCurrentTurn(0);
    setStatus('playing');
    setWinCells([]);
    setMoveCount(0);
    setTimeLeft(TURN_TIME);
  };

  if (!user) return null;

  /* ── Setup screen ── */
  if (!setupDone) {
    return (
      <div className="container fade-in" style={{ padding: '40px 16px', maxWidth: '480px', margin: '0 auto' }}>
        <h2 className="section-title">👥 2 Người Offline</h2>
        <div style={{ background: 'var(--steam-card-bg)', border: '1px solid var(--steam-border)', borderRadius: '4px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)', marginBottom: '6px' }}>Người chơi 1 (X) – Đã đăng nhập</div>
            <div style={{ padding: '10px 14px', background: 'var(--steam-darker-bg)', borderRadius: '3px', border: '1px solid var(--steam-border)', color: 'var(--steam-blue)', fontWeight: 'bold' }}>
              {user.username}
              <span style={{ color: 'var(--steam-text-dim)', fontWeight: 'normal', fontSize: '12px', marginLeft: '8px' }}>Elo: {user.elo}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)', marginBottom: '6px' }}>Người chơi 2 (O) – Tên</div>
            <input
              type="text"
              value={p2Name}
              onChange={e => setP2Name(e.target.value)}
              placeholder="Nhập tên người chơi 2"
              style={{ width: '100%', padding: '10px 14px', background: 'var(--steam-darker-bg)', border: '1px solid var(--steam-border)', color: 'var(--steam-highlight)', borderRadius: '3px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ background: 'rgba(100,149,237,0.08)', border: '1px solid rgba(100,149,237,0.25)', borderRadius: '3px', padding: '10px 14px', fontSize: '12px', color: 'var(--steam-text-dim)' }}>
            ℹ️ Chế độ này <b style={{ color: 'var(--steam-highlight)' }}>không tính Elo</b>. Mỗi lượt có <b style={{ color:'var(--steam-highlight)' }}>{TURN_TIME}s</b> để đánh.
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setSetupDone(true)} className="btn btn-primary" style={{ flex: 1 }}>🎮 Bắt đầu</button>
            <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>← Quay lại</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Game screen ── */
  const over       = status !== 'playing';
  const p1Display  = user.username;
  const p2Display  = p2Name || 'Player 2';
  const curName    = currentTurn === 0 ? p1Display : p2Display;
  const curColor   = currentTurn === 0 ? 'var(--steam-blue)' : 'var(--steam-orange)';
  const timerColor = timeLeft > 30 ? 'var(--steam-green-bright)' : timeLeft > 10 ? '#f4b942' : '#e84c3d';

  // Ai thắng?
  const winnerName = status === 'p1_win' || status === 'p2_timeout' ? p1Display : p2Display;
  const isTimeout  = status === 'p1_timeout' || status === 'p2_timeout';

  return (
    <div className="container fade-in" style={{ padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'var(--steam-card-bg)', padding: '12px 20px', borderRadius: '4px', border: '1px solid var(--steam-border)' }}>
        <Link to="/" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>← Quay lại</Link>
        <h2 style={{ margin: 0, color: 'var(--steam-highlight)', fontSize: '18px' }}>👥 2 Người Offline</h2>
        <div style={{ width: 80 }} />
      </div>

      {/* VS bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '16px', marginBottom: '16px', background: 'var(--steam-card-bg)', padding: '12px 24px', borderRadius: '4px', border: '1px solid var(--steam-border)' }}>
        <div style={{ opacity: (currentTurn === 0 && !over) || ['p1_win','p2_timeout'].includes(status) ? 1 : 0.45, transition: 'opacity 0.3s' }}>
          <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)' }}>Người 1 (X)</div>
          <div style={{ color: 'var(--steam-blue)', fontWeight: 'bold', fontSize: '17px' }}>{p1Display}</div>
          <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)' }}>Elo: <b style={{ color: 'var(--steam-highlight)' }}>{user.elo}</b></div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold', color: '#c6a614' }}>VS</div>
        <div style={{ textAlign: 'right', opacity: (currentTurn === 1 && !over) || ['p2_win','p1_timeout'].includes(status) ? 1 : 0.45, transition: 'opacity 0.3s' }}>
          <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)' }}>Người 2 (O)</div>
          <div style={{ color: 'var(--steam-orange)', fontWeight: 'bold', fontSize: '17px' }}>{p2Display}</div>
          <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)' }}>Chơi cho vui 🎮</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Status + timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px', width: '100%', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '15px', fontWeight: 'bold' }}>
              {over
                ? <span style={{ color: 'var(--steam-green-bright)' }}>
                    {isTimeout ? '⏰' : '🏆'} {winnerName} thắng{isTimeout ? ' (hết giờ)' : ''}!
                  </span>
                : <span style={{ color: curColor }}>
                    Lượt: {curName} ({currentTurn === 0 ? 'X' : 'O'})
                  </span>
              }
            </div>
            {!over && <TimerRing timeLeft={timeLeft} color={timerColor} />}
          </div>

          <Board board={board} onCellClick={handleCellClick} disabled={over} winCells={winCells} />
        </div>

        {/* Side */}
        <div style={{ width: '210px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'var(--steam-card-bg)', borderRadius: '4px', border: '1px solid var(--steam-border)', padding: '16px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: 'var(--steam-highlight)', fontSize: '13px', borderBottom: '1px solid var(--steam-border)', paddingBottom: '8px' }}>Thông Tin</div>
            <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {[
                ['Chế độ', '2 Người Offline'],
                ['Lượt hiện tại', over ? '—' : <span style={{ color: curColor }}>{currentTurn === 0 ? 'X' : 'O'}</span>],
                ['Số nước đi', <b style={{ color: 'var(--steam-highlight)' }}>{moveCount}</b>],
                ['Điểm Elo', <span style={{ color: '#f4b942' }}>Không tính</span>],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--steam-text-dim)' }}>{k}</span><span>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reset trong lúc chơi */}
          {!over && (
            <button
              onClick={reset}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', color: '#e87c23', borderColor: 'rgba(232,124,35,0.4)' }}
            >
              🔄 Ván mới
            </button>
          )}

          {over && (
            <div style={{ background: 'rgba(70,197,67,0.1)', borderRadius: '4px', border: '1px solid var(--steam-green)', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>{isTimeout ? '⏰' : '🏆'}</div>
              <div style={{ fontWeight: 'bold', color: 'var(--steam-green-bright)', marginBottom: '6px' }}>
                {winnerName} thắng!
              </div>
              {isTimeout && (
                <div style={{ fontSize: '12px', color: '#f4b942', marginBottom: '6px' }}>Đối thủ hết giờ!</div>
              )}
              <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)', marginBottom: '14px' }}>
                Tổng nước đi: <b style={{ color: 'var(--steam-highlight)' }}>{moveCount}</b>
              </div>
              <button onClick={reset} className="btn btn-primary" style={{ width: '100%', marginBottom: '8px' }}>🔄 Chơi lại</button>
              <Link to="/" className="btn btn-secondary" style={{ display: 'block', textAlign: 'center', boxSizing: 'border-box' }}>Về Trang Chủ</Link>
            </div>
          )}

          {!over && (
            <div style={{ background: 'var(--steam-card-bg)', borderRadius: '4px', border: '1px solid var(--steam-border)', padding: '12px', fontSize: '12px', color: 'var(--steam-text-dim)' }}>
              <b style={{ color: 'var(--steam-highlight)' }}>💡 Gợi ý</b><br /><br />
              Người 1 là X, Người 2 là O.<br />
              Nối 5 quân liên tiếp để thắng.<br />
              Mỗi lượt có <b style={{ color: 'var(--steam-highlight)' }}>{TURN_TIME}s</b>. Hết giờ = thua!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayLocal;
