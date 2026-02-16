/**
 * Toast Notification Component
 * Notificações flutuantes de sucesso/erro
 */

'use client';

import { useEffect } from 'react';

export default function Toast({ 
  message, 
  type = 'success', 
  duration = 3000,
  onClose 
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: {
      background: '#22c55e',
      icon: '✓',
      border: '#16a34a'
    },
    error: {
      background: '#dc2626',
      icon: '✕',
      border: '#b91c1c'
    },
    warning: {
      background: '#f59e0b',
      icon: '⚠',
      border: '#d97706'
    },
    info: {
      background: '#3b82f6',
      icon: 'ℹ',
      border: '#2563eb'
    }
  };

  const style = styles[type] || styles.success;

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      minWidth: '300px',
      padding: '1rem 1.5rem',
      borderRadius: '0.5rem',
      background: style.background,
      border: `2px solid ${style.border}`,
      color: '#fff',
      fontWeight: '500',
      zIndex: 9999,
      animation: 'slideIn 0.3s ease-out',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
    }}>
      <span style={{ fontSize: '1.25rem' }}>{style.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          color: '#fff',
          borderRadius: '0.25rem',
          padding: '0.25rem 0.5rem',
          cursor: 'pointer',
          fontSize: '0.875rem'
        }}
      >
        ✕
      </button>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
