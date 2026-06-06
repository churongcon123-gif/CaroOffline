import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../states/authStore';
import { getProfileApi } from '../../api/authApi';

const Profile = () => {
  const { user, token, updateUserElo } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }

    const fetchLatestProfile = async () => {
      try {
        const data = await getProfileApi(token);
        if (data && data.user) {
          updateUserElo(data.user);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Không thể làm mới số liệu thống kê từ máy chủ.');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestProfile();
  }, [user, token, navigate, updateUserElo]);

  if (!user) return null;

  // Tính toán số liệu thống kê
  const totalMatches = user.matches_played || 0;
  const wins = user.wins || 0;
  const losses = user.losses || 0;
  
  // Tỷ lệ thắng
  const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '0.0';
  const winPercent = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
  const lossPercent = totalMatches > 0 ? (losses / totalMatches) * 100 : 0;

  // Avatar text (chữ cái đầu)
  const avatarLetter = user.username ? user.username.charAt(0).toUpperCase() : '?';

  return (
    <div className="container fade-in" style={{ padding: '40px 16px', maxWidth: '800px' }}>
      
      {/* Profile Card */}
      <div style={{
        background: 'var(--steam-card-bg)',
        border: '1px solid var(--steam-border)',
        borderRadius: '6px',
        padding: '30px',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Glow effect at the top */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, var(--steam-blue) 0%, var(--steam-green-bright) 100%)'
        }}></div>

        {loading && (
          <div style={{
            position: 'absolute',
            top: 4,
            right: 12,
            fontSize: '11px',
            color: 'var(--steam-text-dim)'
          }}>
            🔄 Đang cập nhật...
          </div>
        )}

        <div style={{ display: 'flex', gap: '30px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Large Avatar */}
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2a475e 0%, #1b2838 100%)',
            border: '2px solid var(--steam-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            fontWeight: 'bold',
            color: 'var(--steam-blue)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            userSelect: 'none'
          }}>
            {avatarLetter}
          </div>

          {/* User Meta Info */}
          <div style={{ flex: 1, minWidth: '240px' }}>
            <h2 style={{ fontSize: '28px', color: 'var(--steam-highlight)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              {user.username}
            </h2>
            <div style={{ display: 'flex', gap: '16px', marginTop: '10px', alignItems: 'center' }}>
              <span style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'var(--steam-gold)',
                background: 'rgba(246, 199, 69, 0.1)',
                border: '1px solid rgba(246, 199, 69, 0.3)',
                padding: '4px 12px',
                borderRadius: '4px'
              }}>
                🏆 {user.elo} Elo
              </span>
              <span style={{ fontSize: '13px', color: 'var(--steam-text-dim)' }}>
                Hạng: <strong>Bậc Thầy</strong>
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(226, 0, 26, 0.1)', border: '1px solid var(--steam-red)', borderRadius: '4px', color: '#ff6b6b', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid var(--steam-border)', margin: '30px 0' }} />

        {/* Stats Grid */}
        <h3 style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--steam-highlight)' }}>
          📊 Thống kê chi tiết
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '30px' }}>
          
          {[
            { label: 'Số ván đã chơi', value: totalMatches, color: 'var(--steam-highlight)' },
            { label: 'Số ván thắng', value: wins, color: 'var(--steam-green-bright)' },
            { label: 'Số ván thua', value: losses, color: '#ff6b6b' },
            { label: 'Tỷ lệ thắng', value: `${winRate}%`, color: 'var(--steam-blue)' }
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--steam-border)',
              borderRadius: '4px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)', marginBottom: '8px' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}

        </div>

        {/* Win/Loss Visual Bar */}
        {totalMatches > 0 && (
          <div style={{ marginBottom: '35px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px', color: 'var(--steam-text-dim)' }}>
              <span>Tỉ lệ Thắng / Thua</span>
              <span>{wins} Thắng - {losses} Thua</span>
            </div>
            
            {/* Progress Bar Container */}
            <div style={{
              width: '100%',
              height: '14px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '7px',
              display: 'flex',
              overflow: 'hidden',
              border: '1px solid var(--steam-border)'
            }}>
              <div style={{
                width: `${winPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #5a8a18 0%, #75b022 100%)',
                transition: 'width 0.5s ease'
              }} title={`Thắng: ${winRate}%`}></div>
              <div style={{
                width: `${lossPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #b71c1c 0%, #e53935 100%)',
                transition: 'width 0.5s ease'
              }} title={`Thua: ${(100 - winPercent).toFixed(1)}%`}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px' }}>
              <span style={{ color: 'var(--steam-green-bright)', fontWeight: 'bold' }}>{winPercent.toFixed(1)}% Thắng</span>
              <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>{lossPercent.toFixed(1)}% Thua</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/lobby" className="btn btn-primary" style={{ padding: '10px 20px' }}>
            🌐 Vào Sảnh Lobby
          </Link>
          <Link to="/play-ai" className="btn btn-green" style={{ padding: '10px 20px' }}>
            🤖 Đấu với Máy
          </Link>
          <Link to="/leaderboard" className="btn btn-secondary" style={{ padding: '10px 20px' }}>
            🏆 Bảng Xếp Hạng
          </Link>
        </div>

      </div>

    </div>
  );
};

export default Profile;
