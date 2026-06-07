import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { socket } from '../../sockets/socket';
import useAuthStore from '../../states/authStore';

// Count-up animation hook
function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target || target === 0) { setCount(0); return; }
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

const Home = () => {
  const { user } = useAuthStore();
  const [onlineCount, setOnlineCount] = useState(0);
  const [waitingRooms, setWaitingRooms] = useState(0);
  const [playingRooms, setPlayingRooms] = useState(0);

  // Count-up animations
  const animElo = useCountUp(user?.elo ?? 0);
  const animWins = useCountUp(user?.wins ?? 0);
  const animLosses = useCountUp(user?.losses ?? 0);
  const animMatches = useCountUp(user?.matches_played ?? 0);
  const animOnline = useCountUp(onlineCount);

  const winRate = user?.matches_played > 0
    ? Math.round((user.wins / user.matches_played) * 100)
    : 0;

  useEffect(() => {
    // Kết nối socket để lấy live data cho Home
    if (!socket.connected) socket.connect();

    socket.emit('join_lobby');

    socket.on('online_count', (c) => setOnlineCount(c));
    socket.on('room_list_update', (rooms) => {
      setWaitingRooms(rooms.filter(r => r.status === 'waiting').length);
      setPlayingRooms(rooms.filter(r => r.status === 'playing').length);
    });

    return () => {
      socket.off('online_count');
      socket.off('room_list_update');
    };
  }, []);

  return (
    <div className="container fade-in" style={{ padding: '40px 16px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{
          fontSize: '48px', fontWeight: '900', letterSpacing: '-2px',
          marginBottom: '14px',
          background: 'linear-gradient(135deg, var(--steam-blue), var(--steam-orange))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          CaroOnline
        </h1>
        <p style={{ color: 'var(--steam-text-dim)', fontSize: '16px', maxWidth: '520px', margin: '0 auto 24px', lineHeight: '1.6' }}>
          Trải nghiệm Caro 5-in-a-row cùng bạn bè hoặc thử sức với AI thích ứng theo điểm Elo.
        </p>

        {/* Live badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '16px',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--steam-border)',
          borderRadius: '20px',
          padding: '8px 20px',
          fontSize: '13px', color: 'var(--steam-text-dim)',
          marginBottom: '24px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: 'var(--steam-green-bright)',
              boxShadow: '0 0 6px var(--steam-green-bright)',
              animation: 'pulse-glow 2s infinite'
            }} />
            <strong style={{ color: 'var(--steam-green-bright)' }}>{animOnline}</strong> online
          </span>
          <span style={{ color: 'var(--steam-border)' }}>|</span>
          <span>
            <strong style={{ color: 'var(--steam-orange)' }}>{waitingRooms}</strong> phòng chờ
          </span>
          <span style={{ color: 'var(--steam-border)' }}>|</span>
          <span>
            <strong style={{ color: 'var(--steam-blue)' }}>{playingRooms}</strong> đang đấu
          </span>
        </div>

        {!user && (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>🔑 Đăng nhập</Link>
            <Link to="/register" className="btn btn-green" style={{ padding: '10px 24px', fontSize: '14px' }}>✨ Đăng ký miễn phí</Link>
          </div>
        )}
      </div>

      {/* Mode cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', maxWidth: '900px', margin: '0 auto 40px' }}>

        {/* Online */}
        <div style={{
          background: 'var(--steam-card-bg)', borderRadius: '8px',
          border: '1px solid var(--steam-border)', padding: '28px',
          display: 'flex', flexDirection: 'column', gap: '12px',
          transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s'
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--steam-blue)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--steam-border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={{ fontSize: '40px' }}>🌐</div>
          <h3 style={{ margin: 0, color: 'var(--steam-highlight)', fontSize: '18px' }}>Chơi Online</h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--steam-text-dim)', lineHeight: '1.6', flex: 1 }}>
            Tạo phòng hoặc tham gia phòng để đấu với người chơi khác theo thời gian thực. Điểm Elo cập nhật sau mỗi trận.
          </p>
          {waitingRooms > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--steam-green-bright)', background: 'rgba(164,208,7,0.1)', padding: '4px 10px', borderRadius: '3px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              ⚡ {waitingRooms} phòng đang chờ đối thủ
            </div>
          )}
          <Link to={user ? '/lobby' : '/login'} className="btn btn-primary" style={{ textAlign: 'center', marginTop: 'auto' }}>
            {user ? '🎮 Vào Lobby' : '🔑 Đăng nhập để chơi'}
          </Link>
        </div>

        {/* vs AI */}
        <div style={{
          background: 'var(--steam-card-bg)', borderRadius: '8px',
          border: '1px solid var(--steam-border)', padding: '28px',
          display: 'flex', flexDirection: 'column', gap: '12px',
          transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s'
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--steam-orange)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--steam-border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={{ fontSize: '40px' }}>🤖</div>
          <h3 style={{ margin: 0, color: 'var(--steam-highlight)', fontSize: '18px' }}>Đánh Với Máy</h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--steam-text-dim)', lineHeight: '1.6', flex: 1 }}>
            AI tự động điều chỉnh độ khó theo Elo của bạn. Thắng để leo hạng!
          </p>
          <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[['Dễ', '#57cbde', '< 1200'], ['T.Bình', '#f4b942', '1200–1400'], ['Khó', '#e87c23', '1400–1600'], ['Expert', '#e84c3d', '1600+']].map(([l, c, r]) => (
              <span key={l} style={{ background: `${c}22`, color: c, padding: '2px 7px', borderRadius: '20px', fontSize: '11px', border: `1px solid ${c}44` }}>{l} ({r})</span>
            ))}
          </div>
          <Link to={user ? '/play-ai' : '/login'} className="btn btn-secondary" style={{ textAlign: 'center', marginTop: 'auto', borderColor: 'var(--steam-orange)', color: 'var(--steam-orange)' }}>
            {user ? '⚔️ Chơi Ngay' : '🔑 Đăng nhập để chơi'}
          </Link>
        </div>

        {/* 2 người offline */}
        <div style={{
          background: 'var(--steam-card-bg)', borderRadius: '8px',
          border: '1px solid var(--steam-border)', padding: '28px',
          display: 'flex', flexDirection: 'column', gap: '12px',
          transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s'
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#9b59b6'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--steam-border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={{ fontSize: '40px' }}>👥</div>
          <h3 style={{ margin: 0, color: 'var(--steam-highlight)', fontSize: '18px' }}>2 Người Offline</h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--steam-text-dim)', lineHeight: '1.6', flex: 1 }}>
            Hai người thay nhau đánh trên cùng một thiết bị. Hỗ trợ Best of 3/5/7 và undo nước đi!
          </p>
          <Link to={user ? '/play-local' : '/login'} className="btn btn-secondary" style={{ textAlign: 'center', marginTop: 'auto', borderColor: '#9b59b6', color: '#9b59b6' }}>
            {user ? '🎮 Chơi Ngay' : '🔑 Đăng nhập để chơi'}
          </Link>
        </div>
      </div>

      {/* Stats card nếu đã đăng nhập */}
      {user && (
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          background: 'var(--steam-card-bg)',
          borderRadius: '8px', border: '1px solid var(--steam-border)',
          padding: '24px 28px',
          boxShadow: 'var(--shadow-card)',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, var(--steam-blue), var(--steam-orange))'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)', marginBottom: '4px' }}>Xin chào,</div>
              <div style={{ fontWeight: 'bold', color: 'var(--steam-blue)', fontSize: '20px' }}>{user.username}</div>
            </div>

            {[
              ['Elo', animElo, '#c6a614'],
              ['Trận đã chơi', animMatches, 'var(--steam-highlight)'],
              ['Thắng', animWins, 'var(--steam-green-bright)'],
              ['Thua', animLosses, '#e84c3d'],
              ['Tỉ lệ thắng', `${winRate}%`, winRate >= 50 ? 'var(--steam-green-bright)' : '#f4b942'],
            ].map(([label, val, color]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color }}>{val}</div>
                <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)' }}>{label}</div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Link to="/profile" className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }}>👤 Profile</Link>
              <Link to="/leaderboard" className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }}>🏆 Xếp hạng</Link>
            </div>
          </div>

          {/* Win rate bar */}
          {user.matches_played > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--steam-border)', paddingTop: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Tỉ lệ thắng thua</span>
                <span>{user.wins}W - {user.losses}L</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: `${winRate}%`, background: 'linear-gradient(90deg, #5a8a18, var(--steam-green-bright))', transition: 'width 0.8s ease' }} />
                <div style={{ flex: 1, background: 'linear-gradient(90deg, #b71c1c, #e53935)' }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
