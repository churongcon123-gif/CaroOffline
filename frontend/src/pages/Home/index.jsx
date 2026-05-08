import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../states/authStore';

const Home = () => {
  const { user } = useAuthStore();

  return (
    <div className="container fade-in" style={{ padding: '40px 16px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '12px', background: 'linear-gradient(135deg, var(--steam-blue), var(--steam-orange))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          CaroOnline
        </h1>
        <p style={{ color: 'var(--steam-text-dim)', fontSize: '16px', maxWidth: '480px', margin: '0 auto' }}>
          Trải nghiệm Caro 5-in-a-row cùng bạn bè hoặc thử sức với AI thích ứng theo điểm Elo của bạn.
        </p>
        {!user && (
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary">Đăng nhập</Link>
            <Link to="/register" className="btn btn-secondary">Đăng ký</Link>
          </div>
        )}
      </div>

      {/* Mode cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>

        {/* Online */}
          <div style={{ background: 'var(--steam-card-bg)', borderRadius: '6px', border: '1px solid var(--steam-border)', padding: '28px', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'border-color 0.2s', cursor: 'default' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--steam-blue)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--steam-border)'}
        >
          <div style={{ fontSize: '36px' }}>🌐</div>
          <h3 style={{ margin: 0, color: 'var(--steam-highlight)', fontSize: '18px' }}>Chơi Online</h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--steam-text-dim)', lineHeight: '1.6' }}>
            Tạo phòng hoặc tham gia phòng để đấu với người chơi khác theo thời gian thực. Điểm Elo được cập nhật sau mỗi trận.
          </p>
          <div className="btn btn-primary" style={{ textAlign: 'center', marginTop: 'auto', opacity: 0.5, cursor: 'not-allowed' }}>
            🚧 Sắp ra mắt
          </div>
        </div>

        {/* vs AI */}
        <div style={{ background: 'var(--steam-card-bg)', borderRadius: '6px', border: '1px solid var(--steam-border)', padding: '28px', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'border-color 0.2s', cursor: 'default' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--steam-orange)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--steam-border)'}
        >
          <div style={{ fontSize: '36px' }}>🤖</div>
          <h3 style={{ margin: 0, color: 'var(--steam-highlight)', fontSize: '18px' }}>Đánh Với Máy</h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--steam-text-dim)', lineHeight: '1.6' }}>
            AI tự động điều chỉnh độ khó dựa theo Elo của bạn. Elo tăng → máy chơi mạnh hơn. Thắng để leo hạng!
          </p>
          <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[['Dễ','#57cbde','< 1200'],['Trung bình','#f4b942','1200–1400'],['Khó','#e87c23','1400–1600'],['Chuyên gia','#e84c3d','1600+']].map(([l,c,r]) => (
              <span key={l} style={{ background: `${c}22`, color: c, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', border: `1px solid ${c}44` }}>{l} ({r})</span>
            ))}
          </div>
          <Link to={user ? '/play-ai' : '/login'} className="btn btn-secondary" style={{ textAlign: 'center', marginTop: 'auto', borderColor: 'var(--steam-orange)', color: 'var(--steam-orange)' }}>
            {user ? 'Chơi Ngay' : 'Đăng nhập để chơi'}
          </Link>
        </div>

        {/* 2 người offline */}
          <div style={{ background: 'var(--steam-card-bg)', borderRadius: '6px', border: '1px solid var(--steam-border)', padding: '28px', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'border-color 0.2s', cursor: 'default' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#9b59b6'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--steam-border)'}
        >
          <div style={{ fontSize: '36px' }}>👥</div>
          <h3 style={{ margin: 0, color: 'var(--steam-highlight)', fontSize: '18px' }}>2 Người Offline</h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--steam-text-dim)', lineHeight: '1.6' }}>
            Hai người thay nhau đánh trên cùng một thiết bị. Chơi thoải mái, không tính điểm Elo.
          </p>
          <Link to={user ? '/play-local' : '/login'} className="btn btn-secondary" style={{ textAlign: 'center', marginTop: 'auto', borderColor: '#9b59b6', color: '#9b59b6' }}>
            {user ? 'Chơi Ngay' : 'Đăng nhập để chơi'}
          </Link>
        </div>

      </div>

      {/* Stats if logged in */}
      {user && (
        <div style={{ maxWidth: '900px', margin: '40px auto 0', background: 'var(--steam-card-bg)', borderRadius: '6px', border: '1px solid var(--steam-border)', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--steam-text-dim)', marginBottom: '4px' }}>Xin chào,</div>
            <div style={{ fontWeight: 'bold', color: 'var(--steam-blue)', fontSize: '18px' }}>{user.username}</div>
          </div>
          {[['Elo', user.elo, '#c6a614'], ['Trận đã chơi', user.matches_played ?? '—', 'var(--steam-highlight)'], ['Thắng', user.wins ?? '—', 'var(--steam-green-bright)'], ['Thua', user.losses ?? '—', '#e84c3d']].map(([label, val, color]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color }}>{val}</div>
              <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)' }}>{label}</div>
            </div>
          ))}
          <Link to="/leaderboard" className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }}>
            🏆 Xem bảng xếp hạng
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
