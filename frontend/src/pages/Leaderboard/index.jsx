import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../states/authStore';
import { getLeaderboardApi } from '../../api/gameApi';

// Màu huy chương và hạng
const RANK_STYLES = {
  1: { bg: 'linear-gradient(135deg,#c6a614,#f0c040)', color: '#1a1200', icon: '🥇', glow: 'rgba(198,166,20,0.4)' },
  2: { bg: 'linear-gradient(135deg,#8a9bb5,#c0cbd8)', color: '#111', icon: '🥈', glow: 'rgba(192,203,216,0.3)' },
  3: { bg: 'linear-gradient(135deg,#c87533,#e8964a)', color: '#1a0a00', icon: '🥉', glow: 'rgba(200,117,51,0.35)' },
};

// Badge độ khó dựa trên Elo
function getEloBadge(elo) {
  if (elo >= 1600) return { label: 'Chuyên Gia', color: '#e84c3d', bg: 'rgba(232,76,61,0.15)' };
  if (elo >= 1400) return { label: 'Khó', color: '#e87c23', bg: 'rgba(232,124,35,0.15)' };
  if (elo >= 1200) return { label: 'Trung Bình', color: '#f4b942', bg: 'rgba(244,185,66,0.15)' };
  return { label: 'Dễ', color: '#57cbde', bg: 'rgba(87,203,222,0.15)' };
}

const Leaderboard = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myRank, setMyRank] = useState(null);
  
  // Phân trang
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [globalMaxElo, setGlobalMaxElo] = useState(2000);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await getLeaderboardApi(page, 10);
        setData(res.leaderboard);
        setTotalPages(res.totalPages || 1);
        setTotalUsers(res.totalUsers || 0);

        if (page === 1 && res.leaderboard.length > 0) {
          setGlobalMaxElo(res.leaderboard[0].elo || 2000);
        }

        if (user) {
          const found = res.leaderboard.find(p => p.username === user.username);
          if (found) setMyRank(found);
        }
      } catch (e) {
        setError('Không thể tải bảng xếp hạng. Thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [user, page]);

  return (
    <div className="container fade-in" style={{ padding: '32px 16px', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏆</div>
        <h1 style={{
          fontSize: '32px', fontWeight: '900', margin: '0 0 8px',
          background: 'linear-gradient(135deg, #c6a614, #f0c040, #e87c23)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
        }}>
          Bảng Xếp Hạng
        </h1>
        <p style={{ color: 'var(--steam-text-dim)', fontSize: '14px' }}>
          Xem danh sách kỳ thủ hàng đầu — thi đấu trực tuyến để tích lũy Elo!
        </p>
      </div>

      {/* My rank card (nếu đăng nhập) */}
      {user && myRank && (
        <div style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(102,192,244,0.08), rgba(102,192,244,0.03))',
          border: '1px solid rgba(102,192,244,0.35)',
          borderRadius: '8px', padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
          boxShadow: '0 0 20px rgba(102,192,244,0.1)',
        }}>
          <div style={{ fontSize: '13px', color: 'var(--steam-text-dim)', minWidth: 80 }}>Xếp hạng của bạn</div>
          <div style={{ fontWeight: '900', fontSize: '26px', color: 'var(--steam-blue)', minWidth: 50 }}>
            #{myRank.rank}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', color: 'var(--steam-highlight)', fontSize: '16px' }}>{myRank.username}</div>
            <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)' }}>
              {myRank.matches_played} trận · {myRank.wins}W / {myRank.losses}L
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '900', fontSize: '22px', color: '#c6a614' }}>{myRank.elo}</div>
            <div style={{ fontSize: '11px', color: myRank.win_rate >= 50 ? 'var(--steam-green-bright)' : '#e84c3d' }}>
              {myRank.win_rate}% Thắng
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '56px', borderRadius: '6px' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{
          background: 'rgba(226,0,26,0.08)', border: '1px solid var(--steam-red)',
          borderRadius: '6px', padding: '20px', textAlign: 'center', color: 'var(--steam-red)',
        }}>
          ⚠️ {error}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--steam-card-bg)', borderRadius: '8px', border: '1px solid var(--steam-border)', overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '60px 1fr 120px 120px 120px 90px',
              padding: '10px 20px', background: 'rgba(42,71,94,0.6)',
              borderBottom: '1px solid var(--steam-border)',
              fontSize: '11px', fontWeight: '700', color: 'var(--steam-text-dim)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              <span>Hạng</span>
              <span>Người chơi</span>
              <span style={{ textAlign: 'right', paddingRight: '20px' }}>Elo</span>
              <span style={{ textAlign: 'center' }}>Thắng / Thua</span>
              <span style={{ textAlign: 'center' }}>Số trận</span>
              <span style={{ textAlign: 'right' }}>Tỉ lệ thắng</span>
            </div>

            {/* Rows */}
            {data.map((player, idx) => {
              const rank = Number(player.rank);
              const rs = RANK_STYLES[rank];
              const badge = getEloBadge(player.elo);
              const isMe = user && player.username === user.username;
              const winRate = Number(player.win_rate);

              // Tỉ lệ Elo so với Elo cao nhất
              const eloBarWidth = Math.max(10, Math.min(100, (player.elo / globalMaxElo) * 100));

              return (
                <div
                  key={player.username}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 120px 120px 120px 90px',
                    padding: '14px 20px',
                    alignItems: 'center',
                    borderBottom: idx < data.length - 1 ? '1px solid rgba(42,63,90,0.5)' : 'none',
                    background: isMe
                      ? 'rgba(102,192,244,0.06)'
                      : rank <= 3
                      ? `rgba(0,0,0,0.15)`
                      : 'transparent',
                    transition: 'background 0.15s',
                    boxShadow: isMe ? 'inset 3px 0 0 var(--steam-blue)' : rank <= 3 ? `inset 3px 0 0 ${rs?.glow?.replace('rgba', 'rgb')?.replace(',0.4)', ')').replace(',0.3)', ')').replace(',0.35)', ')')}` : 'none',
                  }}
                  onMouseEnter={e => { if (!isMe) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isMe ? 'rgba(102,192,244,0.06)' : rank <= 3 ? 'rgba(0,0,0,0.15)' : 'transparent'; }}
                >
                  {/* Rank */}
                  <div>
                    {rs ? (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, borderRadius: '50%',
                        background: rs.bg, color: rs.color,
                        fontWeight: '900', fontSize: '13px',
                        boxShadow: `0 0 12px ${rs.glow}`,
                      }}>
                        {rs.icon}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--steam-text-dim)', fontWeight: '600', fontSize: '15px' }}>
                        #{rank}
                      </span>
                    )}
                  </div>

                  {/* Username + badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div>
                      <div style={{
                        fontWeight: isMe ? '700' : '500',
                        color: isMe ? 'var(--steam-blue)' : 'var(--steam-highlight)',
                        fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {player.username}{isMe && <span style={{ color: 'var(--steam-text-dim)', fontWeight: 400, fontSize: '12px' }}> (bạn)</span>}
                      </div>
                      <span style={{
                        display: 'inline-block', fontSize: '10px', fontWeight: '700',
                        padding: '1px 7px', borderRadius: '20px', marginTop: '2px',
                        background: badge.bg, color: badge.color, border: `1px solid ${badge.color}44`,
                      }}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Elo & Elo Bar */}
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: '20px' }}>
                    <div style={{ fontWeight: '900', fontSize: '18px', color: '#c6a614' }}>
                      {player.elo}
                    </div>
                    {/* Elo progress bar relative to max Elo */}
                    <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${eloBarWidth}%`,
                        background: 'linear-gradient(90deg, #c6a614 0%, #f0c040 100%)',
                        borderRadius: '2px',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>

                  {/* W/L */}
                  <div style={{ textAlign: 'center', fontSize: '13px' }}>
                    <span style={{ color: 'var(--steam-green-bright)', fontWeight: '700' }}>{player.wins}W</span>
                    {' / '}
                    <span style={{ color: '#e84c3d', fontWeight: '700' }}>{player.losses}L</span>
                  </div>

                  {/* Matches */}
                  <div style={{ textAlign: 'center', color: 'var(--steam-text-dim)', fontSize: '13px' }}>
                    {player.matches_played}
                  </div>

                  {/* Win rate */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: winRate >= 60 ? 'var(--steam-green-bright)' : winRate >= 40 ? '#f4b942' : '#e84c3d' }}>
                      {winRate}%
                    </div>
                    {/* Mini win rate bar */}
                    <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '4px' }}>
                      <div style={{
                        height: '100%', width: `${winRate}%`, borderRadius: '2px',
                        background: winRate >= 60 ? 'var(--steam-green-bright)' : winRate >= 40 ? '#f4b942' : '#e84c3d',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sleek Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'var(--steam-card-bg)',
              borderRadius: '8px',
              border: '1px solid var(--steam-border)',
              marginTop: '4px'
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary"
                style={{ opacity: page === 1 ? 0.4 : 1, padding: '6px 12px', fontSize: '12px' }}
              >
                ◀ Trang trước
              </button>

              <span style={{ fontSize: '13px', color: 'var(--steam-text-dim)' }}>
                Trang <strong style={{ color: 'var(--steam-highlight)' }}>{page}</strong> / <strong>{totalPages}</strong> (Tổng cộng {totalUsers} người chơi)
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary"
                style={{ opacity: page === totalPages ? 0.4 : 1, padding: '6px 12px', fontSize: '12px' }}
              >
                Trang sau ▶
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bottom CTA */}
      {!loading && !error && (
        <div style={{ textAlign: 'center', marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {user ? (
            <Link to="/play-ai" className="btn btn-primary">⚔️ Đánh Với AI để leo hạng</Link>
          ) : (
            <Link to="/login" className="btn btn-primary">🔑 Đăng nhập để tham gia xếp hạng</Link>
          )}
          <Link to="/" className="btn btn-secondary">← Về Trang Chủ</Link>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
