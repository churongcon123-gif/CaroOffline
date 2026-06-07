import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/authApi';
import useAuthStore from '../../states/authStore';
import useToastStore from '../../states/toastStore';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const validate = () => {
    if (!username.trim() || !password || !confirmPassword) {
      addToast('Vui lòng điền đầy đủ thông tin!', 'warning');
      return false;
    }
    if (username.trim().length < 3 || username.trim().length > 20) {
      addToast('Tên đăng nhập phải từ 3–20 ký tự!', 'warning');
      return false;
    }
    if (/\s/.test(username)) {
      addToast('Tên đăng nhập không được chứa khoảng trắng!', 'warning');
      return false;
    }
    if (password.length < 6) {
      addToast('Mật khẩu phải ít nhất 6 ký tự!', 'warning');
      return false;
    }
    if (password !== confirmPassword) {
      addToast('Mật khẩu xác nhận không khớp!', 'error');
      return false;
    }
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await registerUser(username.trim(), password);
      addToast('Đăng ký thành công! Đang chuyển đến trang đăng nhập...', 'success', 3000);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      addToast(err.error || 'Đăng ký thất bại. Thử lại!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : 3;
  const strengthColor = ['transparent', '#e84c3d', '#f4b942', 'var(--steam-green-bright)'][strength];
  const strengthLabel = ['', 'Yếu', 'Trung bình', 'Mạnh'][strength];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'radial-gradient(ellipse at top, #1a2d44 0%, var(--steam-darker-bg) 60%)'
    }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎮</div>
          <h1 style={{
            fontSize: '28px', fontWeight: '900', margin: '0 0 6px',
            background: 'linear-gradient(135deg, var(--steam-blue), var(--steam-orange))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Tạo Tài Khoản</h1>
          <p style={{ color: 'var(--steam-text-dim)', fontSize: '13px', margin: 0 }}>
            Tham gia cộng đồng CaroOnline
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--steam-card-bg)',
          borderRadius: '8px',
          border: '1px solid var(--steam-border)',
          padding: '28px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, var(--steam-green-bright), var(--steam-blue))'
          }} />

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--steam-text-dim)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tên đăng nhập <span style={{ color: 'var(--steam-text-dim)', fontWeight: 400 }}>(3–20 ký tự)</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập..."
                maxLength={20}
                style={{
                  width: '100%', padding: '10px 14px', boxSizing: 'border-box',
                  background: 'var(--steam-darker-bg)', border: '1px solid var(--steam-border)',
                  color: 'var(--steam-highlight)', borderRadius: '4px', outline: 'none', fontSize: '14px',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--steam-blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--steam-border)'}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: 'var(--steam-text-dim)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>Mật khẩu <span style={{ fontWeight: 400 }}>(tối thiểu 6 ký tự)</span></span>
                {password.length > 0 && (
                  <span style={{ color: strengthColor, textTransform: 'none', fontWeight: 600 }}>{strengthLabel}</span>
                )}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  style={{
                    width: '100%', padding: '10px 42px 10px 14px', boxSizing: 'border-box',
                    background: 'var(--steam-darker-bg)', border: '1px solid var(--steam-border)',
                    color: 'var(--steam-highlight)', borderRadius: '4px', outline: 'none', fontSize: '14px',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--steam-blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--steam-border)'}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--steam-text-dim)', cursor: 'pointer', fontSize: '16px' }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div style={{ marginTop: '6px', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: `${strength * 33}%`, background: strengthColor, borderRadius: '2px', transition: 'width 0.3s, background 0.3s' }} />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--steam-text-dim)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Xác nhận mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu..."
                  style={{
                    width: '100%', padding: '10px 42px 10px 14px', boxSizing: 'border-box',
                    background: 'var(--steam-darker-bg)',
                    border: `1px solid ${confirmPassword && confirmPassword !== password ? '#e84c3d' : confirmPassword && confirmPassword === password ? 'var(--steam-green)' : 'var(--steam-border)'}`,
                    color: 'var(--steam-highlight)', borderRadius: '4px', outline: 'none', fontSize: '14px',
                    transition: 'border-color 0.2s'
                  }}
                />
                <button type="button" onClick={() => setShowConfirm(s => !s)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--steam-text-dim)', cursor: 'pointer', fontSize: '16px' }}>
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-green"
              style={{
                width: '100%', justifyContent: 'center', padding: '12px',
                fontSize: '14px', marginTop: '4px',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(75,176,34,0.3)'
              }}
            >
              {loading ? '⏳ Đang tạo tài khoản...' : '✨ Tạo tài khoản'}
            </button>
          </form>

          <div style={{
            marginTop: '20px', paddingTop: '16px',
            borderTop: '1px solid var(--steam-border)',
            textAlign: 'center', fontSize: '13px', color: 'var(--steam-text-dim)'
          }}>
            Đã có tài khoản?{' '}
            <Link to="/login" style={{ color: 'var(--steam-blue)', fontWeight: '600' }}>
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
