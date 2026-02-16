'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '../../lib/auth-helpers';
import TopNavigation from '../../components/TopNavigation';
import { useTranslations } from '../../lib/i18n';

export default function NewTaskPage() {
  const router = useRouter();
  const t = useTranslations('tasks');
  const tc = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [quests, setQuests] = useState([]);
  const [loadingQuests, setLoadingQuests] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quest_id: '',
    estimated_hours: ''
  });

  useEffect(() => {
    const loadQuests = async () => {
      try {
        const res = await authFetch('/api/quests');
        if (res.ok) {
          const data = await res.json();
          setQuests(data.quests || []);
        }
      } catch (err) {
        console.error('Failed to load quests:', err);
      } finally {
        setLoadingQuests(false);
      }
    };
    loadQuests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description || '',
        quest_id: formData.quest_id || null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null
      };
      const res = await authFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        router.push('/tasks');
      } else {
        const err = await res.json();
        alert(err.error || t('createError'));
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      alert(t('createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopNavigation />
      <div style={{ paddingTop: '60px', minHeight: '100vh', background: '#0a0a0a', color: '#ededed' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.5rem' }}>
              ➕ {t('newPageTitle')}
            </h1>
            <p style={{ fontSize: '1rem', color: '#9ca3af' }}>
              {t('newPageSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ background: '#1f2937', borderRadius: '0.75rem', padding: '2rem', border: '1px solid #374151' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                {t('taskTitleLabel')}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('taskTitlePlaceholder')}
                required
                style={{ width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#ededed', fontSize: '0.875rem' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                {t('titleHint')}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                {t('taskDescriptionLabel')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('taskDescriptionPlaceholder')}
                rows="3"
                style={{ width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#ededed', fontSize: '0.875rem', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                {t('questLabel')}
              </label>
              <select
                value={formData.quest_id}
                onChange={(e) => setFormData({ ...formData, quest_id: e.target.value })}
                style={{ width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#ededed', fontSize: '0.875rem' }}
              >
                <option value="">{t('noQuest')}</option>
                {loadingQuests ? (
                  <option disabled>{t('loadingQuests')}</option>
                ) : (
                  quests.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title}
                    </option>
                  ))
                )}
              </select>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                {t('questHint')}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                {t('estimatedHoursLabel')}
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                placeholder={t('estimatedHoursPlaceholder')}
                style={{ width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#ededed', fontSize: '0.875rem' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                {t('estimatedHoursHint')}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => router.back()}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  background: '#1f2937',
                  color: '#d1d5db',
                  fontWeight: '500',
                  borderRadius: '0.5rem',
                  border: '1px solid #374151',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {tc('cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  background: loading || !formData.title ? '#374151' : '#22c55e',
                  color: loading || !formData.title ? '#9ca3af' : '#fff',
                  fontWeight: '600',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: loading || !formData.title ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {loading ? t('creating') : t('createTask')}
              </button>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#111827', borderRadius: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#d1d5db', marginBottom: '0.5rem' }}>
                💡 {t('tipsTitle')}
              </h3>
              <ul style={{ fontSize: '0.75rem', color: '#9ca3af', lineHeight: '1.6', paddingLeft: '1rem' }}>
                <li style={{ marginBottom: '0.25rem' }}>{t('newTip1')}</li>
                <li style={{ marginBottom: '0.25rem' }}>{t('newTip2')}</li>
                <li style={{ marginBottom: '0.25rem' }}>{t('newTip3')}</li>
                <li>{t('newTip4')}</li>
              </ul>
            </div>
          </form>

          <Link href="/tasks" style={{ display: 'inline-block', marginTop: '1rem', color: '#9ca3af', fontSize: '0.875rem', textDecoration: 'none' }}>
            ← {t('backToTasks')}
          </Link>
        </div>
      </div>
    </>
  );
}
