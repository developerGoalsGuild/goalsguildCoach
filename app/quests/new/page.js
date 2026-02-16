'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '../../lib/auth-helpers';
import TopNavigation from '../../components/TopNavigation';
import Modal from '../../components/Modal';
import { useTranslations } from '../../lib/i18n';

export default function NewQuestPage() {
  const router = useRouter();
  const t = useTranslations('quests');
  const tc = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [objectives, setObjectives] = useState([]);
  const [loadingObjectives, setLoadingObjectives] = useState(true);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [creatingFromPreview, setCreatingFromPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    target_date: '',
    xp_reward: 100
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authFetch('/api/goals');
        if (res.ok) {
          const data = await res.json();
          setObjectives(data.goals || []);
          if (data.goals?.length === 1) setSelectedObjectiveId(String(data.goals[0].id));
        }
      } catch (err) {
        console.error('Failed to load objectives:', err);
      } finally {
        setLoadingObjectives(false);
      }
    };
    load();
  }, []);

  const handleGenerateWithAI = async () => {
    if (!selectedObjectiveId) {
      alert(t('chooseObjectiveFirst'));
      return;
    }
    setAiGenerating(true);
    try {
      const res = await authFetch('/api/quests/generate-with-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectiveId: selectedObjectiveId, preview: true })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.preview && data.quest) {
        setPreviewData({ ...data, objectiveId: selectedObjectiveId });
        setShowPreviewModal(true);
        return;
      }
      alert(data.error || t('generateWithAINoQuest'));
    } catch (err) {
      console.error('Generate with AI:', err);
      alert(t('generateWithAIError'));
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApprovePreview = async () => {
    if (!previewData) return;
    setCreatingFromPreview(true);
    try {
      const res = await authFetch('/api/quests/create-from-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectiveId: previewData.objectiveId,
          quest: previewData.quest,
          milestones: previewData.milestones,
          tasks: previewData.tasks
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.quest?.id) {
        setShowPreviewModal(false);
        setPreviewData(null);
        router.push(`/quests/${data.quest.id}`);
        return;
      }
      alert(data.error || t('createError'));
    } catch (err) {
      console.error('Create from preview:', err);
      alert(t('createError'));
    } finally {
      setCreatingFromPreview(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authFetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/quests/${data.quest.id}`);
      } else {
        alert(t('createError'));
      }
    } catch (error) {
      console.error('Failed to create quest:', error);
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
              ➕ {t('createPageTitle')}
            </h1>
            <p style={{ fontSize: '1rem', color: '#9ca3af' }}>
              {t('createPageSubtitle')}
            </p>
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <p style={{ fontSize: '0.875rem', color: '#d1d5db', marginBottom: '0.75rem' }}>
                {t('generateWithAIDescription')}
              </p>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                {t('chooseObjectiveLabel')} *
              </label>
              {loadingObjectives ? (
                <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.75rem' }}>{tc('loading')}</p>
              ) : objectives.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.75rem' }}>
                  {t('noObjectives')} <Link href="/objectives" style={{ color: '#8b5cf6', textDecoration: 'underline' }}>{t('createObjectiveFirst')}</Link>
                </p>
              ) : (
                <>
                  <select
                    value={selectedObjectiveId}
                    onChange={(e) => setSelectedObjectiveId(e.target.value)}
                    required
                    style={{ width: '100%', marginBottom: '0.75rem', background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.6rem 1rem', color: '#ededed', fontSize: '0.875rem' }}
                  >
                    <option value="">{t('selectObjectivePlaceholder')}</option>
                    {objectives.map((obj) => (
                      <option key={obj.id} value={obj.id}>
                        {obj.title || 'Untitled'}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleGenerateWithAI}
                    disabled={aiGenerating || !selectedObjectiveId}
                    style={{
                      padding: '0.6rem 1.25rem',
                      background: aiGenerating || !selectedObjectiveId ? '#374151' : '#8b5cf6',
                      color: '#fff',
                      fontWeight: '500',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: aiGenerating || !selectedObjectiveId ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    {aiGenerating ? t('generatingWithAI') : `✨ ${t('generateWithAI')}`}
                  </button>
                </>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ background: '#1f2937', borderRadius: '0.75rem', padding: '2rem', border: '1px solid #374151' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                {t('titleLabel')}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('titlePlaceholder')}
                required
                style={{ width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#ededed', fontSize: '0.875rem' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                {t('titleHint')}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                {t('descriptionLabel')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('descriptionPlaceholder')}
                rows="4"
                style={{ width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#ededed', fontSize: '0.875rem', resize: 'vertical' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                {t('descriptionHint')}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                {t('difficultyLabel')}
              </label>
              <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, difficulty: 'easy' })}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid',
                    background: formData.difficulty === 'easy' ? '#22c55e' : '#111827',
                    color: formData.difficulty === 'easy' ? '#fff' : '#d1d5db',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    borderColor: formData.difficulty === 'easy' ? '#22c55e' : '#374151'
                  }}
                >
                  {t('difficultyEasy')}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, difficulty: 'medium' })}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid',
                    background: formData.difficulty === 'medium' ? '#f59e0b' : '#111827',
                    color: formData.difficulty === 'medium' ? '#000' : '#d1d5db',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    borderColor: formData.difficulty === 'medium' ? '#f59e0b' : '#374151'
                  }}
                >
                  {t('difficultyMedium')}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, difficulty: 'hard' })}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid',
                    background: formData.difficulty === 'hard' ? '#ef4444' : '#111827',
                    color: formData.difficulty === 'hard' ? '#fff' : '#d1d5db',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    borderColor: formData.difficulty === 'hard' ? '#ef4444' : '#374151'
                  }}
                >
                  {t('difficultyHard')}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, difficulty: 'epic' })}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid',
                    gridColumn: '1 / -1',
                    background: formData.difficulty === 'epic' ? '#8b5cf6' : '#111827',
                    color: formData.difficulty === 'epic' ? '#fff' : '#d1d5db',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    borderColor: formData.difficulty === 'epic' ? '#8b5cf6' : '#374151'
                  }}
                >
                  {t('difficultyEpic')}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                {t('targetDateLabel')} *
              </label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                required
                min={new Date().toISOString().slice(0, 10)}
                style={{ width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#ededed', fontSize: '0.875rem' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                {t('targetDateHint')}
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
                disabled={loading || !formData.title || !formData.target_date}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  background: loading || !formData.title || !formData.target_date ? '#374151' : '#f59e0b',
                  color: loading || !formData.title || !formData.target_date ? '#9ca3af' : '#000',
                  fontWeight: '600',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: loading || !formData.title || !formData.target_date ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {loading ? t('creating') : t('createButton')}
              </button>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#111827', borderRadius: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#d1d5db', marginBottom: '0.5rem' }}>
                💡 {t('tipsTitle')}
              </h3>
              <ul style={{ fontSize: '0.75rem', color: '#9ca3af', lineHeight: '1.6', paddingLeft: '1rem' }}>
                <li style={{ marginBottom: '0.25rem' }}>{t('tip1')}</li>
                <li style={{ marginBottom: '0.25rem' }}>{t('tip2')}</li>
                <li style={{ marginBottom: '0.25rem' }}>{t('tip3')}</li>
                <li>{t('tip4')}</li>
              </ul>
            </div>
          </form>

          <Link href="/quests" style={{ display: 'inline-block', marginTop: '1rem', color: '#9ca3af', fontSize: '0.875rem', textDecoration: 'none' }}>
            {t('backToQuests')}
          </Link>
        </div>
      </div>

      {showPreviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1f2937',
            borderRadius: '0.75rem',
            padding: '2rem',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '1rem' }}>
              {t('previewQuestTitle')}
            </h2>
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
              {previewData && (
                <div style={{ padding: '0.5rem 0' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#d1d5db', marginBottom: '0.5rem' }}>{t('previewQuestLabel')}</h3>
                    <div style={{ background: '#111827', borderRadius: '0.5rem', padding: '1rem', border: '1px solid #374151' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#fbbf24', marginBottom: '0.5rem' }}>{previewData.quest.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem', whiteSpace: 'pre-wrap' }}>{previewData.quest.description || '-'}</div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                        <span>{t('difficultyLabel')}: <strong>{previewData.quest.difficulty}</strong></span>
                        <span>{t('targetDateLabel').replace(' *', '')}: <strong>{new Date(previewData.quest.target_date).toLocaleDateString('pt-BR')}</strong></span>
                        <span>XP: <strong>{previewData.quest.xp_reward}</strong></span>
                      </div>
                    </div>
                  </div>

                  {previewData.milestones && previewData.milestones.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#d1d5db', marginBottom: '0.5rem' }}>{t('previewMilestonesLabel')} ({previewData.milestones.length})</h3>
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {previewData.milestones.map((m, i) => (
                          <div key={i} style={{ background: '#111827', borderRadius: '0.5rem', padding: '0.75rem', border: '1px solid #374151', fontSize: '0.75rem' }}>
                            <div style={{ color: '#d1d5db', fontWeight: '500' }}>{i + 1}. {m.title}</div>
                            {m.description && <div style={{ color: '#9ca3af', marginTop: '0.25rem' }}>{m.description}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {previewData.tasks && previewData.tasks.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#d1d5db', marginBottom: '0.5rem' }}>{t('previewTasksLabel')} ({previewData.tasks.length})</h3>
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {previewData.tasks.map((task, i) => (
                          <div key={i} style={{ background: '#111827', borderRadius: '0.5rem', padding: '0.75rem', border: '1px solid #374151', fontSize: '0.75rem' }}>
                            <div style={{ color: '#d1d5db' }}>• {task.title}</div>
                            {task.description && <div style={{ color: '#9ca3af', marginTop: '0.25rem', fontSize: '0.7rem' }}>{task.description}</div>}
                            <div style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.7rem' }}>
                              {t('estimatedHours')}: {task.estimated_hours}h {task.is_recurring && '🔄 ' + t('recurring')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid #374151', paddingTop: '1rem' }}>
              <button
                onClick={() => { setShowPreviewModal(false); setPreviewData(null); }}
                disabled={creatingFromPreview}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#374151',
                  color: '#d1d5db',
                  fontWeight: '500',
                  borderRadius: '0.5rem',
                  border: '1px solid #4b5563',
                  cursor: creatingFromPreview ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {tc('cancel')}
              </button>
              <button
                onClick={handleApprovePreview}
                disabled={creatingFromPreview}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: creatingFromPreview ? '#374151' : '#f59e0b',
                  color: '#fff',
                  fontWeight: '600',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: creatingFromPreview ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {creatingFromPreview ? tc('loading') : t('approveAndCreate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
