'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNavigation from '../components/TopNavigation';
import { authFetch } from '../lib/auth-helpers';
import { useTranslations, useLocale } from '../lib/i18n';

export default function AchievementsPage() {
  const router = useRouter();
  const t = useTranslations('achievements');
  const { locale } = useLocale();
  const dateLocale = locale === 'en-US' ? 'en-US' : 'pt-BR';
  const [achievements, setAchievements] = useState(null);
  const [grouped, setGrouped] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchAchievements();
    checkAchievements();
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await authFetch('/api/achievements');
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) return;
        setAchievements([]);
        setGrouped(null);
        setStats(null);
        return;
      }
      setAchievements(data.achievements);
      setGrouped(data.grouped);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAchievements = async () => {
    try {
      const response = await authFetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok) return;
      
      if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
        setNewlyUnlocked(data.newlyUnlocked);
        
        // Mostrar alertas
        data.newlyUnlocked.forEach((achievement, index) => {
          const nameKey = (achievement.category != null && achievement.requirement_value != null)
            ? `card_${achievement.category}_${achievement.requirement_value}_name` : null;
          const nameTrans = nameKey ? t(nameKey) : null;
          const displayName = (nameKey && nameTrans !== nameKey) ? nameTrans : achievement.name;
          setTimeout(() => alert(`🏆 ${t('alertUnlocked')}: ${displayName}!`), index * 500);
        });
        setTimeout(() => fetchAchievements(), data.newlyUnlocked.length * 500 + 500);
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a', color: '#ededed' }}>
        <div>{t('loading')}</div>
      </div>
    );
  }

  const renderAchievementCard = (achievement) => {
    const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;
    const isUnlocked = achievement.unlocked;
    const cardKey = `card_${achievement.category}_${achievement.requirement_value}`;
    const nameKey = `${cardKey}_name`;
    const descKey = `${cardKey}_description`;
    const nameTrans = t(nameKey);
    const descTrans = t(descKey);
    // Use API name/description only when translation is missing (i18n returns the key)
    const displayName = nameTrans === nameKey ? achievement.name : nameTrans;
    const displayDescription = descTrans === descKey ? achievement.description : descTrans;

    return (
      <div
        key={achievement.id}
        style={{
          padding: '1rem',
          borderRadius: '0.5rem',
          background: isUnlocked ? '#1f2937' : '#111827',
          border: isUnlocked ? '2px solid #fbbf24' : '1px solid #374151',
          opacity: isUnlocked ? 1 : 0.5,
          transition: 'all 0.2s',
          position: 'relative'
        }}
        title={displayDescription}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '2rem', marginRight: '0.5rem' }}>
            {achievement.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: isUnlocked ? '#fbbf24' : '#9ca3af' }}>
              {displayName}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              {displayDescription}
            </div>
          </div>
        </div>

        {!isUnlocked && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
              <span>{t('progress')}</span>
              <span>{achievement.progress} / {achievement.maxProgress}</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#374151', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progressPercentage}%`,
                  height: '100%',
                  background: '#fbbf24',
                  borderRadius: '3px'
                }}
              />
            </div>
          </div>
        )}

        {isUnlocked && achievement.unlockedAt && (
          <div style={{ fontSize: '0.625rem', color: '#10b981', marginTop: '0.25rem' }}>
            {t('unlockedOn')} {new Date(achievement.unlockedAt).toLocaleDateString(dateLocale)}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <TopNavigation />
      <div style={{ minHeight: '100vh', paddingBottom: isMobile ? '80px' : undefined, background: '#0a0a0a', color: '#ededed', paddingTop: '60px', padding: isMobile ? '1rem' : '2rem' }}>
        {/* Barra no topo: voltar + verificar + progresso */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#111827', borderRadius: '0.5rem', border: '1px solid #1f2937' }}>
          <button
            onClick={() => router.push('/')}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: '#1f2937', border: '1px solid #374151', color: '#d1d5db', fontSize: '0.875rem', cursor: 'pointer' }}
          >
            ← {t('back')}
          </button>
          <button
            onClick={checkAchievements}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: '#fbbf24', color: '#000', fontWeight: '600', fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
          >
            🏆 {t('checkButton')}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
              <strong style={{ color: '#fbbf24' }}>{stats?.unlocked ?? 0}/{stats?.total ?? 0}</strong> ({stats?.percentage ?? 0}%)
            </span>
            <div style={{ width: 80, height: '6px', background: '#374151', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${stats?.percentage || 0}%`, height: '100%', background: '#fbbf24', borderRadius: '3px' }} />
            </div>
            {grouped && (
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                🎯 {grouped.quests?.filter(a => a.unlocked).length ?? 0}/{grouped.quests?.length ?? 0} • ⭐ {grouped.xp?.filter(a => a.unlocked).length ?? 0}/{grouped.xp?.length ?? 0} • 🔥 {grouped.streak?.filter(a => a.unlocked).length ?? 0}/{grouped.streak?.length ?? 0}
              </span>
            )}
          </div>
        </div>

      {/* Main Content */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '1rem' }}>
          🏆 {t('title')}
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '2rem' }}>
          {t('subtitle')}
        </p>

        {newlyUnlocked.length > 0 && (
          <div style={{ padding: '1rem', background: '#10b981', borderRadius: '0.5rem', marginBottom: '2rem' }}>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#000', marginBottom: '0.5rem' }}>
              🎉 {t('congratsTitle')}
            </div>
            {newlyUnlocked.map(achievement => {
              const nameKey = (achievement.category != null && achievement.requirement_value != null)
                ? `card_${achievement.category}_${achievement.requirement_value}_name` : null;
              const nameTrans = nameKey ? t(nameKey) : null;
              const displayName = (nameKey && nameTrans !== nameKey) ? nameTrans : achievement.name;
              return (
                <div key={achievement.id} style={{ fontSize: '0.875rem', color: '#000', marginBottom: '0.25rem' }}>
                  • {displayName}
                </div>
              );
            })}
          </div>
        )}

        {grouped && grouped.quests && grouped.quests.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#d1d5db', marginBottom: '1rem' }}>
              🎯 {t('sectionQuests')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {grouped.quests.map(achievement => renderAchievementCard(achievement))}
            </div>
          </div>
        )}

        {grouped && grouped.xp && grouped.xp.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#d1d5db', marginBottom: '1rem' }}>
              ⭐ {t('sectionXp')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {grouped.xp.map(achievement => renderAchievementCard(achievement))}
            </div>
          </div>
        )}

        {grouped && grouped.streak && grouped.streak.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#d1d5db', marginBottom: '1rem' }}>
              🔥 {t('sectionStreak')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {grouped.streak.map(achievement => renderAchievementCard(achievement))}
            </div>
          </div>
        )}

        {grouped && grouped.objectives && grouped.objectives.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#d1d5db', marginBottom: '1rem' }}>
              🎯 {t('sectionObjectives')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {grouped.objectives.map(achievement => renderAchievementCard(achievement))}
            </div>
          </div>
        )}

        {grouped && grouped.level && grouped.level.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#d1d5db', marginBottom: '1rem' }}>
              👑 {t('sectionLevel')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {grouped.level.map(achievement => renderAchievementCard(achievement))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
