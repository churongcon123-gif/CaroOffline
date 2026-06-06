import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { socket } from '../../sockets/socket';
import useAuthStore from '../../states/authStore';

const Lobby = () => {
  const [rooms, setRooms] = useState([]);
  const [roomIdInput, setRoomIdInput] = useState('');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    socket.connect();
    socket.emit('join_lobby');

    socket.on('room_list_update', (roomList) => {
      setRooms(roomList);
    });

    return () => {
      socket.off('room_list_update');
    };
  }, [user, navigate]);

  const handleCreateRoom = () => {
    if (!roomIdInput) return;
    socket.emit('create_room', { roomId: roomIdInput, user });
    navigate(`/room/${roomIdInput}`);
  };

  const handleJoinRoom = (id) => {
    socket.emit('join_room', { roomId: id, user });
    navigate(`/room/${id}`);
  };

  return (
    <div className="container fade-in" style={{ padding: '40px 16px' }}>
      <h2 className="section-title">Game Lobby</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px' }}>
        
        {/* Left Col: Rooms List */}
        <div style={{ background: 'var(--steam-card-bg)', padding: '24px', borderRadius: '4px', border: '1px solid var(--steam-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3>Available Rooms</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Room Name" 
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                style={{ padding: '6px 10px', background: 'var(--steam-darker-bg)', border: '1px solid var(--steam-border)', color: 'var(--steam-highlight)', borderRadius: '3px', outline: 'none' }}
              />
              <button onClick={handleCreateRoom} className="btn btn-primary">Create Room</button>
            </div>
          </div>
          
          {rooms.length === 0 ? (
            <p style={{ color: 'var(--steam-text-dim)', textAlign: 'center', padding: '40px 0' }}>No rooms available. Create one to start playing!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rooms.map(room => (
                <div key={room.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--steam-border-light)', borderRadius: '4px' }}>
                  <div>
                    <h4 style={{ color: 'var(--steam-highlight)', fontSize: '16px', marginBottom: '4px' }}>Room: {room.id}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--steam-text-dim)' }}>
                      Players: {room.players.length}/2 | Status: {room.status}
                    </p>
                  </div>
                  <div>
                    <button 
                      onClick={() => handleJoinRoom(room.id)} 
                      className={room.players.length >= 2 ? "btn btn-secondary" : "btn btn-green"}
                      disabled={room.players.length >= 2 && !room.players.some(p => p.username === user.username)}
                    >
                      {room.players.some(p => p.username === user.username) ? 'Rejoin' : (room.players.length >= 2 ? 'Full' : 'Join')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Info/Rules */}
        <div style={{ background: 'var(--steam-card-bg)', padding: '24px', borderRadius: '4px', border: '1px solid var(--steam-border)', height: 'fit-content' }}>
          <h3>How to Play</h3>
          <ul style={{ marginTop: '16px', color: 'var(--steam-text-dim)', listStylePosition: 'inside', paddingLeft: '4px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Create a room or join an existing one.</li>
            <li>Wait for an opponent to join.</li>
            <li>First player to get 5 pieces in a row (horizontally, vertically, or diagonally) wins.</li>
            <li>No "blocked on both ends" rule applied.</li>
            <li>Board size là 15×15.</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default Lobby;
