import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const MESSAGES = [
  'Nước đi này không tồn tại! ♟️',
  'Quân cờ đã rời bàn cờ... 🎲',
  'Trang này đã bị ăn mất rồi! 😱',
  'Ô trống không hợp lệ! ❌',
];

const NotFound = () => {
  const [msg] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
    }}>
      {/* Animated 404 */}
      <div style={{
        fontSize: '120px',
        fontWeight: '900',
        lineHeight: 1,
        marginBottom: '24px',
        background: 'linear-gradient(135deg, var(--steam-blue), var(--steam-orange))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'fadeIn 0.5s ease',
        userSelect: 'none',
      }}>
        404
      </div>

      {/* Board grid decoration */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 32px)',
        gridTemplateRows: 'repeat(3, 32px)',
        gap: '2px',
        marginBottom: '32px',
        opacity: 0.4,
      }}>
        {['X','O','X','O','X','O','X','O','X','O','X','O','X','O','X'].map((s, i) => (
          <div key={i} style={{
            width: '32px', height: '32px',
            background: 'var(--steam-card-bg)',
            border: '1px solid var(--steam-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 'bold',
            color: s === 'X' ? 'var(--steam-blue)' : 'var(--steam-orange)',
            animation: `pop-in ${0.1 + i * 0.05}s ease`,
          }}>
            {s}
          </div>
        ))}
      </div>

      <h1 style={{
        fontSize: '22px',
        fontWeight: '700',
        color: 'var(--steam-highlight)',
        margin: '0 0 10px',
      }}>
        Trang không tìm thấy!
      </h1>
      <p style={{
        color: 'var(--steam-text-dim)',
        fontSize: '14px',
        margin: '0 0 8px',
        maxWidth: '380px',
      }}>
        {msg}
      </p>
      <p style={{ color: 'var(--steam-text-dim)', fontSize: '13px', margin: '0 0 32px' }}>
        Đang tìm đường về{dots}
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" className="btn btn-primary" style={{ padding: '11px 24px', fontSize: '14px' }}>
          🏠 Về Trang Chủ
        </Link>
        <Link to="/lobby" className="btn btn-secondary" style={{ padding: '11px 24px', fontSize: '14px' }}>
          🌐 Vào Lobby
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
