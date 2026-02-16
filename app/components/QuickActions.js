'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from '../lib/i18n';

export default function QuickActions() {
  const router = useRouter();
  const t = useTranslations('home');

  const actions = [
    { icon: '🎯', label: t('newObjective'), action: () => router.push('/coach'), color: '#fbbf24' },
    { icon: '⚔️', label: t('createQuest'), action: () => router.push('/quests'), color: '#22c55e' },
    { icon: '✅', label: t('addTask'), action: () => router.push('/tasks'), color: '#3b82f6' },
    { icon: '📝', label: t('dailyCheckin'), action: () => router.push('/daily'), color: '#8b5cf6' },
  ];

  return (
    <div className="quick-actions">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.action}
          className="quick-card"
          style={{ borderColor: `${action.color}44` }}
        >
          <div style={{ fontSize: '1.9rem' }}>{action.icon}</div>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{action.label}</p>
        </button>
      ))}
    </div>
  );
}
