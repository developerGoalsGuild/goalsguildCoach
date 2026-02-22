'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from '../lib/i18n';
import { authFetch } from '../lib/auth-helpers';

export default function TopNavigation() {
  const tNav = useTranslations('nav');
  const tHome = useTranslations('home');
  const tLevel = useTranslations('level');
  const { locale, setLocale } = useLocale();

  const getLevelTitle = (level) => {
    const n = Math.max(1, Math.min(100, Number(level) || 1));
    return n <= 10 ? tLevel(`title${n}`) : `${tLevel('levelPrefix')} ${n}`;
  };
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [levelData, setLevelData] = useState(null);
  const [planName, setPlanName] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 860) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    authFetch('/api/level')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setLevelData(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    authFetch('/api/subscription/current')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const name = data?.subscription?.display_name || data?.subscription?.plan_name || 'Free';
        setPlanName(name);
      })
      .catch(() => setPlanName('Free'));
  }, []);

  const navLinks = [
    { href: '/', label: tNav('home') },
    { href: '/coach', label: tNav('coach') },
    { href: '/objectives', label: tNav('objectives') },
    { href: '/quests', label: tNav('quests') },
    { href: '/tasks', label: tNav('tasks') },
    { href: '/profile', label: tNav('profile') },
  ];

  return (
    <>
      <header className="top-nav">
        <div className="top-nav__inner">
          <Link href="/" className="brand">
            🎯 {tHome('title')}
          </Link>

          <nav className="nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link${pathname === link.href ? ' active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="top-nav__right">
            {planName && (
              <Link
                href="/profile"
                className="btn btn-dark"
                title={tNav('profile')}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.55rem', textTransform: 'capitalize' }}
              >
                📋 {planName}
              </Link>
            )}
            {levelData && (
              <Link
                href="/analytics"
                className="btn btn-dark"
                title={`${levelData.current_xp ?? 0} / ${levelData.xp_in_current_level_cap ?? 100} XP · ${getLevelTitle(levelData.level ?? 1)}`}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
              >
                ⚡ Lv.{levelData.level ?? 1}
              </Link>
            )}
            <Link href="/daily" className="btn btn-primary">
              ✅ {tNav('daily')}
            </Link>
            <Link href="/analytics" className="btn btn-dark">
              📊 {tNav('analytics')}
            </Link>
            <button
              onClick={() => setLocale('pt-BR')}
              className={`locale-toggle${locale === 'pt-BR' ? ' active' : ''}`}
            >
              🇧🇷 PT
            </button>
            <button
              onClick={() => setLocale('en-US')}
              className={`locale-toggle${locale === 'en-US' ? ' active' : ''}`}
            >
              🇺🇸 EN
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="mobile-menu-btn"
            aria-label="Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="mobile-menu glass-card">
            <div className="mobile-menu__links">
              {planName && (
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '0.9rem', color: 'var(--text-soft)' }}>
                  📋 {planName}
                </Link>
              )}
              {levelData && (
                <Link href="/analytics" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '0.9rem', color: 'var(--text-soft)' }}>
                  ⚡ {tLevel('levelPrefix')} {levelData.level ?? 1} – {getLevelTitle(levelData.level ?? 1)}
                </Link>
              )}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mobile-nav-link${pathname === link.href ? ' active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/daily" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>
                ✅ {tNav('daily')}
              </Link>
              <Link href="/analytics" className="btn btn-dark" onClick={() => setMobileMenuOpen(false)}>
                📊 {tNav('analytics')}
              </Link>
              <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.45rem' }}>
                <button
                  onClick={() => setLocale('pt-BR')}
                  className={`locale-toggle${locale === 'pt-BR' ? ' active' : ''}`}
                  style={{ flex: 1, padding: '0.6rem' }}
                >
                  🇧🇷 PT
                </button>
                <button
                  onClick={() => setLocale('en-US')}
                  className={`locale-toggle${locale === 'en-US' ? ' active' : ''}`}
                  style={{ flex: 1, padding: '0.6rem' }}
                >
                  🇺🇸 EN
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="mobile-bottom-nav glass-card">
        {navLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-bottom-item${pathname === item.href ? ' active' : ''}`}
          >
            <span>{item.href === '/' ? '🏠' : item.href === '/coach' ? '🤖' : item.href === '/objectives' ? '🎯' : item.href === '/quests' ? '⚔️' : item.href === '/profile' ? '👤' : '✅'}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
