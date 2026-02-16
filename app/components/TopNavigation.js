'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from '../lib/i18n';

export default function TopNavigation() {
  const tNav = useTranslations('nav');
  const tHome = useTranslations('home');
  const { locale, setLocale } = useLocale();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 860) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navLinks = [
    { href: '/', label: tNav('home') },
    { href: '/coach', label: tNav('coach') },
    { href: '/objectives', label: tNav('objectives') },
    { href: '/quests', label: tNav('quests') },
    { href: '/tasks', label: tNav('tasks') },
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
            <span>{item.href === '/' ? '🏠' : item.href === '/coach' ? '🤖' : item.href === '/objectives' ? '🎯' : item.href === '/quests' ? '⚔️' : '✅'}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
