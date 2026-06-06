import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { socket } from '../../sockets/socket';
import useAuthStore from '../../states/authStore';

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Mới tạo';
  const diff = Date.now() - timestamp;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'Vừa xong';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  return `${hours} giờ trước`;
};

const Lobby = () => {
  const [rooms, setRooms] = useState([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [roomPasswordInput, setRoomPasswordInput] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'waiting' | 'playing' | 'password'

  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join_lobby', { userId: user.id, username: user.username });

    socket.on('room_list_update', (roomList) => {
      setRooms(roomList);
    });

    socket.on('online_count', (count) => {
      setOnlineCount(count);
    });

    return () => {
      socket.off('room_list_update');
      socket.off('online_count');
    };
  }, [user, navigate]);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!roomIdInput.trim()) return;
    const password = usePassword ? roomPasswordInput.trim() : '';
    
    socket.emit('create_room', { 
      roomId: roomIdInput.trim(), 
      user, 
      password: password || null 
    });
    navigate(`/room/${roomIdInput.trim()}`);
  };

  const handleJoinRoom = (id, hasPassword, isSpectator = false) => {
    let password = null;
    if (hasPassword && !isSpectator) {
      password = prompt('Nhập mật khẩu phòng:');
      if (password === null) return; // User cancelled
    }
    
    socket.emit('join_room', { roomId: id, user, password, spectate: isSpectator });
    navigate(`/room/${id}`);
  };

  const handleQuickMatch = () => {
    // Tìm phòng đang chờ, không mật khẩu, chưa đầy, và không phải của chính mình
    const availableRooms = rooms.filter(
      r => r.status === 'waiting' && r.players.length === 1 && !r.hasPassword && !r.players.some(p => p.username === user.username)
    );

    if (availableRooms.length > 0) {
      // Sắp xếp theo Elo gần nhất
      const myElo = user.elo || 1200;
      availableRooms.sort((a, b) => {
        const diffA = Math.abs((a.hostElo || 1200) - myElo);
        const diffB = Math.abs((b.hostElo || 1200) - myElo);
        return diffA - diffB;
      });

      const targetRoom = availableRooms[0];
      handleJoinRoom(targetRoom.id, false, false);
    } else {
      // Tự động tạo phòng ngẫu nhiên
      const autoRoomId = `Match_${Math.floor(1000 + Math.random() * 9000)}`;
      socket.emit('create_room', { roomId: autoRoomId, user, password: null });
      navigate(`/room/${autoRoomId}`);
    }
  };

  // Lọc phòng
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = 
      room.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.players.some(p => p.username.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'waiting') return room.status === 'waiting';
    if (statusFilter === 'playing') return room.status === 'playing';
    if (statusFilter === 'password') return room.hasPassword;
    return true;
  });

  return (
    <div className="container fade-in" style={{ padding: '30px 16px', maxWidth: '1200px' }}>
      
      {/* Header Info Banner */}
      <div style={{
        background: 'linear-gradient(90deg, #1f2e42 0%, #16202d 100%)',
        border: '1px solid var(--steam-border)',
        borderRadius: '6px',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--steam-highlight)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎮 Sảnh Caro Online
          </h2>
          <p style={{ color: 'var(--steam-text-dim)', fontSize: '13px', marginTop: '4px' }}>
            Tìm phòng, thách đấu những người chơi khác và leo hạng Elo!
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(76, 107, 34, 0.15)',
            border: '1px solid var(--steam-green)',
            borderRadius: '4px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--steam-green-bright)',
              boxShadow: '0 0 8px var(--steam-green-bright)',
              animation: 'pulse-glow 2s infinite'
            }}></span>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--steam-green-bright)' }}>
              {onlineCount} người chơi online
            </span>
          </div>

          <button 
            onClick={handleQuickMatch} 
            className="btn btn-green"
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              boxShadow: '0 0 15px rgba(117,176,34,0.3)',
              borderRadius: '4px'
            }}
          >
            ⚡ Tìm Trận Nhanh
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        
        {/* LEFT COLUMN: ROOM LIST & FILTERS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Filter Bar */}
          <div style={{
            background: 'var(--steam-card-bg)',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid var(--steam-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Tìm tên phòng hoặc tên người chơi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--steam-darker-bg)',
                  border: '1px solid var(--steam-border)',
                  color: 'var(--steam-highlight)',
                  borderRadius: '4px',
                  outline: 'none',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'waiting', label: '⏳ Đang chờ' },
                { key: 'playing', label: '⚔️ Đang chơi' },
                { key: 'password', label: '🔒 Phòng khóa' }
              ].map(btn => (
                <button
                  key={btn.key}
                  onClick={() => setStatusFilter(btn.key)}
                  className={`btn ${statusFilter === btn.key ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '4px'
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rooms Grid */}
          <div style={{
            background: 'var(--steam-card-bg)',
            padding: '24px',
            borderRadius: '6px',
            border: '1px solid var(--steam-border)',
            minHeight: '400px'
          }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--steam-highlight)', display: 'flex', justifyContent: 'space-between' }}>
              Danh sách phòng ({filteredRooms.length})
            </h3>
            
            {filteredRooms.length === 0 ? (
              <div style={{ color: 'var(--steam-text-dim)', textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <p style={{ fontSize: '15px' }}>Không tìm thấy phòng nào phù hợp.</p>
                <p style={{ fontSize: '12px', marginTop: '6px' }}>Hãy tạo một phòng mới ở thanh bên để bắt đầu chơi!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {filteredRooms.map(room => {
                  const host = room.players[0];
                  const guest = room.players[1];
                  const isMine = room.players.some(p => p.username === user.username);
                  
                  return (
                    <div 
                      key={room.id} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '16px', 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid var(--steam-border-light)', 
                        borderRadius: '6px',
                        transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                        cursor: 'default',
                        position: 'relative'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--steam-blue)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--steam-border-light)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Top Row: Room ID & Time */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ color: 'var(--steam-highlight)', fontSize: '15px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {room.hasPassword && <span style={{ color: 'var(--steam-gold)', fontSize: '13px' }}>🔒</span>}
                            {room.id}
                          </h4>
                          <span style={{ fontSize: '11px', color: 'var(--steam-text-dim)' }}>
                            🕒 {formatTimeAgo(room.createdAt)}
                          </span>
                        </div>
                        
                        {/* Status Badge */}
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: room.status === 'playing' ? 'rgba(102, 192, 244, 0.15)' : 'rgba(164, 208, 7, 0.15)',
                          color: room.status === 'playing' ? 'var(--steam-blue)' : 'var(--steam-green-bright)',
                          border: `1px solid ${room.status === 'playing' ? 'var(--steam-border)' : 'var(--steam-green)'}`
                        }}>
                          {room.status === 'playing' ? 'Đang đấu' : 'Đang chờ'}
                        </span>
                      </div>

                      {/* Middle: Host & Player Elo Info */}
                      <div style={{ marginBottom: '16px', background: 'rgba(0,0,0,0.15)', padding: '8px 10px', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span style={{ color: 'var(--steam-blue)' }}>👑 {host?.username || '—'}</span>
                          <span style={{ color: 'var(--steam-gold)' }}>({host?.elo ?? room.hostElo ?? 1200} Elo)</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          {guest ? (
                            <>
                              <span style={{ color: 'var(--steam-text)' }}>⚔️ {guest.username}</span>
                              <span style={{ color: 'var(--steam-gold)' }}>({guest.elo ?? 1200} Elo)</span>
                            </>
                          ) : (
                            <span style={{ color: 'var(--steam-text-dim)', fontStyle: 'italic' }}>Chờ đối thủ gia nhập...</span>
                          )}
                        </div>
                        {room.spectatorCount > 0 && (
                          <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            👁️ {room.spectatorCount} người đang xem
                          </div>
                        )}
                      </div>

                      {/* Bottom: Action Button */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {isMine ? (
                          <button
                            onClick={() => handleJoinRoom(room.id, false, false)}
                            className="btn btn-green"
                            style={{ flex: 1, justifyContent: 'center', padding: '6px' }}
                          >
                            Vào lại phòng
                          </button>
                        ) : room.status === 'playing' || room.players.length >= 2 ? (
                          <button
                            onClick={() => handleJoinRoom(room.id, false, true)}
                            className="btn btn-secondary"
                            style={{ flex: 1, justifyContent: 'center', padding: '6px' }}
                          >
                            👁️ Xem Trận
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinRoom(room.id, room.hasPassword, false)}
                            className="btn btn-primary"
                            style={{ flex: 1, justifyContent: 'center', padding: '6px' }}
                          >
                            ⚔️ Tham gia
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CREATE ROOM & RULES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Create Room Box */}
          <div style={{
            background: 'var(--steam-card-bg)',
            padding: '20px',
            borderRadius: '6px',
            border: '1px solid var(--steam-border)',
            boxShadow: 'var(--shadow-card)'
          }}>
            <h3 style={{ fontSize: '15px', marginBottom: '14px', borderBottom: '1px solid var(--steam-border)', paddingBottom: '8px' }}>
              ➕ Tạo phòng mới
            </h3>
            <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--steam-text-dim)', marginBottom: '4px' }}>Tên phòng</label>
                <input
                  type="text"
                  placeholder="Nhập tên phòng..."
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'var(--steam-darker-bg)',
                    border: '1px solid var(--steam-border)',
                    color: 'var(--steam-highlight)',
                    borderRadius: '4px',
                    outline: 'none',
                    fontSize: '13px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', margin: '4px 0' }}>
                  <input
                    type="checkbox"
                    checked={usePassword}
                    onChange={(e) => setUsePassword(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  Đặt mật khẩu phòng
                </label>
              </div>

              {usePassword && (
                <div className="fade-in">
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--steam-text-dim)', marginBottom: '4px' }}>Mật khẩu</label>
                  <input
                    type="password"
                    placeholder="Mật khẩu..."
                    value={roomPasswordInput}
                    onChange={(e) => setRoomPasswordInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--steam-darker-bg)',
                      border: '1px solid var(--steam-border)',
                      color: 'var(--steam-highlight)',
                      borderRadius: '4px',
                      outline: 'none',
                      fontSize: '13px'
                    }}
                    required={usePassword}
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '6px', padding: '10px' }}>
                Tạo phòng
              </button>
            </form>
          </div>

          {/* Quick Stats / Info Box */}
          <div style={{
            background: 'var(--steam-card-bg)',
            padding: '20px',
            borderRadius: '6px',
            border: '1px solid var(--steam-border)',
            boxShadow: 'var(--shadow-card)'
          }}>
            <h3 style={{ fontSize: '15px', marginBottom: '12px', color: 'var(--steam-blue)' }}>
              ℹ️ Luật chơi & Thông tin
            </h3>
            <ul style={{
              color: 'var(--steam-text-dim)',
              fontSize: '12px',
              paddingLeft: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              lineHeight: '1.4'
            }}>
              <li>Hệ thống tính điểm Elo sau mỗi trận đấu chính thức (2 người chơi thực).</li>
              <li>Mỗi lượt đánh có giới hạn <strong>30 giây</strong>. Hết giờ sẽ tự xử thua.</li>
              <li>Bạn có thể đề xuất Chơi lại sau khi trận đấu kết thúc.</li>
              <li>Được phép tham gia với tư cách <strong>Người xem (Spectator)</strong> nếu phòng đã đầy.</li>
              <li>Đạt <strong>5 ô liên tiếp</strong> (hàng ngang, dọc, chéo) để giành chiến thắng. Không áp dụng luật chặn 2 đầu.</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Lobby;
