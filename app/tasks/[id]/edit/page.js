'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopNavigation from '../../../components/TopNavigation';
import { authFetch } from '../../../lib/auth-helpers';
import { useTranslations } from '../../../lib/i18n';

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('tasks');
  const tc = useTranslations('common');
  const taskId = params?.id;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [quests, setQuests] = useState([]);
  const [loadingQuests, setLoadingQuests] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quest_id: '',
    estimated_hours: '',
  });

  useEffect(() => {
    if (!taskId) return;
    loadTaskAndQuests();
  }, [taskId]);

  const loadTaskAndQuests = async () => {
    setLoadingData(true);
    setLoadingQuests(true);
    try {
      const [taskRes, questsRes] = await Promise.all([authFetch(`/api/tasks/${taskId}`), authFetch('/api/quests')]);

      if (!taskRes.ok) {
        alert(t('loadTaskError'));
        router.push('/tasks');
        return;
      }

      const taskData = await taskRes.json();
      const task = taskData.task;

      if (task?.status === 'completed') {
        router.push('/tasks');
        return;
      }

      setFormData({
        title: task?.title || '',
        description: task?.description || '',
        quest_id: task?.quest_id || '',
        estimated_hours: task?.estimated_hours ?? '',
      });

      if (questsRes.ok) {
        const questsData = await questsRes.json();
        setQuests(questsData.quests || []);
      }
    } catch (error) {
      console.error('Failed to load task edit data:', error);
      alert(t('loadTaskError'));
      router.push('/tasks');
    } finally {
      setLoadingData(false);
      setLoadingQuests(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskId) return;

    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description || '',
        quest_id: formData.quest_id || null,
        estimated_hours: formData.estimated_hours === '' ? null : parseFloat(formData.estimated_hours),
      };

      const res = await authFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || t('updateTaskError'));
        return;
      }

      router.push('/tasks');
    } catch (error) {
      console.error('Failed to update task:', error);
      alert(t('updateTaskError'));
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
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.5rem' }}>✏️ {t('editTask')}</h1>
            <p style={{ fontSize: '1rem', color: '#9ca3af' }}>{t('subtitle')}</p>
          </div>

          {loadingData ? (
            <div style={{ background: '#1f2937', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #374151' }}>{tc('loading')}</div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: '#1f2937', borderRadius: '0.75rem', padding: '2rem', border: '1px solid #374151' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>{t('taskTitleLabel')}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('taskTitlePlaceholder')}
                  required
                  style={{ width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#ededed', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>{t('taskDescriptionLabel')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('taskDescriptionPlaceholder')}
                  rows={3}
                  style={{ width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#ededed', fontSize: '0.875rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>{t('questLabel')}</label>
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
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>{t('estimatedHoursLabel')}</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                  placeholder={t('estimatedHoursPlaceholder')}
                  style={{ width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#ededed', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => router.push('/tasks')}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    background: '#1f2937',
                    color: '#d1d5db',
                    fontWeight: '500',
                    borderRadius: '0.5rem',
                    border: '1px solid #374151',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  {tc('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.title.trim()}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    background: loading || !formData.title.trim() ? '#374151' : '#22c55e',
                    color: loading || !formData.title.trim() ? '#9ca3af' : '#fff',
                    fontWeight: '600',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: loading || !formData.title.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  {loading ? '...' : t('updateTask')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
