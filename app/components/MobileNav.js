/**
 * Mobile Navigation Component
 * Hamburger menu para mobile
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MobileNav({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const closeMenu = () => setIsOpen(false);

  if (!isMobile) return null;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1001,
          padding: '0.75rem',
          background: '#f59e0b',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontSize: '1.5rem'
        }}
        aria-label="Menu"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={closeMenu}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 999,
            animation: 'fadeIn 0.3s ease-out'
        }}
        />
      )}

      {/* Sidebar Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: isOpen ? '0' : '-280px',
        width: '280px',
        height: '100vh',
        background: '#111827',
        borderRight: '1px solid #1f2937',
        padding: '1.5rem',
        zIndex: 1000,
        transition: 'left 0.3s ease-out',
        overflowY: 'auto'
      }}>
        <Link href="/" style={{ textDecoration: 'none' }} onClick={closeMenu}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: '#fbbf24', 
            marginBottom: '0.5rem' 
          }}>
            🦅 GoalsGuild
          </h1>
        </Link>
        <p style={{ 
          fontSize: '0.875rem', 
          color: '#9ca3af', 
          marginBottom: '2rem' 
        }}>
          Seu sistema de produtividade.
        </p>

        {user && (
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '0.75rem', 
            background: '#1f2937', 
            borderRadius: '0.5rem', 
            border: '1px solid #374151' 
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#9ca3af', 
              marginBottom: '0.25rem' 
            }}>
              Olá,
            </div>
            <div style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: '#d1d5db' 
            }}>
              {user.name}
            </div>
          </div>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link 
            href="/coach" 
            style={{ textDecoration: 'none' }}
            onClick={closeMenu}
          >
            <button style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: '#1f2937',
              border: '1px solid #374151',
              color: '#d1d5db',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              🤖 Falar com Coach
            </button>
          </Link>

          <Link 
            href="/quests" 
            style={{ textDecoration: 'none' }}
            onClick={closeMenu}
          >
            <button style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: '#1f2937',
              border: '1px solid #374151',
              color: '#d1d5db',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              🎯 Quests
            </button>
          </Link>

          <Link 
            href="/tasks" 
            style={{ textDecoration: 'none' }}
            onClick={closeMenu}
          >
            <button style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: '#1f2937',
              border: '1px solid #374151',
              color: '#d1d5db',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              ✅ Tasks
            </button>
          </Link>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <button
            onClick={() => {
              closeMenu();
              window.location.href = '/login';
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: '#dc2626',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Sair
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
