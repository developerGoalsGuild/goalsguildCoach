'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from '../lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('login');
  const tHome = useTranslations('home');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('authFailed'));
        setLoading(false);
        return;
      }

      // Armazenar token e user
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/');
      }
    } catch (err) {
      setError(t('networkError'));
      setLoading(false);
    }
  };

  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#ededed',
    padding: isMobile ? '1rem' : '2rem'
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '400px',
    padding: isMobile ? '1.5rem' : '2rem',
    background: '#111827',
    borderRadius: '0.75rem',
    border: '1px solid #374151'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: isMobile ? '1.5rem' : '2rem'
  };

  const titleStyle = {
    fontSize: isMobile ? '1.5rem' : '2rem',
    fontWeight: 'bold',
    color: '#fbbf24',
    marginBottom: '0.5rem'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    background: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    color: '#d1d5db',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    width: '100%',
    padding: '0.875rem',
    background: loading ? '#374151' : '#fbbf24',
    color: loading ? '#9ca3af' : '#000',
    fontWeight: '600',
    fontSize: '0.875rem',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={titleStyle}>
              🦅 {tHome('title')}
            </h1>
          </Link>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>
            {t('subtitle')}
          </p>
        </div>

        {error && (
          <div style={{ background: '#dc2626', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
              {t('email')}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              required
              disabled={loading}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
              {t('password')}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={loading}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={buttonStyle}
          >
            {loading ? t('entering') : t('submit')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <p style={{ color: '#9ca3af', margin: 0 }}>
            {t('forgotPassword')} <Link href="/forgot-password" style={{ color: '#fbbf24', textDecoration: 'none' }}>{t('recover')}</Link>
          </p>
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <p style={{ color: '#9ca3af', margin: 0 }}>
            {t('noAccount')} <Link href="/register" style={{ color: '#fbbf24', textDecoration: 'none' }}>{t('createAccount')}</Link>
          </p>
        </div>

        {isMobile && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#1f2937', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>📱 {t('testUserLabel')}</p>
            <p style={{ margin: '0', fontSize: '0.625rem' }}>teste@goalsguild.com</p>
            <p style={{ margin: '0', fontSize: '0.625rem' }}>teste123</p>
          </div>
        )}
      </div>
    </div>
  );
}
