import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { socket } from '../../sockets/socket';
import useAuthStore from '../../states/authStore';
import Board from '../../components/Board';
import { checkWinner } from '../../utils/checkWinner';

const GameRoom = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!socket.connected) socket.connect();

    socket.on('room_state_update', (roomState) => {
      setRoom(roomState);
    });

    socket.on('receive_message', (msg) => {
      setRoom(prev => {
        if (!prev) return prev;
        return { ...prev, messages: [...prev.messages, msg] };
      });
    });

    return () => {
      socket.off('room_state_update');
      socket.off('receive_message');
    };
  }, [user, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.messages]);

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

    // Determine current player's symbol
    const isPlayer1 = room.players[0].username === user.username;
    const symbol = isPlayer1 ? 'X' : 'O';

    // Check win condition BEFORE emitting (optimistic check) or let the updated board arrive first?
    // Let's optimistic check
    const newBoard = JSON.parse(JSON.stringify(room.board));
    newBoard[row][col] = symbol;

    if (checkWinner(newBoard, row, col, symbol)) {
      // Emit make move first, then game over
      socket.emit('make_move', { roomId: id, row, col, user });
      socket.emit('game_over', { roomId: id, winner: user.username });
    } else {
      socket.emit('make_move', { roomId: id, row, col, user });
    }
  };

  if (!room) {
    return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Loading room data...</div>;
  }

  const isPlayerInRoom = room.players.some(p => p.username === user.username);
  const amISpectator = !isPlayerInRoom;

  return (
    <div className="container fade-in" style={{ padding: '20px 16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'var(--steam-card-bg)', padding: '16px', borderRadius: '4px', border: '1px solid var(--steam-border)' }}>
        <div>
          <h2 className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>Room: {id}</h2>
          <div style={{ color: 'var(--steam-text-dim)', fontSize: '13px', marginTop: '4px' }}>
            Status: <span style={{ color: room.status === 'playing' ? 'var(--steam-green-bright)' : 'var(--steam-orange)' }}>{room.status.toUpperCase()}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--steam-blue)', fontWeight: 'bold' }}>
              {room.players[0]?.username || 'Waiting...'} <span style={{ color: 'var(--steam-text)' }}>(X)</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)' }}>VS</div>
            <div style={{ color: 'var(--steam-orange)', fontWeight: 'bold' }}>
              {room.players[1]?.username || 'Waiting...'} <span style={{ color: 'var(--steam-text)' }}>(O)</span>
            </div>
          </div>
          <button onClick={handleLeaveRoom} className="btn btn-secondary">Leave Room</button>
        </div>
      </div>

      {/* Main Game Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr', gap: '20px' }}>
        
        {/* Left: Board */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Turn Indicator */}
          <div style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold', height: '27px' }}>
            {room.status === 'finished' ? (
              <span style={{ color: 'var(--steam-gold)' }}>🏆 Winner: {room.winner} 🏆</span>
            ) : room.status === 'playing' ? (
              room.turn === user.username ? (
                <span style={{ color: 'var(--steam-green-bright)' }}>Your Turn!</span>
              ) : (
                <span style={{ color: 'var(--steam-text-dim)' }}>Waiting for {room.turn}...</span>
              )
            ) : (
              <span style={{ color: 'var(--steam-text-dim)' }}>Waiting for opponent...</span>
            )}
          </div>

          <Board 
            board={room.board} 
            onCellClick={handleCellClick} 
            disabled={room.status !== 'playing' || room.turn !== user.username || amISpectator} 
          />
        </div>

        {/* Right: Chat Box */}
        <div style={{ background: 'var(--steam-card-bg)', borderRadius: '4px', border: '1px solid var(--steam-border)', display: 'flex', flexDirection: 'column', height: '650px' }}>
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--steam-border)', fontWeight: 'bold' }}>
            Room Chat
          </div>
          
          <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {room.messages.map((msg, i) => (
              <div key={i} style={{ fontSize: '13px' }}>
                <span style={{ color: msg.user === user.username ? 'var(--steam-blue)' : 'var(--steam-orange)', fontWeight: 'bold' }}>
                  {msg.user}: 
                </span>
                <span style={{ color: 'var(--steam-highlight)', marginLeft: '4px' }}>
                  {msg.text}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: '12px', borderTop: '1px solid var(--steam-border)', gap: '8px' }}>
            <input 
              type="text" 
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type a message..."
              style={{ flex: 1, padding: '8px', background: 'var(--steam-darker-bg)', border: '1px solid var(--steam-border)', color: 'var(--steam-highlight)', borderRadius: '3px', outline: 'none' }}
            />
            <button type="submit" className="btn btn-primary">Send</button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default GameRoom;
