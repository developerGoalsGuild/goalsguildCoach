/**
 * Modal Component
 * Para confirmações e diálogos
 */

'use client';

import { useEffect } from 'react';
import { useTranslations } from '../lib/i18n';

export default function Modal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  children,
  confirmText,
  cancelText,
  type = 'danger',
  disabled = false
}) {
  const t = useTranslations('common');
  const finalConfirmText = confirmText || t('confirm');
  const finalCancelText = cancelText || t('cancel');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (disabled) return;
    onConfirm();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#1f2937',
        borderRadius: '0.75rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: type === 'danger' ? '#dc2626' : '#fbbf24',
          marginBottom: '0.5rem' 
        }}>
          {title}
        </h2>
        
        {(children || message) && (
          <div style={{ 
            fontSize: '1rem', 
            color: '#d1d5db', 
            marginBottom: '1.5rem',
            lineHeight: '1.5'
          }}>
            {children || message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#374151',
              color: '#d1d5db',
              fontWeight: '500',
              borderRadius: '0.5rem',
              border: '1px solid #4b5563',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {finalCancelText}
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={disabled}
            style={{
              padding: '0.75rem 1.5rem',
              background: disabled ? '#374151' : (type === 'danger' ? '#dc2626' : '#f59e0b'),
              color: '#fff',
              fontWeight: '600',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              opacity: disabled ? 0.6 : 1
            }}
          >
            {finalConfirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0,
            transform: scale(0.95);
          }
          to {
            opacity: 1,
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
