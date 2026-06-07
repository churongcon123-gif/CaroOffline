import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../states/authStore';
import { getProfileApi } from '../../api/authApi';
import { getUnlockedAchievements } from '../../utils/achievements';
import ReplayModal from '../../components/ReplayModal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TABS = ['📊 Thống kê', '📜 Lịch sử', '🏅 Thành tích'];

const getRankLabel = (elo) => {
  if (elo >= 1800) return { label: 'Đại Cao Thủ', color: '#ff4081' };
  if (elo >= 1600) return { label: 'Cao Thủ', color: '#e84c3d' };
  if (elo >= 1400) return { label: 'Kim Cương', color: '#57cbde' };
  if (elo >= 1200) return { label: 'Bạc', color: '#c7d5e0' };
  return { label: 'Đồng', color: '#cd7f32' };
};

const Profile = () => {
  const { user, token, updateUserElo } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const handleOpenReplay = (match) => {
    setSelectedMatch(match);
    setReplayOpen(true);
  };

  useEffect(() => {
    if (!user || !token) { navigate('/login'); return; }
    const fetchProfile = async () => {
      try {
        const data = await getProfileApi(token);
        if (data?.user) updateUserElo(data.user);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, token, navigate, updateUserElo]);

  useEffect(() => {
    if (activeTab === 1 && token && history.length === 0) {
      setHistoryLoading(true);
      fetch(`${API}/api/history?limit=10`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setHistory(d.history || []))
        .catch(console.error)
        .finally(() => setHistoryLoading(false));
    }
  }, [activeTab, token]);

  if (!user) return null;

  const totalMatches = user.matches_played || 0;
  const wins = user.wins || 0;
  const losses = user.losses || 0;
  const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '0.0';
  const winPercent = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
  const lossPercent = totalMatches > 0 ? (losses / totalMatches) * 100 : 0;
  const avatarLetter = user.username ? user.username.charAt(0).toUpperCase() : '?';
  const rank = getRankLabel(user.elo);
  const achievements = getUnlockedAchievements(user);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="container fade-in" style={{ padding: '40px 16px', maxWidth: '820px' }}>

      {/* Profile Card */}
      <div style={{ background: 'var(--steam-card-bg)', border: '1px solid var(--steam-border)', borderRadius: '8px', padding: '28px', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--steam-blue), var(--steam-green-bright))' }} />

        {loading && <div style={{ position: 'absolute', top: 8, right: 12, fontSize: '11px', color: 'var(--steam-text-dim)' }}>🔄 Đang cập nhật...</div>}

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: '88px', height: '88px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--steam-blue), var(--steam-orange))',
            border: '3px solid var(--steam-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '42px', fontWeight: 'bold', color: 'white',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)', userSelect: 'none',
            flexShrink: 0
          }}>
            {avatarLetter}
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '26px', color: 'var(--steam-highlight)', margin: '0 0 8px' }}>{user.username}</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '17px', fontWeight: 'bold', color: '#c6a614', background: 'rgba(198,166,20,0.12)', border: '1px solid rgba(198,166,20,0.3)', padding: '4px 12px', borderRadius: '4px' }}>
                🏆 {user.elo} Elo
              </span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: rank.color, background: `${rank.color}18`, border: `1px solid ${rank.color}44`, padding: '4px 10px', borderRadius: '4px' }}>
                {rank.label}
              </span>
              {unlockedCount > 0 && (
                <span style={{ fontSize: '12px', color: '#f4b942' }}>🏅 {unlockedCount}/{achievements.length} thành tích</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/settings" className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: '12px' }}>⚙️ Cài đặt</Link>
            <Link to="/lobby" className="btn btn-primary" style={{ padding: '7px 14px', fontSize: '12px' }}>🌐 Lobby</Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--steam-darker-bg)', padding: '4px', borderRadius: '6px', border: '1px solid var(--steam-border)' }}>
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            style={{
              flex: 1, padding: '9px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s',
              background: activeTab === i ? 'var(--steam-card-bg)' : 'transparent',
              color: activeTab === i ? 'var(--steam-highlight)' : 'var(--steam-text-dim)',
              boxShadow: activeTab === i ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ background: 'var(--steam-card-bg)', border: '1px solid var(--steam-border)', borderRadius: '8px', padding: '24px' }}>

        {/* TAB 0: Thống kê */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {[
                { label: 'Số ván đã chơi', value: totalMatches, color: 'var(--steam-highlight)' },
                { label: 'Số ván thắng', value: wins, color: 'var(--steam-green-bright)' },
                { label: 'Số ván thua', value: losses, color: '#e84c3d' },
                { label: 'Tỉ lệ thắng', value: `${winRate}%`, color: winPercent >= 50 ? 'var(--steam-green-bright)' : '#f4b942' },
              ].map((stat, i) => (
                <div key={i} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--steam-border)', borderRadius: '6px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                  <div style={{ fontSize: '26px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {totalMatches > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', color: 'var(--steam-text-dim)' }}>
                  <span>Tỉ lệ Thắng / Thua</span>
                  <span>{wins}W - {losses}L</span>
                </div>
                <div style={{ height: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '5px', display: 'flex', overflow: 'hidden', border: '1px solid var(--steam-border)' }}>
                  <div style={{ width: `${winPercent}%`, background: 'linear-gradient(90deg, #5a8a18, var(--steam-green-bright))', transition: 'width 0.6s' }} />
                  <div style={{ flex: 1, background: 'linear-gradient(90deg, #b71c1c, #e53935)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '5px' }}>
                  <span style={{ color: 'var(--steam-green-bright)' }}>{winPercent.toFixed(1)}% Thắng</span>
                  <span style={{ color: '#e84c3d' }}>{lossPercent.toFixed(1)}% Thua</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
              <Link to="/leaderboard" className="btn btn-secondary" style={{ padding: '9px 18px', fontSize: '13px' }}>🏆 Bảng Xếp Hạng</Link>
              <Link to="/play-ai" className="btn btn-green" style={{ padding: '9px 18px', fontSize: '13px' }}>🤖 Đấu với Máy</Link>
            </div>
          </div>
        )}

        {/* TAB 1: Lịch sử */}
        {activeTab === 1 && (
          <div>
            <h3 style={{ margin: '0 0 16px', color: 'var(--steam-highlight)', fontSize: '15px' }}>📜 10 Ván Gần Nhất</h3>
            {historyLoading && <div style={{ color: 'var(--steam-text-dim)', textAlign: 'center', padding: '20px' }}>🔄 Đang tải...</div>}
            {!historyLoading && history.length === 0 && (
              <div style={{ color: 'var(--steam-text-dim)', textAlign: 'center', padding: '30px', border: '1px dashed var(--steam-border)', borderRadius: '6px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎮</div>
                Chưa có lịch sử ván đấu.<br />
                <Link to="/lobby" style={{ color: 'var(--steam-blue)', marginTop: '8px', display: 'inline-block' }}>Chơi ngay →</Link>
              </div>
            )}
            {!historyLoading && history.map((h, i) => (
              <div key={h.id || i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px', borderRadius: '6px', marginBottom: '8px',
                background: h.result === 'win' ? 'rgba(70,197,67,0.08)' : h.result === 'draw' ? 'rgba(244,185,66,0.08)' : 'rgba(232,76,61,0.08)',
                border: `1px solid ${h.result === 'win' ? 'rgba(70,197,67,0.25)' : h.result === 'draw' ? 'rgba(244,185,66,0.25)' : 'rgba(232,76,61,0.25)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '20px' }}>{h.result === 'win' ? '🏆' : h.result === 'draw' ? '🤝' : '💀'}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--steam-highlight)' }}>
                      vs <span style={{ color: h.result === 'win' ? 'var(--steam-orange)' : 'var(--steam-blue)' }}>{h.opponent_username}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)' }}>
                      {new Date(h.ended_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {h.moves && (
                    <button onClick={() => handleOpenReplay(h)} className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      👁️ Xem lại
                    </button>
                  )}
                  <div style={{ textAlign: 'right', minWidth: '70px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: h.result === 'win' ? 'var(--steam-green-bright)' : h.result === 'draw' ? 'var(--steam-orange)' : '#e84c3d' }}>
                      {h.result === 'win' ? 'THẮNG' : h.result === 'draw' ? 'HÒA' : 'THUA'}
                    </div>
                    <div style={{ fontSize: '11px', color: h.elo_change >= 0 ? 'var(--steam-green-bright)' : '#e84c3d', fontWeight: '600' }}>
                      {h.elo_change >= 0 ? '+' : ''}{h.elo_change} Elo
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: Thành tích */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--steam-highlight)', fontSize: '15px' }}>🏅 Huy Hiệu Thành Tích</h3>
              <span style={{ fontSize: '12px', color: 'var(--steam-text-dim)' }}>
                <span style={{ color: '#f4b942', fontWeight: 'bold' }}>{unlockedCount}</span>/{achievements.length} đã đạt
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {achievements.map(ach => (
                <div key={ach.id} style={{
                  padding: '16px', borderRadius: '8px', textAlign: 'center',
                  background: ach.unlocked ? 'rgba(164,208,7,0.08)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${ach.unlocked ? 'rgba(164,208,7,0.3)' : 'var(--steam-border)'}`,
                  opacity: ach.unlocked ? 1 : 0.5,
                  transition: 'all 0.2s',
                  position: 'relative', overflow: 'hidden'
                }}>
                  {ach.unlocked && (
                    <div style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '10px', color: 'var(--steam-green-bright)' }}>✓</div>
                  )}
                  <div style={{ fontSize: '32px', marginBottom: '6px', filter: ach.unlocked ? 'none' : 'grayscale(1)' }}>{ach.icon}</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: ach.unlocked ? 'var(--steam-highlight)' : 'var(--steam-text-dim)', marginBottom: '4px' }}>
                    {ach.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)', lineHeight: '1.4' }}>
                    {ach.description}
                  </div>
                  {!ach.unlocked && (
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '6px' }}>🔒 Chưa đạt</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedMatch && (
        <ReplayModal
          isOpen={replayOpen}
          onClose={() => { setReplayOpen(false); setSelectedMatch(null); }}
          moves={selectedMatch.moves}
          opponentName={selectedMatch.opponent_username}
          result={selectedMatch.result}
        />
      )}
    </div>
  );
};

export default Profile;
