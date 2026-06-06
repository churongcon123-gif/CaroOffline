import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { socket } from '../../sockets/socket';
import useAuthStore from '../../states/authStore';
import useToastStore from '../../states/toastStore';
import Board from '../../components/Board';
import { getWinningCells } from '../../utils/checkWinner';

const TURN_TIME = 30; // giây mỗi lượt

// ── SVG Timer Ring (tái dùng từ PlayVsAI) ───────────────────────
const TimerRing = ({ timeLeft, total = TURN_TIME, color }) => {
  const r = 22, stroke = 3;
  const circ = 2 * Math.PI * r;
  const pct = timeLeft / total;
  return (
    <svg width={52} height={52} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={26} cy={26} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s' }} />
      <text x={26} y={26} textAnchor="middle" dominantBaseline="central"
        style={{ transform: 'rotate(90deg)', transformOrigin: '26px 26px', fill: color, fontSize: '13px', fontWeight: 700, fontFamily: 'Inter,sans-serif' }}>
        {timeLeft}
      </text>
    </svg>
  );
};

// ── Confetti effect on win ──────────────────────────────────────
const Confetti = () => {
  const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
  const confettiPieces = Array.from({ length: 80 }).map((_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 4;
    const duration = 2 + Math.random() * 3;
    const size = 6 + Math.random() * 8;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const rotate = Math.random() * 360;
    
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          top: '-20px',
          left: `${left}%`,
          width: `${size}px`,
          height: `${size * 0.7}px`,
          backgroundColor: color,
          opacity: 0.8,
          borderRadius: '50%',
          transform: `rotate(${rotate}deg)`,
          animation: `fall ${duration}s linear infinite`,
          animationDelay: `${delay}s`,
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      />
    );
  });

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {confettiPieces}
    </div>
  );
};

const GameRoom = () => {
  const { id } = useParams();
  const { user, updateUserElo } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(TURN_TIME);
  const [rematchRequest, setRematchRequest] = useState(null); // usernames đã request
  const [myRematchSent, setMyRematchSent] = useState(false);
  const chatEndRef = useRef(null);
  const timerIdRef = useRef(null);
  const eloUpdatedRef = useRef(false); // chống update elo 2 lần

  // ── Socket setup ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!socket.connected) socket.connect();

    socket.emit('join_room', { roomId: id, user });

    socket.on('room_state_update', (roomState) => {
      setRoom(roomState);

      // Cập nhật Elo store nếu game finished và chưa update
      if (roomState.status === 'finished' && !eloUpdatedRef.current) {
        const myEloChange = roomState.eloChanges?.[user.username];
        if (myEloChange !== undefined) {
          eloUpdatedRef.current = true;
          updateUserElo({
            ...user,
            elo: (user.elo || 1200) + myEloChange,
          });
        }
      }
    });

    socket.on('receive_message', (msg) => {
      setRoom(prev => {
        if (!prev) return prev;
        return { ...prev, messages: [...(prev.messages || []), msg] };
      });
    });

    socket.on('rematch_update', ({ rematchRequests }) => {
      setRematchRequest(rematchRequests);
    });

    socket.on('join_room_error', (msg) => {
      addToast(msg, 'error');
      navigate('/lobby');
    });

    return () => {
      socket.off('room_state_update');
      socket.off('receive_message');
      socket.off('rematch_update');
      socket.off('join_room_error');
    };
  }, [user, navigate, id, updateUserElo]);

  // ── Scroll chat ───────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.messages]);

  // ── Turn timer ────────────────────────────────────────────────
  useEffect(() => {
    if (!room || room.status !== 'playing') return;
    const isMyTurn = room.turn === user?.username;
    if (!isMyTurn) { setTimeLeft(TURN_TIME); return; }

    setTimeLeft(TURN_TIME);
    timerIdRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerIdRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerIdRef.current);
  }, [room?.turn, room?.status, user?.username]);

  // ── Timeout handler ───────────────────────────────────────────
  useEffect(() => {
    if (timeLeft !== 0 || !room || room.status !== 'playing') return;
    if (room.turn !== user?.username) return;
    socket.emit('player_timeout', { roomId: id, username: user.username });
  }, [timeLeft, room?.status, room?.turn, user?.username, id]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleLeaveRoom = () => {
    socket.emit('leave_room', { roomId: id, user });
    navigate('/lobby');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    socket.emit('send_message', { roomId: id, user, text: chatMessage });
    setChatMessage('');
  };

  const handleCellClick = (row, col) => {
    if (!room || room.status !== 'playing' || room.turn !== user.username) return;
    if (room.board[row][col] !== null) return;
    socket.emit('make_move', { roomId: id, row, col, user });
  };

  const handleRematch = () => {
    setMyRematchSent(true);
    socket.emit('rematch_request', { roomId: id, username: user.username });
  };

  if (!room) {
    return (
      <div className="container" style={{ padding: '40px', textAlign: 'center', color: 'var(--steam-text-dim)' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
        Đang kết nối phòng...
      </div>
    );
  }

  const isPlayerInRoom = room.players.some(p => p.username === user.username);
  const amISpectator = !isPlayerInRoom;
  const over = room.status === 'finished';
  const isMyTurn = room.turn === user?.username;
  const myEloChange = room.eloChanges?.[user.username];
  const timerColor = timeLeft > 15 ? 'var(--steam-green-bright)' : timeLeft > 7 ? '#f4b942' : '#e84c3d';

  return (
    <div className="container fade-in" style={{ padding: '20px 16px' }}>
      {over && room.winner === user.username && <Confetti />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'var(--steam-card-bg)', padding: '12px 20px', borderRadius: '4px', border: '1px solid var(--steam-border)' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--steam-highlight)', fontSize: '17px' }}>
            🌐 Phòng: <span style={{ color: 'var(--steam-blue)' }}>{id}</span>
          </h2>
          <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)', marginTop: '2px' }}>
            Trạng thái:{' '}
            <span style={{ color: room.status === 'playing' ? 'var(--steam-green-bright)' : room.status === 'finished' ? '#e84c3d' : 'var(--steam-orange)', fontWeight: 'bold' }}>
              {room.status === 'playing' ? 'ĐANG CHƠI' : room.status === 'finished' ? 'KẾT THÚC' : 'CHỜ ĐỐI THỦ'}
            </span>
            {amISpectator && <span style={{ marginLeft: '8px', color: 'var(--steam-orange)' }}>👁 Bạn đang xem</span>}
          </div>
        </div>

        {/* Players */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--steam-blue)', fontWeight: 'bold' }}>{room.players[0]?.username || '—'} <span style={{ color: 'var(--steam-text-dim)' }}>(X)</span></div>
            <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)' }}>Elo: {room.players[0]?.elo ?? '?'}</div>
          </div>
          <div style={{ color: '#c6a614', fontWeight: 'bold' }}>VS</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: 'var(--steam-orange)', fontWeight: 'bold' }}>{room.players[1]?.username || 'Chờ...'} <span style={{ color: 'var(--steam-text-dim)' }}>(O)</span></div>
            <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)' }}>Elo: {room.players[1]?.elo ?? '?'}</div>
          </div>
          <button onClick={handleLeaveRoom} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
            ← Rời phòng
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>

        {/* Left: Board */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 450px', maxWidth: '100%', alignItems: 'center' }}>

          {/* Turn / Result indicator */}
          <div style={{ marginBottom: '10px', minHeight: '38px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            {over ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: room.winner === user.username ? 'var(--steam-green-bright)' : '#e84c3d' }}>
                  {room.winner === user.username ? '🏆 Bạn thắng!' : room.winner ? `💀 ${room.winner} thắng!` : '🤝 Hòa'}
                </span>
                {myEloChange !== undefined && (
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: myEloChange >= 0 ? 'var(--steam-green-bright)' : '#e84c3d', background: myEloChange >= 0 ? 'rgba(70,197,67,0.1)' : 'rgba(232,76,61,0.1)', border: `1px solid ${myEloChange >= 0 ? 'var(--steam-green)' : '#e84c3d'}`, borderRadius: '4px', padding: '3px 10px' }}>
                    Elo {myEloChange >= 0 ? `+${myEloChange}` : myEloChange}
                  </span>
                )}
                {room.disconnectWin && <span style={{ fontSize: '12px', color: 'var(--steam-text-dim)' }}>(đối thủ bỏ cuộc)</span>}
              </div>
            ) : room.status === 'playing' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: isMyTurn ? 'var(--steam-green-bright)' : 'var(--steam-text-dim)' }}>
                  {isMyTurn ? '✨ Lượt của bạn!' : `⏳ Chờ ${room.turn}...`}
                </span>
                {isMyTurn && <TimerRing timeLeft={timeLeft} color={timerColor} />}
              </div>
            ) : (
              <span style={{ fontSize: '14px', color: 'var(--steam-text-dim)' }}>⏳ Chờ đối thủ vào phòng...</span>
            )}
          </div>

          <div style={{ maxWidth: '100%', overflowX: 'auto', width: '100%', display: 'flex', justifyContent: 'center', paddingBottom: '10px' }}>
            <Board
              board={room.board}
              onCellClick={handleCellClick}
              disabled={over || room.status !== 'playing' || !isMyTurn || amISpectator}
              winCells={room.winningCells || []}
            />
          </div>

          {/* Rematch */}
          {over && !amISpectator && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              {!myRematchSent ? (
                <button onClick={handleRematch} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  🔄 Đề xuất chơi lại
                </button>
              ) : (
                <div style={{ flex: 1, textAlign: 'center', color: 'var(--steam-text-dim)', fontSize: '13px', padding: '8px', border: '1px solid var(--steam-border)', borderRadius: '4px' }}>
                  ✅ Đã gửi đề nghị chơi lại...
                  {rematchRequest && rematchRequest.length < 2 && (
                    <span style={{ color: 'var(--steam-orange)' }}> (chờ đối thủ)</span>
                  )}
                </div>
              )}
              {rematchRequest && rematchRequest.some(r => r !== user.username) && !myRematchSent && (
                <div style={{ color: 'var(--steam-orange)', fontSize: '13px', flex: 1, textAlign: 'center' }}>
                  💬 Đối thủ muốn chơi lại!
                </div>
              )}
              <Link to="/lobby" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', textAlign: 'center' }}>
                Về Lobby
              </Link>
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div style={{ flex: '1 1 280px', minWidth: '280px', background: 'var(--steam-card-bg)', borderRadius: '4px', border: '1px solid var(--steam-border)', display: 'flex', flexDirection: 'column', height: '620px' }}>
          <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--steam-border)', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            💬 Chat phòng
            {room.spectators?.length > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--steam-text-dim)', marginLeft: 'auto' }}>
                👁 {room.spectators.length} xem
              </span>
            )}
          </div>

          <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* System messages */}
            <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)', textAlign: 'center', padding: '4px 0' }}>
              {room.players[0]?.username} (X) vs {room.players[1]?.username || '?'} (O)
            </div>
            {(room.messages || []).map((msg, i) => (
              <div key={i} style={{ fontSize: '13px' }}>
                <span style={{ color: msg.user === user.username ? 'var(--steam-blue)' : 'var(--steam-orange)', fontWeight: 'bold' }}>
                  {msg.user}:{' '}
                </span>
                <span style={{ color: 'var(--steam-highlight)' }}>{msg.text}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: '10px', borderTop: '1px solid var(--steam-border)', gap: '6px' }}>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              style={{ flex: 1, padding: '7px 10px', background: 'var(--steam-darker-bg)', border: '1px solid var(--steam-border)', color: 'var(--steam-highlight)', borderRadius: '3px', outline: 'none', fontSize: '13px' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '7px 12px' }}>Gửi</button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default GameRoom;
