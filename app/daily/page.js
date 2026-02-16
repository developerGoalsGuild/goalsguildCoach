'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNavigation from '../components/TopNavigation';
import { useTranslations } from '../lib/i18n';
import { authFetch } from '../lib/auth-helpers';

export default function DailyCheckInPage() {
  const router = useRouter();
  const t = useTranslations('daily');
  const tc = useTranslations('common');
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [reflection, setReflection] = useState({
    mood: '',
    gratitude: '',
    highlights: '',
    challenges: '',
    tomorrow_goals: '',
  });

  useEffect(() => {
    fetchSummary();
    checkIfCheckedIn();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/daily-summary');
      const data = await response.json();
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfCheckedIn = async () => {
    try {
      await fetch('/api/daily-summary');
      setHasCheckedIn(false);
    } catch (error) {
      console.error('Error checking check-in status:', error);
    }
  };

  const submitReflection = async () => {
    if (!reflection.mood) {
      alert(t('moodRequired'));
      return;
    }

    try {
      const response = await authFetch('/api/daily-summary', {
        method: 'POST',
        body: JSON.stringify(reflection),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const xpMsg = data.xp_earned ? ` +${data.xp_earned} XP!` : '';
        alert(`${t('savedSuccess')}${xpMsg}`);
        setHasCheckedIn(true);
      } else {
        alert(t('saveError'));
      }
    } catch (error) {
      console.error('Error submitting reflection:', error);
      alert(t('saveError'));
    }
  };

  if (isLoading) {
    return (
      <div className="app-shell">
        <TopNavigation />
        <main className="page-container" style={{ display: 'grid', placeItems: 'center', minHeight: '72vh' }}>
          <div className="glass-card" style={{ padding: '1rem 1.2rem', color: 'var(--text-soft)' }}>
            {tc('loading')}
          </div>
        </main>
      </div>
    );
  }

  if (hasCheckedIn) {
    return (
      <div className="app-shell">
        <TopNavigation />
        <main className="page-container" style={{ display: 'grid', placeItems: 'center', minHeight: '72vh' }}>
          <section className="glass-card" style={{ padding: '1.3rem', maxWidth: 560, textAlign: 'center' }}>
            <h1 style={{ color: 'var(--accent-soft)', marginBottom: '0.5rem' }}>✅ {t('savedTitle')}</h1>
            <p style={{ color: 'var(--text-soft)', marginBottom: '0.9rem' }}>{t('savedMessage')} 🌙</p>
            <button onClick={() => router.push('/')} className="btn btn-primary">
              {t('backHome')}
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TopNavigation />
      <main className="page-container">
        <section className="hero glass-card" style={{ marginBottom: '0.9rem' }}>
          <h1>📝 {t('title')}</h1>
          <p>{t('subtitle')}</p>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '0.7rem',
            marginBottom: '0.9rem',
          }}
        >
          <div className="glass-card" style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--text-soft)', marginBottom: '0.5rem' }}>{t('summaryOfDay')}</p>
            {summary ? (
              <>
                <p>✅ {t('completedLabel')}: {summary.completed_tasks || 0}</p>
                <p>⏳ {t('pendingLabel')}: {summary.pending_tasks || 0}</p>
                <p>⭐ {t('xpLabel')}: {summary.total_xp || 0}</p>
                <p>📊 {t('hoursLabel')}: {Number(summary.hours_worked || 0).toFixed(1)}h</p>
              </>
            ) : (
              <p style={{ color: 'var(--text-soft)' }}>{t('noSummary')}</p>
            )}
          </div>

          <div className="glass-card" style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--text-soft)', marginBottom: '0.5rem' }}>{t('moodToday')}</p>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {[
                { value: 'great', emoji: '😊', key: 'moodGreat' },
                { value: 'good', emoji: '🙂', key: 'moodGood' },
                { value: 'ok', emoji: '😐', key: 'moodOk' },
                { value: 'tired', emoji: '😔', key: 'moodTired' },
                { value: 'bad', emoji: '😢', key: 'moodBad' },
              ].map(({ value, emoji, key }) => (
                <button
                  key={value}
                  onClick={() => setReflection({ ...reflection, mood: value })}
                  className={`btn ${reflection.mood === value ? 'btn-primary' : 'btn-dark'}`}
                >
                  {emoji} {t(key)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-card" style={{ padding: '1rem' }}>
          <h2 style={{ marginBottom: '0.75rem' }}>{t('reflection')}</h2>
          <Question
            label={t('gratitudeQuestion')}
            value={reflection.gratitude}
            onChange={(value) => setReflection({ ...reflection, gratitude: value })}
            placeholder={t('gratitudePlaceholder')}
          />
          <Question
            label={t('highlightsQuestion')}
            value={reflection.highlights}
            onChange={(value) => setReflection({ ...reflection, highlights: value })}
            placeholder={t('highlightsPlaceholder')}
          />
          <Question
            label={t('challengesQuestion')}
            value={reflection.challenges}
            onChange={(value) => setReflection({ ...reflection, challenges: value })}
            placeholder={t('challengesPlaceholder')}
          />
          <Question
            label={t('tomorrowQuestion')}
            value={reflection.tomorrow_goals}
            onChange={(value) => setReflection({ ...reflection, tomorrow_goals: value })}
            placeholder={t('tomorrowPlaceholder')}
          />
          <button onClick={submitReflection} disabled={!reflection.mood} className="btn btn-primary" style={{ width: '100%', opacity: reflection.mood ? 1 : 0.6 }}>
            {t('saveReflection')}
          </button>
        </section>
      </main>
    </div>
  );
}

function Question({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: '0.8rem' }}>
      <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-soft)', fontSize: '0.85rem' }}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          background: '#1f2937',
          border: '1px solid #374151',
          color: '#d1d5db',
          fontSize: '0.875rem',
        }}
      />
    </div>
  );
}
