import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../states/authStore';
import useToastStore from '../../states/toastStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Settings = () => {
  const { user, token, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

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
          fontSize: '22px', fontWeight: 'bold', color: 'white', flexShrink: 0
        }}>
          {user.username[0].toUpperCase()}
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
