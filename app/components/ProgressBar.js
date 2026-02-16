/**
 * Progress Bar Component
 * Barras de progresso visuais com animação
 */

'use client';

import Link from 'next/link';

export default function ProgressBar({ 
  progress, 
  showPercentage = true, 
  size = 'medium',
  animated = true 
}) {
  const percentage = Math.min(100, Math.max(0, progress));

  const height = size === 'small' ? '8px' : size === 'large' ? '16px' : '12px';
  const fontSize = size === 'small' ? '0.75rem' : size === 'large' ? '1.125rem' : '0.875rem';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ flex: 1 }}>
        <div style={{ 
          marginBottom: '0.25rem', 
          fontSize: fontSize, 
          fontWeight: '500', 
          color: '#d1d5db' 
        }}>
          {showPercentage && (
            <span style={{ fontWeight: '600', color: percentage === 100 ? '#22c55e' : '#fbbf24' }}>
              {percentage}%
            </span>
          )}
        </div>
        
        <div style={{ 
          height, 
          background: '#374151', 
          borderRadius: '6px', 
          overflow: 'hidden', 
          width: '100%'
        }}>
          <div 
            style={{
              height: '100%',
              width: `${percentage}%`,
              background: percentage === 100 
                ? 'linear-gradient(90deg, #22c55e, #10b981)' 
                : 'linear-gradient(90deg, #fbbf24, #f59e0b)',
              borderRadius: '6px',
              transition: animated ? 'width 0.3s ease-out' : 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
}
