import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../api/authApi';
import useAuthStore from '../../states/authStore';
import useToastStore from '../../states/toastStore';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth, user } = useAuthStore();
  const { addToast } = useToastStore();

  // Auto redirect nếu đã đăng nhập
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      addToast('Vui lòng điền đầy đủ thông tin!', 'warning');
      return;
    }
    setLoading(true);
    try {
      const data = await loginUser(username.trim(), password);
      setAuth(data.user, data.token);
      addToast(`Chào mừng trở lại, ${data.user.username}! 🎉`, 'success');
      navigate('/');
    } catch (err) {
      addToast(err.error || 'Đăng nhập thất bại. Thử lại!', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'radial-gradient(ellipse at top, #1a2d44 0%, var(--steam-darker-bg) 60%)'
    }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo / Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>♟️</div>
          <h1 style={{
            fontSize: '28px', fontWeight: '900', margin: '0 0 6px',
            background: 'linear-gradient(135deg, var(--steam-blue), var(--steam-orange))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>CaroOnline</h1>
          <p style={{ color: 'var(--steam-text-dim)', fontSize: '13px', margin: 0 }}>
            Đăng nhập để tiếp tục
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
          {/* Top accent bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, var(--steam-blue), var(--steam-orange))'
          }} />

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--steam-text-dim)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập..."
                autoComplete="username"
                style={{
                  width: '100%', padding: '10px 14px', boxSizing: 'border-box',
                  background: 'var(--steam-darker-bg)',
                  border: '1px solid var(--steam-border)',
                  color: 'var(--steam-highlight)',
                  borderRadius: '4px', outline: 'none', fontSize: '14px',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--steam-blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--steam-border)'}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--steam-text-dim)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '10px 42px 10px 14px', boxSizing: 'border-box',
                    background: 'var(--steam-darker-bg)',
                    border: '1px solid var(--steam-border)',
                    color: 'var(--steam-highlight)',
                    borderRadius: '4px', outline: 'none', fontSize: '14px',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--steam-blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--steam-border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--steam-text-dim)',
                    cursor: 'pointer', fontSize: '16px', padding: '2px',
                    transition: 'color 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--steam-highlight)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--steam-text-dim)'}
                  title={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%', justifyContent: 'center', padding: '12px',
                fontSize: '14px', marginTop: '4px',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(77,142,178,0.3)'
              }}
            >
              {loading ? '⏳ Đang đăng nhập...' : '🔑 Đăng nhập'}
            </button>
          </form>

          <div style={{
            marginTop: '20px', paddingTop: '16px',
            borderTop: '1px solid var(--steam-border)',
            textAlign: 'center', fontSize: '13px', color: 'var(--steam-text-dim)'
          }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" style={{ color: 'var(--steam-blue)', fontWeight: '600' }}>
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
