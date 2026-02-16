// Bottom Navigation para Mobile
// Touch-friendly, sticky bottom navigation

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from '../lib/i18n';
import { useState, useEffect } from 'react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  if (!isMobile) return null;

  const navItems = [
    { href: '/', icon: '🏠', label: t('home') },
    { href: '/coach', icon: '🤖', label: t('coach') },
    { href: '/objectives', icon: '🎯', label: t('objectives') },
    { href: '/quests', icon: '⚔️', label: t('quests') },
    { href: '/tasks', icon: '✅', label: t('tasks') },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: '#111827',
      borderTop: '1px solid #1f2937',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 998,
      paddingBottom: '8px',
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.3)'
    }}>
      {navItems.map(item => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              color: isActive ? '#fbbf24' : '#9ca3af',
              fontSize: '0.75rem',
              gap: '4px',
              minWidth: '44px',
              minHeight: '44px',
              justifyContent: 'center',
              transition: 'transform 0.2s'
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{
              fontSize: '1.25rem',
              filter: isActive ? 'none' : 'grayscale(100%)'
            }}>
              {item.icon}
            </span>
            <span style={{
              fontWeight: isActive ? 'bold' : 'normal',
              fontSize: '0.7rem'
            }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

// Hook para adicionar padding bottom quando bottom nav está ativo
export function useMobileBottomNavPadding() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isMobile ? { paddingBottom: '72px' } : {};
}
