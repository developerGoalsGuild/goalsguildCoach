'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { isAuthenticated, logout, getUser } from './lib/auth-helpers';
import QuickActions from './components/QuickActions';
import TopNavigation from './components/TopNavigation';
import { useTranslations } from './lib/i18n';

export default function HomePage() {
  const t = useTranslations('home');
  const tNav = useTranslations('nav');
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setIsAuth(isAuthenticated());
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    logout();
  };

  if (!isAuth) {
    return (
      <div className="app-shell">
        <TopNavigation />
        <div className="page-container" style={{ display: 'grid', placeItems: 'center', minHeight: '72vh' }}>
          <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', maxWidth: 520 }}>
            <div style={{ fontSize: '3.3rem', marginBottom: '0.7rem' }}>🔐</div>
            <h1 style={{ fontSize: '1.9rem', color: 'var(--accent-soft)', marginBottom: '0.7rem' }}>{t('authRequired')}</h1>
            <p style={{ color: 'var(--text-soft)', marginBottom: '1.3rem' }}>{t('authMessage')}</p>
            <Link href="/login" className="btn btn-primary">
              {t('goToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TopNavigation />

      <main className="page-container">
        <section className="hero glass-card">
          <h1>
            🎯 {t('welcome')}
          </h1>
          <p>
            {t('welcomeSubtitle')}
          </p>
          {user && (
            <p style={{ fontSize: '0.9rem', color: 'var(--accent-soft)', marginTop: '0.8rem' }}>
              {t('loggedInAs')} {user.email}
            </p>
          )}
        </section>

        <QuickActions />

        <section className="features-grid">
          <FeatureCard
            icon="🎯"
            title={t('features.objectives')}
            description={t('featureDescriptions.objectives')}
            link="/objectives"
          />
          <FeatureCard
            icon="⚔️"
            title={t('features.quests')}
            description={t('featureDescriptions.quests')}
            link="/quests"
          />
          <FeatureCard
            icon="✅"
            title={t('features.tasks')}
            description={t('featureDescriptions.tasks')}
            link="/tasks"
          />
          <FeatureCard
            icon="📝"
            title={t('features.daily')}
            description={t('featureDescriptions.daily')}
            link="/daily"
          />
          <FeatureCard
            icon="📊"
            title={t('features.analytics')}
            description={t('featureDescriptions.analytics')}
            link="/analytics"
          />
          <FeatureCard
            icon="🏆"
            title={t('features.achievements')}
            description={t('featureDescriptions.achievements')}
            link="/achievements"
          />
        </section>

        <section className="cta-wrap glass-card">
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-soft)' }}>
            🚀 {t('ctaTitle')}
          </h2>
          <div className="cta-grid">
            <Link href="/coach" className="btn" style={{ background: 'var(--blue)', color: 'white' }}>
              🤖 {t('talkCoach')}
            </Link>
            <Link href="/quests" className="btn btn-primary">
              ⚔️ {t('viewQuests')}
            </Link>
            <Link href="/daily" className="btn" style={{ background: 'var(--green)', color: '#06250f' }}>
              📝 {t('dailyCheckin')}
            </Link>
          </div>
        </section>

        <div style={{ marginTop: '1.2rem', textAlign: 'center' }}>
          <button onClick={handleLogout} className="btn btn-dark">
            {tNav('logout')}
          </button>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description, link }) {
  return (
    <Link href={link} className="feature-card">
      <div style={{ fontSize: '2rem' }}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </Link>
  );
}
