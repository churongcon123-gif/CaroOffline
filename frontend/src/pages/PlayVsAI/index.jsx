import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../states/authStore';
import Board from '../../components/Board';
import { getWinningCells } from '../../utils/checkWinner';
import { getBestMove } from '../../utils/aiEngine';
import { calculateElo, getAIDifficulty } from '../../utils/eloCalculator';
import { updateEloApi } from '../../api/gameApi';

const SIZE = 15;
const TURN_TIME = 30; // giây mỗi lượt
const emptyBoard = () => Array(SIZE).fill(null).map(() => Array(SIZE).fill(null));

/* ── Mini components ── */

/** Đồng hồ đếm ngược hình vòng tròn */
const TimerRing = ({ timeLeft, total = TURN_TIME, color }) => {
  const r = 26, stroke = 4;
  const circ = 2 * Math.PI * r;
  const pct = timeLeft / total;
  return (
    <svg width={64} height={64} style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle cx={32} cy={32} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      {/* Progress */}
      <circle
        cx={32} cy={32} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s' }}
      />
      {/* Text — rotate back to read normally */}
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

const PlayVsAI = () => {
  const { user, token, updateUserElo } = useAuthStore();
  const navigate = useNavigate();

  const [board, setBoard] = useState(emptyBoard);
  const [turn, setTurn] = useState('player');
  const [status, setStatus] = useState('playing'); // 'playing'|'player_win'|'ai_win'|'timeout'
  const [winCells, setWinCells] = useState([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [eloChange, setEloChange] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [moveCount, setMoveCount] = useState(0);   // ← số nước đi
  const [timeLeft, setTimeLeft] = useState(TURN_TIME); // ← đồng hồ lượt

  const eloAtStartRef = useRef(user?.elo || 1200);
  // Guard: ngăn saveElo bị gọi 2 lần (StrictMode / race condition)
  const eloSavedRef = useRef(false);

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  const difficulty = getAIDifficulty(user?.elo || 1200);

  /* ── Lưu Elo (chỉ gọi 1 lần mỗi ván nhờ eloSavedRef) ── */
  const saveElo = useCallback(async (won) => {
    if (!user || !token) return;
    if (eloSavedRef.current) return;  // ← chặn double-call
    eloSavedRef.current = true;
    setIsSaving(true);
    try {
      const eloStart = eloAtStartRef.current;
      const newElo = calculateElo(eloStart, difficulty.aiElo, won ? 1 : 0);
      const delta = newElo - eloStart;
      const res = await updateEloApi(token, newElo, won);
      updateUserElo(res.user);
      setEloChange(delta);
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  }, [user, token, difficulty.aiElo, updateUserElo]);

  /* ── Đồng hồ: chạy khi đến lượt người chơi ── */
  useEffect(() => {
    if (status !== 'playing' || turn !== 'player') return;
    setTimeLeft(TURN_TIME);
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id);
          return 0; // chỉ cập nhật state ở đây
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [turn, status]);

  /* ── Xử lý timeout tách riêng để tránh gọi saveElo trong setState ── */
  useEffect(() => {
    if (timeLeft !== 0 || status !== 'playing' || turn !== 'player') return;
    setStatus('timeout');
    saveElo(false);
  }, [timeLeft, status, turn, saveElo]);

  /* ── Lượt AI ── */
  useEffect(() => {
    if (status !== 'playing' || turn !== 'ai') return;
    setIsAIThinking(true);
    const t = setTimeout(() => {
      setBoard(prev => {
        const { row, col } = getBestMove(prev, 'O', eloAtStartRef.current);
        const nb = prev.map(r => [...r]);
        nb[row][col] = 'O';
        setMoveCount(c => c + 1);
        const wc = getWinningCells(nb, row, col, 'O');
        if (wc) { setWinCells(wc); setStatus('ai_win'); saveElo(false); }
        else setTurn('player');
        setIsAIThinking(false);
        return nb;
      });
    }, 400 + Math.random() * 300);
    return () => clearTimeout(t);
  }, [turn, status, saveElo]);

  /* ── Click ô ── */
  const handleCellClick = (row, col) => {
    if (status !== 'playing' || turn !== 'player' || isAIThinking) return;
    if (board[row][col] !== null) return;
    const nb = board.map(r => [...r]);
    nb[row][col] = 'X';
    setBoard(nb);
    setMoveCount(c => c + 1);
    const wc = getWinningCells(nb, row, col, 'X');
    if (wc) { setWinCells(wc); setStatus('player_win'); saveElo(true); }
    else setTurn('ai');
  };

  /* ── Reset ── */
  const reset = () => {
    eloAtStartRef.current = user?.elo || 1200;
    eloSavedRef.current = false; // ← reset guard cho ván mới
    setBoard(emptyBoard());
    setTurn('player');
    setStatus('playing');
    setWinCells([]);
    setEloChange(null);
    setMoveCount(0);
    setTimeLeft(TURN_TIME);
  };

  if (!user) return null;

  const over = status !== 'playing';
  const displayElo = over ? user.elo : eloAtStartRef.current;
  const timerColor = timeLeft > 30 ? 'var(--steam-green-bright)' : timeLeft > 10 ? '#f4b942' : '#e84c3d';

  const statusMsg = over
    ? status === 'player_win' ? { icon: '🏆', text: 'Bạn thắng!', color: 'var(--steam-green-bright)' }
      : status === 'timeout' ? { icon: '⏰', text: 'Hết giờ! AI thắng.', color: '#e84c3d' }
        : { icon: '💀', text: 'AI thắng!', color: '#e84c3d' }
    : isAIThinking
      ? { icon: '🤖', text: 'AI đang suy nghĩ...', color: 'var(--steam-text-dim)' }
      : { icon: '✨', text: 'Lượt của bạn!', color: 'var(--steam-green-bright)' };

  return (
    <div className="container fade-in" style={{ padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'var(--steam-card-bg)', padding: '12px 20px', borderRadius: '4px', border: '1px solid var(--steam-border)' }}>
        <Link to="/" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>← Quay lại</Link>
        <h2 style={{ margin: 0, color: 'var(--steam-highlight)', fontSize: '18px' }}>⚔️ Đánh Với Máy</h2>
        <div style={{ fontSize: '13px' }}>Độ khó: <span style={{ color: difficulty.color, fontWeight: 'bold' }}>{difficulty.level}</span></div>
      </div>

      {/* VS bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '16px', marginBottom: '16px', background: 'var(--steam-card-bg)', padding: '12px 24px', borderRadius: '4px', border: '1px solid var(--steam-border)' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)' }}>Bạn (X)</div>
          <div style={{ color: 'var(--steam-blue)', fontWeight: 'bold', fontSize: '17px' }}>{user.username}</div>
          <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)' }}>Elo: <b style={{ color: 'var(--steam-highlight)' }}>{displayElo}</b></div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold', color: '#c6a614' }}>VS</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)' }}>AI (O)</div>
          <div style={{ color: 'var(--steam-orange)', fontWeight: 'bold', fontSize: '17px' }}>CaroBot</div>
          <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)' }}>Elo: <b style={{ color: difficulty.color }}>{difficulty.aiElo}</b></div>
        </div>
      </div>

      {/* Main */}
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Board area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Status + timer bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px', width: '100%', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: statusMsg.color }}>
              {statusMsg.icon} {statusMsg.text}
            </div>
            {!over && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--steam-text-dim)' }}>
                  {turn === 'player' ? 'Thời gian lượt' : 'AI đang nghĩ'}
                </span>
                {turn === 'player'
                  ? <TimerRing timeLeft={timeLeft} color={timerColor} />
                  : <div style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--steam-text-dim)', fontSize: '22px' }}>⏳</div>
                }
              </div>
            )}
          </div>

          <Board board={board} onCellClick={handleCellClick}
            disabled={over || turn !== 'player' || isAIThinking} winCells={winCells} />
        </div>

        {/* Side panel */}
        <div style={{ width: '210px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Thông tin trận */}
          <div style={{ background: 'var(--steam-card-bg)', borderRadius: '4px', border: '1px solid var(--steam-border)', padding: '16px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: 'var(--steam-highlight)', fontSize: '13px', borderBottom: '1px solid var(--steam-border)', paddingBottom: '8px' }}>Thông Tin Trận</div>
            <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {[
                ['Chế độ', 'Vs AI'],
                ['Độ khó', <span style={{ color: difficulty.color }}>{difficulty.label}</span>],
                ['AI Elo', difficulty.aiElo],
                ['Elo bạn', <b style={{ color: 'var(--steam-blue)' }}>{displayElo}</b>],
                ['Số nước đi', <b style={{ color: 'var(--steam-highlight)' }}>{moveCount}</b>],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--steam-text-dim)' }}>{k}</span><span>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nút Reset trong lúc chơi */}
          {!over && (
            <button
              onClick={reset}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', color: '#e87c23', borderColor: 'rgba(232,124,35,0.4)' }}
            >
              🔄 Ván mới
            </button>
          )}

          {/* Kết quả */}
          {over && (
            <div style={{
              background: status === 'player_win' ? 'rgba(70,197,67,0.1)' : 'rgba(232,76,61,0.1)',
              borderRadius: '4px',
              border: `1px solid ${status === 'player_win' ? 'var(--steam-green)' : '#e84c3d'}`,
              padding: '16px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>
                {status === 'player_win' ? '🏆' : status === 'timeout' ? '⏰' : '💀'}
              </div>
              <div style={{ fontWeight: 'bold', color: status === 'player_win' ? 'var(--steam-green-bright)' : '#e84c3d', marginBottom: '6px' }}>
                {status === 'player_win' ? 'Chiến thắng!' : status === 'timeout' ? 'Hết giờ!' : 'Thất bại!'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)', marginBottom: '10px' }}>
                Tổng nước đi: <b style={{ color: 'var(--steam-highlight)' }}>{moveCount}</b>
              </div>
              {isSaving && <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)', marginBottom: '8px' }}>Đang lưu Elo...</div>}
              {eloChange !== null && (
                <div style={{ fontSize: '13px', marginBottom: '10px' }}>
                  Elo: <span style={{ fontWeight: 'bold', color: eloChange >= 0 ? 'var(--steam-green-bright)' : '#e84c3d' }}>
                    {eloChange >= 0 ? `+${eloChange}` : eloChange}
                  </span>
                  {' → '}<span style={{ color: 'var(--steam-highlight)' }}>{user.elo}</span>
                </div>
              )}
              <button onClick={reset} className="btn btn-primary" style={{ width: '100%', marginBottom: '8px' }}>🔄 Chơi lại</button>
              <Link to="/" className="btn btn-secondary" style={{ display: 'block', textAlign: 'center', boxSizing: 'border-box' }}>Về Trang Chủ</Link>
            </div>
          )}

          {!over && (
            <div style={{ background: 'var(--steam-card-bg)', borderRadius: '4px', border: '1px solid var(--steam-border)', padding: '12px', fontSize: '12px', color: 'var(--steam-text-dim)' }}>
              <b style={{ color: 'var(--steam-highlight)' }}>💡 Gợi ý</b><br /><br />
              Bạn là X, AI là O. Nối 5 quân để thắng.<br />
              Mỗi lượt có <b style={{ color: 'var(--steam-highlight)' }}>{TURN_TIME}s</b>. Hết giờ = thua!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayVsAI;
