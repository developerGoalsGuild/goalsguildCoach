/**
 * Tooltip Component
 * Explicações ao passar o mouse
 */

'use client';

import { useState } from 'react';

export default function Tooltip({ children, text, position = 'top' }) {
  const [show, setShow] = useState(false);

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      
      {show && (
        <div style={{
          position: 'absolute',
          [position]: '1.25rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1f2937',
          color: '#d1d5db',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          maxWidth: '250px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          whiteSpace: 'normal',
          lineHeight: '1.4',
          marginTop: position === 'top' ? '0.5rem' : '0',
          marginBottom: position === 'bottom' ? '0.5rem' : '0'
        }}>
          {text}
        </div>
      )}
    </div>
  );
}
