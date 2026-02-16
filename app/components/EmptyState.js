/**
 * Empty State Component
 * Estado vazio visual com call-to-action
 */

'use client';

import Link from 'next/link';

export default function EmptyState({ 
  icon = '📋',
  title = 'Nada aqui ainda',
  description,
  actionText,
  actionLink,
  onAction
}) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '4rem 2rem',
      background: '#1f2937',
      borderRadius: '0.75rem',
      border: '1px solid #374151'
    }}>
      <div style={{
        fontSize: '5rem',
        marginBottom: '1.5rem',
        animation: 'float 3s ease-in-out infinite'
      }}>
        {icon}
      </div>
      
      <h2 style={{
        fontSize: '1.75rem',
        fontWeight: 'bold',
        color: '#d1d5db',
        marginBottom: '0.75rem'
      }}>
        {title}
      </h2>
      
      <p style={{
        fontSize: '1rem',
        color: '#9ca3af',
        marginBottom: '2rem',
        lineHeight: '1.6',
        maxWidth: '400px',
        margin: '0 auto 2rem'
      }}>
        {description}
      </p>

      {actionLink && (
        <Link href={actionLink}>
          <button style={{
            padding: '0.75rem 1.5rem',
            background: '#f59e0b',
            color: '#000',
            fontWeight: '600',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}>
            {actionText}
          </button>
        </Link>
      )}

      {onAction && !actionLink && (
        <button
          onClick={onAction}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#f59e0b',
            color: '#000',
            fontWeight: '600',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          {actionText}
        </button>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
