import React from 'react';
import useToastStore from '../../states/toastStore';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info':
      default: return 'ℹ️';
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`toast-item toast-${toast.type}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>{getIcon(toast.type)}</span>
            <span>{toast.message}</span>
          </div>
          <button 
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
