import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import GameRoom from './pages/GameRoom';
import PlayVsAI from './pages/PlayVsAI';
import PlayLocal from './pages/PlayLocal';
import Leaderboard from './pages/Leaderboard';
import Lobby from './pages/Lobby';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import useAuthStore from './states/authStore';
import { ToastContainer } from './components/Toast';

const App = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="page-wrapper">
      <ToastContainer />
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 'var(--nav-height)', background: 'var(--gradient-header)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 1000, borderBottom: '1px solid var(--steam-border)' }}>
        <Link to="/" style={{ color: 'var(--steam-highlight)', fontWeight: 'bold', fontSize: '18px' }}>
          CaroOnline
        </Link>

        <div>
          <Link to="/leaderboard" style={{ color: 'var(--steam-text-dim)', fontSize: '13px', marginRight: '16px', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--steam-highlight)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--steam-text-dim)'}
          >🏆 Xếp hạng</Link>
          <Link to="/lobby" style={{ color: 'var(--steam-text-dim)', fontSize: '13px', marginRight: '16px', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--steam-highlight)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--steam-text-dim)'}
          >🌐 Online</Link>
          {user ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px' }}>
                Xin chào,{' '}<Link to="/profile" style={{ color: 'var(--steam-blue)', fontWeight: 'bold' }}>{user.username}</Link>
                <span style={{ color: 'var(--steam-text-dim)', marginLeft: '6px' }}>(Elo: {user.elo})</span>
              </span>
              <Link to="/settings" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>⚙️</Link>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>Logout</button>
            </span>
          ) : (
            <span style={{ display: 'inline-flex', gap: '10px' }}>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>Register</Link>
            </span>
          )}
        </div>
      </header>
      
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/room/:id" element={<GameRoom />} />
          <Route path="/play-ai" element={<PlayVsAI />} />
          <Route path="/play-local" element={<PlayLocal />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
