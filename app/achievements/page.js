'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNavigation from '../components/TopNavigation';

export default function AchievementsPage() {
  const router = useRouter();
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
      const response = await fetch('/api/achievements');
      const data = await response.json();
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
      const response = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
        setNewlyUnlocked(data.newlyUnlocked);
        
        // Mostrar alertas
        data.newlyUnlocked.forEach(achievement => {
          setTimeout(() => {
            alert(`🏆 Achievement Desbloqueado: ${achievement.name}!`);
          }, newlyUnlocked.indexOf(achievement) * 500);
        });

        // Recarregar achievements
        setTimeout(() => {
          fetchAchievements();
        }, newlyUnlocked.length * 500 + 500);
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a', color: '#ededed' }}>
        <div>Carregando achievements...</div>
      </div>
    );
  }

  const renderAchievementCard = (achievement) => {
    const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;
    const isUnlocked = achievement.unlocked;

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
        title={achievement.description}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '2rem', marginRight: '0.5rem' }}>
            {achievement.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: isUnlocked ? '#fbbf24' : '#9ca3af' }}>
              {achievement.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              {achievement.description}
            </div>
          </div>
        </div>

        {!isUnlocked && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
              <span>Progresso</span>
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
            Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <TopNavigation />
      <div style={{ display: 'flex', minHeight: '100vh', paddingBottom: isMobile ? '80px' : undefined, background: '#0a0a0a', color: '#ededed', paddingTop: '60px' }}>
      {/* Sidebar - oculto no mobile */}
      <div style={{ display: isMobile ? 'none' : 'block', width: '280px', background: '#111827', borderRight: '1px solid #1f2937', padding: '1rem' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            background: '#1f2937',
            border: '1px solid #374151',
            color: '#d1d5db',
            fontSize: '0.875rem',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '0.5rem'
          }}
        >
          ← Voltar
        </button>

        <button
          onClick={checkAchievements}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            background: '#fbbf24',
            color: '#000',
            fontWeight: '600',
            fontSize: '0.875rem',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          🏆 Verificar Achievements
        </button>

        <div style={{ padding: '1rem', background: '#1f2937', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
            PROGRESSO GERAL
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.25rem' }}>
            {stats?.unlocked || 0} / {stats?.total || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#d1d5db', marginBottom: '0.5rem' }}>
            {stats?.percentage || 0}% completado
          </div>
          <div style={{ width: '100%', height: '8px', background: '#374151', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${stats?.percentage || 0}%`,
                height: '100%',
                background: '#fbbf24',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        {grouped && (
          <>
            {grouped.quests && grouped.quests.length > 0 && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#1f2937', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                  🎯 QUESTS
                </div>
                <div style={{ fontSize: '1.125rem', color: '#d1d5db' }}>
                  {grouped.quests.filter(a => a.unlocked).length} / {grouped.quests.length}
                </div>
              </div>
            )}

            {grouped.xp && grouped.xp.length > 0 && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#1f2937', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                  ⭐ XP
                </div>
                <div style={{ fontSize: '1.125rem', color: '#d1d5db' }}>
                  {grouped.xp.filter(a => a.unlocked).length} / {grouped.xp.length}
                </div>
              </div>
            )}

            {grouped.streak && grouped.streak.length > 0 && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#1f2937', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                  🔥 STREAK
                </div>
                <div style={{ fontSize: '1.125rem', color: '#d1d5db' }}>
                  {grouped.streak.filter(a => a.unlocked).length} / {grouped.streak.length}
                </div>
              </div>
            )}

            {grouped.objectives && grouped.objectives.length > 0 && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#1f2937', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                  🎯 OBJETIVOS
                </div>
                <div style={{ fontSize: '1.125rem', color: '#d1d5db' }}>
                  {grouped.objectives.filter(a => a.unlocked).length} / {grouped.objectives.length}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '1rem' }}>
          🏆 Achievements
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '2rem' }}>
          Complete desafios e desbloqueie conquistas!
        </p>

        {newlyUnlocked.length > 0 && (
          <div style={{ padding: '1rem', background: '#10b981', borderRadius: '0.5rem', marginBottom: '2rem' }}>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#000', marginBottom: '0.5rem' }}>
              🎉 Parabéns! Você desbloqueou:
            </div>
            {newlyUnlocked.map(achievement => (
              <div key={achievement.id} style={{ fontSize: '0.875rem', color: '#000', marginBottom: '0.25rem' }}>
                • {achievement.name}
              </div>
            ))}
          </div>
        )}

        {grouped && grouped.quests && grouped.quests.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#d1d5db', marginBottom: '1rem' }}>
              🎯 Quests
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {grouped.quests.map(achievement => renderAchievementCard(achievement))}
            </div>
          </div>
        )}

        {grouped && grouped.xp && grouped.xp.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#d1d5db', marginBottom: '1rem' }}>
              ⭐ XP
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {grouped.xp.map(achievement => renderAchievementCard(achievement))}
            </div>
          </div>
        )}

        {grouped && grouped.streak && grouped.streak.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#d1d5db', marginBottom: '1rem' }}>
              🔥 Streak
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {grouped.streak.map(achievement => renderAchievementCard(achievement))}
            </div>
          </div>
        )}

        {grouped && grouped.objectives && grouped.objectives.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#d1d5db', marginBottom: '1rem' }}>
              🎯 Objetivos NLP
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {grouped.objectives.map(achievement => renderAchievementCard(achievement))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
