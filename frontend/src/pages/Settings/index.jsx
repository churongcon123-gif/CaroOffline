import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../states/authStore';
import useToastStore from '../../states/toastStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Settings = () => {
  const { user, token, logout, updateUserElo } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(localStorage.getItem('sound_enabled') !== 'false');

  const AVATARS = ['🦊', '🐱', '🐶', '🐼', '🦁', '🐯', '🐨', '🦄', '🦖', '🐙', '👾', '🤖', '🥷', '🧑‍🚀'];
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || '🦊');

  const handleSaveAvatar = async (avatar) => {
    try {
      const res = await fetch(`${API}/api/auth/change-avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ avatar }),
      });
      const data = await res.json();
      if (!res.ok) throw { error: data.error };
      addToast('Cập nhật ảnh đại diện thành công!', 'success');
      updateUserElo(data.user);
      setSelectedAvatar(avatar);
    } catch (err) {
      addToast(err.error || 'Đổi avatar thất bại. Thử lại!', 'error');
    }
  };

  const handleToggleSound = (e) => {
    const val = e.target.checked;
    setSoundEnabled(val);
    localStorage.setItem('sound_enabled', val ? 'true' : 'false');
    addToast(`Đã ${val ? 'BẬT' : 'TẮT'} âm thanh trò chơi!`, 'info');
  };

  if (!user) { navigate('/login'); return null; }

  const strength = newPassword.length === 0 ? 0
    : newPassword.length < 6 ? 1
    : newPassword.length < 10 ? 2 : 3;
  const strengthColor = ['transparent', '#e84c3d', '#f4b942', 'var(--steam-green-bright)'][strength];
  const strengthLabel = ['', 'Yếu', 'Trung bình', 'Mạnh'][strength];

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNew) {
      addToast('Vui lòng điền đầy đủ thông tin!', 'warning'); return;
    }
    if (newPassword.length < 6) {
      addToast('Mật khẩu mới phải ít nhất 6 ký tự!', 'warning'); return;
    }
    if (newPassword !== confirmNew) {
      addToast('Mật khẩu xác nhận không khớp!', 'error'); return;
    }
    if (newPassword === currentPassword) {
      addToast('Mật khẩu mới phải khác mật khẩu hiện tại!', 'warning'); return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw { error: data.error };
      addToast('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.', 'success', 4000);
      setCurrentPassword(''); setNewPassword(''); setConfirmNew('');
      setTimeout(() => { logout(); navigate('/login'); }, 2000);
    } catch (err) {
      addToast(err.error || 'Có lỗi xảy ra. Thử lại!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    addToast('Đã đăng xuất. Hẹn gặp lại! 👋', 'info');
    navigate('/login');
  };

  return (
    <div className="container fade-in" style={{ padding: '40px 16px', maxWidth: '560px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to="/" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>← Trang chủ</Link>
        <h2 style={{ margin: 0, color: 'var(--steam-highlight)', fontSize: '22px' }}>⚙️ Cài Đặt Tài Khoản</h2>
      </div>

      {/* Profile summary */}
      <div style={{
        background: 'var(--steam-card-bg)', borderRadius: '8px',
        border: '1px solid var(--steam-border)', padding: '20px',
        marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px'
      }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--steam-blue), var(--steam-orange))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', userSelect: 'none', flexShrink: 0,
          border: '1px solid var(--steam-border)'
        }}>
          {user.avatar || user.username[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 'bold', color: 'var(--steam-highlight)', fontSize: '16px' }}>{user.username}</div>
          <div style={{ fontSize: '12px', color: 'var(--steam-text-dim)', marginTop: '2px' }}>
            Elo: <span style={{ color: '#c6a614', fontWeight: 'bold' }}>{user.elo}</span>
            {' · '}
            <Link to="/profile" style={{ color: 'var(--steam-blue)', fontSize: '12px' }}>Xem Profile</Link>
          </div>
        </div>
      </div>

      {/* Avatar Selector */}
      <div style={{
        background: 'var(--steam-card-bg)', borderRadius: '8px',
        border: '1px solid var(--steam-border)', padding: '24px',
        marginBottom: '16px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--steam-blue), var(--steam-green-bright))' }} />
        
        <h3 style={{ margin: '0 0 16px', color: 'var(--steam-highlight)', fontSize: '15px' }}>
          🎭 Chọn Ảnh Đại Diện
        </h3>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--steam-blue), var(--steam-orange))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', userSelect: 'none', border: '2px solid var(--steam-border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)', flexShrink: 0
          }}>
            {selectedAvatar}
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--steam-highlight)', fontWeight: 'bold' }}>Mẫu ảnh đại diện</div>
            <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)', marginTop: '3px' }}>Nhấp chọn một biểu tượng bên dưới để thay đổi ngay lập tức.</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {AVATARS.map(av => (
            <button
              key={av}
              onClick={() => handleSaveAvatar(av)}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: selectedAvatar === av ? 'rgba(42,122,186,0.3)' : 'rgba(0,0,0,0.2)',
                border: `2px solid ${selectedAvatar === av ? 'var(--steam-blue)' : 'var(--steam-border)'}`,
                fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.15s', outline: 'none'
              }}
              onMouseEnter={e => { if (selectedAvatar !== av) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (selectedAvatar !== av) e.currentTarget.style.background = 'rgba(0,0,0,0.2)'; }}
            >
              {av}
            </button>
          ))}
        </div>
      </div>

      {/* Sound settings */}
      <div style={{
        background: 'var(--steam-card-bg)', borderRadius: '8px',
        border: '1px solid var(--steam-border)', padding: '20px',
        marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontWeight: 'bold', color: 'var(--steam-highlight)', fontSize: '15px' }}>🔊 Âm thanh trò chơi</div>
          <div style={{ fontSize: '11px', color: 'var(--steam-text-dim)', marginTop: '4px' }}>Bật/Tắt hiệu ứng âm thanh đặt cờ, chat, đếm ngược...</div>
        </div>
        <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={handleToggleSound}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span style={{
            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: soundEnabled ? 'var(--steam-green-bright)' : '#4f5b66',
            transition: '.3s', borderRadius: '24px'
          }}>
            <span style={{
              position: 'absolute', content: '""', height: '18px', width: '18px', left: soundEnabled ? '24px' : '4px', bottom: '3px',
              backgroundColor: 'white', transition: '.3s', borderRadius: '50%'
            }} />
          </span>
        </label>
      </div>

      {/* Change Password */}
      <div style={{
        background: 'var(--steam-card-bg)', borderRadius: '8px',
        border: '1px solid var(--steam-border)', padding: '24px',
        marginBottom: '16px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--steam-blue), var(--steam-orange))' }} />

        <h3 style={{ margin: '0 0 20px', color: 'var(--steam-highlight)', fontSize: '15px' }}>
          🔒 Đổi Mật Khẩu
        </h3>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Current */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--steam-text-dim)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Mật khẩu hiện tại
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại..."
                style={{ width: '100%', padding: '10px 42px 10px 14px', boxSizing: 'border-box', background: 'var(--steam-darker-bg)', border: '1px solid var(--steam-border)', color: 'var(--steam-highlight)', borderRadius: '4px', outline: 'none', fontSize: '14px' }}
                onFocus={e => e.target.style.borderColor = 'var(--steam-blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--steam-border)'}
              />
              <button type="button" onClick={() => setShowCurrent(s => !s)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--steam-text-dim)' }}>
                {showCurrent ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* New */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: 'var(--steam-text-dim)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span>Mật khẩu mới</span>
              {newPassword.length > 0 && <span style={{ color: strengthColor, textTransform: 'none' }}>{strengthLabel}</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                style={{ width: '100%', padding: '10px 42px 10px 14px', boxSizing: 'border-box', background: 'var(--steam-darker-bg)', border: '1px solid var(--steam-border)', color: 'var(--steam-highlight)', borderRadius: '4px', outline: 'none', fontSize: '14px' }}
                onFocus={e => e.target.style.borderColor = 'var(--steam-blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--steam-border)'}
              />
              <button type="button" onClick={() => setShowNew(s => !s)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--steam-text-dim)' }}>
                {showNew ? '🙈' : '👁️'}
              </button>
            </div>
            {newPassword.length > 0 && (
              <div style={{ marginTop: '5px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: `${strength * 33}%`, background: strengthColor, borderRadius: '2px', transition: 'width 0.3s' }} />
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--steam-text-dim)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmNew}
              onChange={e => setConfirmNew(e.target.value)}
              placeholder="Nhập lại mật khẩu mới..."
              style={{
                width: '100%', padding: '10px 14px', boxSizing: 'border-box',
                background: 'var(--steam-darker-bg)',
                border: `1px solid ${confirmNew && confirmNew !== newPassword ? '#e84c3d' : confirmNew && confirmNew === newPassword ? 'var(--steam-green)' : 'var(--steam-border)'}`,
                color: 'var(--steam-highlight)', borderRadius: '4px', outline: 'none', fontSize: '14px'
              }}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center', padding: '11px', opacity: loading ? 0.7 : 1 }}>
            {loading ? '⏳ Đang lưu...' : '💾 Lưu mật khẩu mới'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div style={{
        background: 'rgba(232,76,61,0.08)', borderRadius: '8px',
        border: '1px solid rgba(232,76,61,0.3)', padding: '20px'
      }}>
        <h3 style={{ margin: '0 0 12px', color: '#e84c3d', fontSize: '14px' }}>⚠️ Khu vực nguy hiểm</h3>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ borderColor: '#e84c3d', color: '#e84c3d', width: '100%', justifyContent: 'center' }}>
          🚪 Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Settings;
