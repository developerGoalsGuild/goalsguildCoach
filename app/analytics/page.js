'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TopNavigation from '../components/TopNavigation';
import { authFetch } from '../lib/auth-helpers';
import { useTranslations } from '../lib/i18n';

export default function AnalyticsPage() {
  const router = useRouter();
  const t = useTranslations('analytics');
  const tc = useTranslations('common');
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await authFetch('/api/analytics', { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        setAnalytics({});
        return;
      }

      setAnalytics(data || {});
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Refetch when user returns to the tab or navigates back to this page
  useEffect(() => {
    const onFocus = () => fetchAnalytics();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchAnalytics]);

  if (isLoading) {
    return (
      <div className="app-shell">
        <TopNavigation />
        <main className="page-container" style={{ display: 'grid', placeItems: 'center', minHeight: '72vh' }}>
          <div className="glass-card" style={{ padding: '1.25rem 1.5rem', color: 'var(--text-soft)' }}>
            {tc('loadingAnalytics')}
          </div>
        </main>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="app-shell">
        <TopNavigation />
        <main className="page-container" style={{ display: 'grid', placeItems: 'center', minHeight: '72vh' }}>
          <div className="glass-card" style={{ padding: '1.25rem 1.5rem', color: 'var(--text-soft)' }}>
            {tc('loadErrorAnalytics')}
          </div>
        </main>
      </div>
    );
  }

  const stats = (timeRange === 'week' ? analytics.week : analytics.month) || {};
  const productivityByDay = analytics.productivityByDay || [];
  const objectives = analytics.objectives || [];
  const tasksTrend = analytics.tasksTrend || [];
  const level = analytics.level || { level: 1, current_xp: 0, xp_to_next_level: 100 };
  const streak = analytics.streak || { longest_streak: 0 };

  const maxMilestones = Math.max(...productivityByDay.map((d) => Number(d.milestones || d.milestones_count || 0)), 1);
  const maxXP = Math.max(...productivityByDay.map((d) => Number(d.xp || d.xp_earned || 0)), 1);
  const levelPercent = Math.min(100, Math.round((Number(level.current_xp || 0) / Math.max(Number(level.xp_to_next_level || 100), 1)) * 100));

  return (
    <div className="app-shell">
      <TopNavigation />
      <main className="page-container">
        <section className="hero glass-card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ marginBottom: '0.45rem' }}>📊 Analytics</h1>
              <p style={{ margin: 0 }}>{t('subtitle')}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => setTimeRange('week')} className={`btn ${timeRange === 'week' ? 'btn-primary' : 'btn-dark'}`}>
                {t('week')}
              </button>
              <button onClick={() => setTimeRange('month')} className={`btn ${timeRange === 'month' ? 'btn-primary' : 'btn-dark'}`}>
                {t('month')}
              </button>
              <button type="button" onClick={() => fetchAnalytics()} className="btn btn-dark" title={tc('refresh') || 'Refresh'}>
                🔄
              </button>
              <button onClick={() => router.push('/')} className="btn btn-dark">
                {tc('back')}
              </button>
            </div>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.8rem',
            marginBottom: '1rem',
          }}
        >
          <MetricCard title={`⚡ ${t('currentLevel')}`} value={`Nível ${level.level || 1}`} sub={`${level.current_xp || 0} / ${level.xp_to_next_level || 100} XP`}>
            <Progress value={levelPercent} color="var(--accent)" />
          </MetricCard>
          <MetricCard title="🔥 Streak" value={`${streak.longest_streak || 0} dias`} sub={t('bestStreak')} />
          <MetricCard title={`🎯 ${t('questsCompleted')}`} value={stats.quests_completed || 0} sub={timeRange === 'week' ? t('lastWeek') : t('lastMonth')} />
          <MetricCard title={`⭐ ${t('xpEarned')}`} value={stats.xp_earned || 0} sub={timeRange === 'week' ? t('lastWeek') : t('lastMonth')} />
          <MetricCard title={`✅ ${t('milestones')}`} value={stats.milestones_completed || 0} sub={timeRange === 'week' ? t('lastWeek') : t('lastMonth')} />
          <MetricCard title={`📅 ${t('activeDays')}`} value={stats.active_days || 0} sub={timeRange === 'week' ? t('lastWeek') : t('lastMonth')} />
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '0.8rem',
            marginBottom: '1rem',
          }}
        >
          <ChartCard title={`📅 ${t('productivityByDay')}`}>
            {productivityByDay.length === 0 ? (
              <p style={{ color: 'var(--text-soft)' }}>{t('noData')}</p>
            ) : (
              <BarRow
                data={productivityByDay}
                getValue={(d) => Number(d.milestones || d.milestones_count || 0)}
                maxValue={maxMilestones}
                color="var(--green)"
              />
            )}
          </ChartCard>

          <ChartCard title={`⭐ ${t('xpByDay')}`}>
            {productivityByDay.length === 0 ? (
              <p style={{ color: 'var(--text-soft)' }}>{t('noData')}</p>
            ) : (
              <BarRow
                data={productivityByDay}
                getValue={(d) => Number(d.xp || d.xp_earned || 0)}
                maxValue={maxXP}
                color="var(--accent)"
              />
            )}
          </ChartCard>
        </section>

        <section className="glass-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ marginBottom: '0.75rem' }}>🎯 {t('objectiveProgress')}</h2>
          {objectives.length === 0 ? (
            <p style={{ color: 'var(--text-soft)' }}>{t('noObjectives')}</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {objectives.map((obj) => (
                <article key={obj.id} className="feature-card" style={{ padding: '1rem' }}>
                  <h3>{obj.statement || obj.title || 'Objetivo'}</h3>
                  <p style={{ marginBottom: '0.35rem' }}>
                    📝 Quests criadas: {obj.quests_created || 0} · ✅ Completadas: {obj.quests_completed || 0} · ⭐ XP:{' '}
                    {obj.total_xp_earned || obj.total_xp || 0}
                  </p>
                  <p style={{ fontSize: '0.8rem' }}>Criado em {new Date(obj.created_at).toLocaleDateString('pt-BR')}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        {tasksTrend.length > 0 && (
          <section className="glass-card" style={{ padding: '1rem' }}>
            <h2 style={{ marginBottom: '0.75rem' }}>📊 {t('tasksTrend')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(58px, 1fr))', gap: '0.25rem' }}>
              {tasksTrend.slice(0, 30).reverse().map((day) => (
                <div
                  key={day.date}
                  style={{
                    borderRadius: '8px',
                    padding: '0.45rem 0.35rem',
                    textAlign: 'center',
                    background: Number(day.completed || 0) > 0 ? 'var(--green)' : '#334155',
                    color: Number(day.completed || 0) > 0 ? '#022c22' : 'var(--text)',
                    opacity: Number(day.completed || 0) > 0 ? 1 : 0.45,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                  title={`${new Date(day.date).toLocaleDateString('pt-BR')}: ${day.completed || 0} completadas`}
                >
                  {day.completed || 0}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function MetricCard({ title, value, sub, children }) {
  return (
    <div className="glass-card" style={{ padding: '1rem' }}>
      <p style={{ color: 'var(--text-soft)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>{title}</p>
      <p style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--accent-soft)', marginBottom: '0.15rem' }}>{value}</p>
      <p style={{ color: 'var(--text-soft)', fontSize: '0.8rem' }}>{sub}</p>
      {children}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="glass-card" style={{ padding: '1rem' }}>
      <h2 style={{ marginBottom: '0.75rem' }}>{title}</h2>
      {children}
    </div>
  );
}

function Progress({ value, color }) {
  return (
    <div style={{ marginTop: '0.55rem', width: '100%', height: '8px', background: '#334155', borderRadius: '999px', overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, height: '100%', background: color }} />
    </div>
  );
}

function BarRow({ data, getValue, maxValue, color }) {
  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-end', minHeight: '170px' }}>
      {data.map((day, index) => {
        const rawDay = day.day || day.day_of_week || `D${index + 1}`;
        const value = getValue(day);
        const safeLabel = String(rawDay).substring(0, 3);
        const heightPercent = Math.max(8, Math.round((value / maxValue) * 100));

        return (
          <div key={`${rawDay}-${index}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-soft)', marginBottom: '0.2rem' }}>{value}</span>
            <div style={{ width: '100%', height: `${heightPercent}%`, background: color, borderRadius: '8px 8px 2px 2px', opacity: value > 0 ? 1 : 0.25 }} />
            <span style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-soft)' }}>{safeLabel}</span>
          </div>
        );
      })}
    </div>
  );
}
