import React, { useState } from 'react';

/**
 * Cell component nâng cao:
 * - Hover preview: hiện quân X/O mờ khi hover vào ô trống
 * - Pop-in animation khi đặt quân
 * - Winning cells: glow pulse animation
 */
const Cell = ({ value, onClick, disabled, highlighted, currentSymbol }) => {
  const [hovered, setHovered] = useState(false);

  let color = 'var(--steam-text)';
  let glow = 'none';
  let bg = highlighted ? 'rgba(255, 215, 0, 0.2)' : 'var(--steam-card-bg)';
  let border = highlighted ? '1px solid rgba(255, 215, 0, 0.5)' : 'none';
  let animation = '';

  if (value === 'X') {
    color = highlighted ? '#fff' : 'var(--steam-blue)';
    glow = highlighted
      ? '0 0 16px #57cbde, 0 0 32px rgba(87,203,222,0.4)'
      : '0 0 10px rgba(87,203,222,0.4)';
    animation = highlighted ? 'win-pulse 1.2s ease-in-out infinite' : 'pop-in 0.15s cubic-bezier(0.34,1.56,0.64,1)';
  } else if (value === 'O') {
    color = highlighted ? '#fff' : 'var(--steam-orange)';
    glow = highlighted
      ? '0 0 16px #e87c23, 0 0 32px rgba(232,124,35,0.4)'
      : '0 0 8px rgba(232,124,35,0.3)';
    animation = highlighted ? 'win-pulse 1.2s ease-in-out infinite' : 'pop-in 0.15s cubic-bezier(0.34,1.56,0.64,1)';
  }

  // Hover preview
  const showPreview = hovered && !value && !disabled && currentSymbol;
  const previewColor = currentSymbol === 'X' ? 'rgba(87,203,222,0.35)' : 'rgba(232,124,35,0.35)';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '30px',
        height: '30px',
        background: hovered && !value && !disabled
          ? (currentSymbol === 'X' ? 'rgba(87,203,222,0.12)' : 'rgba(232,124,35,0.12)')
          : bg,
        border,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: 'bold',
        color: showPreview ? previewColor : color,
        textShadow: glow,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.1s, color 0.1s',
        animation: value ? animation : 'none',
        outline: 'none',
        position: 'relative',
      }}
    >
      {showPreview ? currentSymbol : value}
    </button>
  );
};

export default Cell;
