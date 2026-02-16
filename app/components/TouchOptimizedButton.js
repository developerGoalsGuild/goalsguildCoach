/**
 * TouchOptimizedButton Component
 * Botões otimizados para touch/mobile
 */

'use client';

import { useState } from 'react';

export default function TouchOptimizedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  ...props
}) {
  const [pressed, setPressed] = useState(false);

  const variants = {
    primary: {
      background: '#f59e0b',
      color: '#000',
      border: 'none'
    },
    secondary: {
      background: '#1f2937',
      color: '#d1d5db',
      border: '1px solid #374151'
    },
    danger: {
      background: '#dc2626',
      color: '#fff',
      border: 'none'
    },
    success: {
      background: '#22c55e',
      color: '#fff',
      border: 'none'
    },
    ghost: {
      background: 'transparent',
      color: '#d1d5db',
      border: '1px solid #374151'
    }
  };

  const sizes = {
    small: {
      padding: '0.5rem 1rem',
      fontSize: '0.75rem',
      minHeight: '40px'
    },
    medium: {
      padding: '0.75rem 1.5rem',
      fontSize: '0.875rem',
      minHeight: '48px'
    },
    large: {
      padding: '1rem 2rem',
      fontSize: '1rem',
      minHeight: '56px'
    }
  };

  const baseStyle = {
    borderRadius: '0.5rem',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-out',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    ...variants[variant],
    ...sizes[size]
  };

  const activeStyle = {
    transform: 'scale(0.97)',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
  };

  const disabledStyle = {
    opacity: 0.5,
    cursor: 'not-allowed'
  };

  const loadingStyle = {
    opacity: 0.7,
    cursor: 'wait'
  };

  const handleClick = (e) => {
    if (disabled || loading) return;
    
    // Feedback tátil (se suportado)
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      onClick={handleClick}
      onTouchStart={() => !disabled && !loading && setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      disabled={disabled || loading}
      style={{
        ...baseStyle,
        ...(pressed ? activeStyle : {}),
        ...(disabled ? disabledStyle : {}),
        ...(loading ? loadingStyle : {}),
        ...style
      }}
      {...props}
    >
      {loading && (
        <span style={{
          animation: 'spin 1s linear infinite',
          display: 'inline-block'
        }}>
          ⏳
        </span>
      )}
      {children}
    </button>
  );

  TouchOptimizedButton.defaultProps = {
    variant: 'primary',
    size: 'medium',
    disabled: false,
    loading: false
  };
}
