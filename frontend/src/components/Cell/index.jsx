import React from 'react';

const Cell = ({ value, onClick, disabled, highlighted }) => {
  let color = 'var(--steam-text)';
  let glow = 'none';

  if (value === 'X') {
    color = highlighted ? '#fff' : 'var(--steam-blue)';
    glow = highlighted ? '0 0 12px #57cbde' : 'var(--shadow-glow-blue)';
  } else if (value === 'O') {
    color = highlighted ? '#fff' : 'var(--steam-orange)';
    glow = highlighted ? '0 0 12px #e87c23' : '0 0 10px rgba(232, 124, 35, 0.3)';
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '30px',
        height: '30px',
        background: highlighted ? 'rgba(255, 215, 0, 0.25)' : 'var(--steam-card-bg)',
        border: highlighted ? '1px solid rgba(255, 215, 0, 0.6)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: 'bold',
        color: color,
        textShadow: glow,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !highlighted) e.currentTarget.style.background = 'var(--steam-border)';
      }}
      onMouseLeave={(e) => {
        if (!disabled && !highlighted) e.currentTarget.style.background = 'var(--steam-card-bg)';
      }}
    >
      {value}
    </button>
  );
};

export default Cell;
