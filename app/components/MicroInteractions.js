/**
 * Micro-interactions Component
 * Transições e animações sutis para melhorar UX
 */

'use client';

import { useState } from 'react';

export function withMicroInteractions(Component) {
  return function EnhancedComponent(props) {
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const [pressed, setPressed] = useState(false);

    const enhancedProps = {
      ...props,
      style: {
        transition: 'all 0.2s ease-out',
        transform: hovered ? 'scale(1.02)' : focused ? 'scale(1.01)' : pressed ? 'scale(0.99)' : 'scale(1)',
        boxShadow: hovered 
          ? '0 8px 16px rgba(0, 0, 0, 0.3)' 
          : focused 
            ? '0 4px 12px rgba(0, 0, 0, 0.2)'
            : pressed
              ? '0 2px 8px rgba(0, 0, 0, 0.15)'
              : 'none',
        cursor: 'pointer',
        ...props.style
      },
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => {
        setHovered(false);
        setPressed(false);
      },
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      onMouseDown: () => setPressed(true),
      onMouseUp: () => setPressed(false),
    };

    return <Component {...enhancedProps} />;
  };
}

export const InteractiveCard = ({ children, onClick, style }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transition: 'all 0.2s ease-out',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered 
          ? '0 12px 24px rgba(0, 0, 0, 0.4)' 
          : '0 4px 12px rgba(0, 0, 0, 0.15)',
        cursor: 'pointer',
        ...style
      }}
    >
      {children}
    </div>
  );
};

export const InteractiveButton = ({ children, onClick, style, active }) => {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        transition: 'all 0.15s ease-out',
        transform: pressed 
          ? 'scale(0.97)' 
          : hovered 
            ? 'scale(1.02)' 
            : 'scale(1)',
        boxShadow: hovered 
          ? '0 6px 12px rgba(0, 0, 0, 0.3)' 
          : pressed 
            ? 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
            : 'none',
        cursor: 'pointer',
        opacity: active ? 1 : 0.7,
        ...style
      }}
    >
      {children}
    </button>
  );
};

export default withMicroInteractions;
