/**
 * Skeleton Loading Component
 * Animações de carregamento profissionais
 */

'use client';

export default function Skeleton({ 
  variant = 'text',
  width,
  height,
  count = 1,
  style 
}) {
  const variants = {
    text: {
      height: height || '1rem',
      borderRadius: '0.25rem'
    },
    circular: {
      width: width || '40px',
      height: height || '40px',
      borderRadius: '50%'
    },
    rectangular: {
      width: width || '100%',
      height: height || '100px',
      borderRadius: '0.5rem'
    },
    rounded: {
      width: width || '100%',
      height: height || '60px',
      borderRadius: '0.5rem'
    }
  };

  const defaultStyle = {
    ...variants[variant],
    background: 'linear-gradient(90deg, #1f2937 25%, #374151 50%, #1f2937 75%)',
    backgroundSize: '200% 100%',
    animation: 'pulse 1.5s ease-in-out infinite',
    ...style
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index}
          style={defaultStyle}
        />
      ))}

      <style jsx>{`
        @keyframes pulse {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </>
  );
}
