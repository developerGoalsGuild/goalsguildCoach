'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNavigation from '../components/TopNavigation';
import { useLocale, useTranslations } from '../lib/i18n';

export default function ObjectivesPage() {
  const router = useRouter();
  const t = useTranslations('objectives');
  const tc = useTranslations('common');
  const { locale } = useLocale();
  const [objectives, setObjectives] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [selectedObjective, setSelectedObjective] = useState(null);
  const [memoryEntries, setMemoryEntries] = useState([]);
  const [nlpMemory, setNlpMemory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMemory, setShowMemory] = useState(false);
  const [filterMode, setFilterMode] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newObjective, setNewObjective] = useState({
    title: '',
    description: '',
    target_date: '',
    category: '',
    nlp_criteria_positive: '',
    nlp_criteria_sensory: '',
    nlp_criteria_compelling: '',
    nlp_criteria_ecology: '',
    nlp_criteria_self_initiated: '',
    nlp_criteria_context: '',
    nlp_criteria_resources: '',
    nlp_criteria_evidence: ''
  });

  useEffect(() => {
    fetchObjectives();
    fetchReminders();
  }, []);

  const fetchObjectives = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/goals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setObjectives(data.goals || []);
    } catch (error) {
      console.error('Error fetching objectives:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/reminders');
      const data = await response.json();
      setReminders(data.reminders || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const fetchMemoryEntries = async (objectiveId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/goals/${objectiveId}/memory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMemoryEntries(data.entries || []);
      setNlpMemory(data.nlpMemory || null);
    } catch (error) {
      console.error('Error fetching memory entries:', error);
    }
  };

  const createQuest = async (objectiveId) => {
    if (!confirm(t('createQuestConfirm'))) return;
    try {
      const response = await fetch('/api/quests/from-objective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectiveId }),
      });
      if (response.ok) {
        const data = await response.json();
        alert(t('questCreated').replace('{count}', String(data.milestones || 0)));
        router.push('/quests');
      } else {
        alert(t('createQuestError'));
      }
    } catch (error) {
      console.error('Error creating quest:', error);
      alert(t('createQuestError'));
    }
  };

  const deleteObjective = async (objectiveId) => {
    if (!confirm(t('deleteObjectiveConfirm'))) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/goals/${objectiveId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchObjectives();
        fetchReminders();
      }
    } catch (error) {
      console.error('Error deleting objective:', error);
    }
  };

  const deleteReminder = async (reminderId) => {
    if (!confirm(t('stopReminderConfirm'))) return;
    try {
      const response = await fetch(`/api/reminders?id=${reminderId}`, { method: 'DELETE' });
      if (response.ok) fetchReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const handleCreateObjective = async (e) => {
    e.preventDefault();
    if (!newObjective.title.trim()) {
      alert(t('titleRequired') || 'Título é obrigatório');
      return;
    }

    // Validar todos os campos NLP obrigatórios
    const requiredNLPFields = [
      'nlp_criteria_positive',
      'nlp_criteria_sensory',
      'nlp_criteria_compelling',
      'nlp_criteria_ecology',
      'nlp_criteria_self_initiated',
      'nlp_criteria_context',
      'nlp_criteria_resources',
      'nlp_criteria_evidence'
    ];

    const missingFields = requiredNLPFields.filter(field => !newObjective[field]?.trim());
    if (missingFields.length > 0) {
      alert(t('allNLPFieldsRequired') || 'Todos os campos NLP são obrigatórios');
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newObjective.title.trim(),
          description: newObjective.description.trim() || null,
          target_date: newObjective.target_date || null,
          category: newObjective.category || null,
          is_nlp_complete: true,
          nlp_criteria_positive: newObjective.nlp_criteria_positive.trim(),
          nlp_criteria_sensory: newObjective.nlp_criteria_sensory.trim(),
          nlp_criteria_compelling: newObjective.nlp_criteria_compelling.trim(),
          nlp_criteria_ecology: newObjective.nlp_criteria_ecology.trim(),
          nlp_criteria_self_initiated: newObjective.nlp_criteria_self_initiated.trim(),
          nlp_criteria_context: newObjective.nlp_criteria_context.trim(),
          nlp_criteria_resources: newObjective.nlp_criteria_resources.trim(),
          nlp_criteria_evidence: newObjective.nlp_criteria_evidence.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(t('objectiveCreated') || 'Objetivo NLP completo criado com sucesso!');
        setShowCreateForm(false);
        setNewObjective({
          title: '',
          description: '',
          target_date: '',
          category: '',
          nlp_criteria_positive: '',
          nlp_criteria_sensory: '',
          nlp_criteria_compelling: '',
          nlp_criteria_ecology: '',
          nlp_criteria_self_initiated: '',
          nlp_criteria_context: '',
          nlp_criteria_resources: '',
          nlp_criteria_evidence: ''
        });
        fetchObjectives();
      } else {
        const error = await response.json();
        alert(error.error || t('createError') || 'Erro ao criar objetivo');
      }
    } catch (error) {
      console.error('Error creating objective:', error);
      alert(t('createError') || 'Erro ao criar objetivo');
    } finally {
      setCreating(false);
    }
  };

  const openMemory = async (objective) => {
    setSelectedObjective(objective);
    setShowMemory(true);
    await fetchMemoryEntries(objective.id);
  };

  const closeMemory = () => {
    setShowMemory(false);
    setSelectedObjective(null);
    setMemoryEntries([]);
    setNlpMemory(null);
  };

  const filteredObjectives = objectives.filter((obj) => {
    const title = (obj.title || obj.statement || '').toLowerCase();
    const description = (obj.description || '').toLowerCase();
    const query = search.trim().toLowerCase();

    const matchesSearch = !query || title.includes(query) || description.includes(query);
    if (!matchesSearch) return false;

    if (filterMode === 'nlp') return Boolean(obj.is_nlp_complete);
    if (filterMode === 'in_progress') return !obj.is_nlp_complete;
    return true;
  });

  if (showMemory && selectedObjective) {
    return (
      <div className="app-shell">
        <TopNavigation />
        <main className="page-container">
          <button onClick={closeMemory} className="btn btn-dark" style={{ marginBottom: '0.8rem' }}>
            ← {t('backToObjectives')}
          </button>
          <section className="glass-card" style={{ padding: '1rem', marginBottom: '0.8rem' }}>
            <h1 style={{ color: 'var(--accent-soft)', marginBottom: '0.4rem' }}>📝 {t('memoryTitle')}</h1>
            <p style={{ color: 'var(--text-soft)' }}>{selectedObjective.statement || selectedObjective.title}</p>
          </section>

          {nlpMemory && (
            <section className="glass-card" style={{ padding: '1rem', marginBottom: '0.8rem' }}>
              <p style={{ color: 'var(--accent-soft)', fontWeight: 700, marginBottom: '0.4rem' }}>{t('talkCoach')}</p>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{nlpMemory.content}</p>
            </section>
          )}

          <section style={{ display: 'grid', gap: '0.7rem' }}>
            {memoryEntries.map((entry) => (
              <article key={entry.id} className="feature-card">
                <p style={{ color: 'var(--text-soft)', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                  {new Date(entry.created_at).toLocaleDateString(locale)} · {entry.entry_type}
                </p>
                {entry.entry_type === 'task_completed' && (
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--accent-soft)', marginBottom: '0.25rem' }}>
                      ✅ {t('taskCompleted')}: {entry.content?.task_title || t('taskDefault')}
                    </p>
                    {entry.content?.observation && (
                      <p style={{ color: 'var(--text-soft)', fontStyle: 'italic' }}>
                        {t('observation')}: {entry.content.observation}
                      </p>
                    )}
                  </div>
                )}

                {entry.entry_type === 'milestone_completed' && (
                  <div>
                    <p style={{ fontWeight: 700, color: '#93c5fd', marginBottom: '0.25rem' }}>
                      📍 {t('milestone')}: {entry.content?.milestone_title || t('milestoneDefault')}
                    </p>
                    {entry.content?.reflection && (
                      <p style={{ color: 'var(--text-soft)', fontStyle: 'italic' }}>
                        {t('reflection')}: {entry.content.reflection}
                      </p>
                    )}
                  </div>
                )}

                {entry.content?.gratitude && <p>🙏 {entry.content.gratitude}</p>}
                {entry.content?.highlights && <p>✨ {entry.content.highlights}</p>}
                {entry.content?.challenges && <p>⚠️ {entry.content.challenges}</p>}
                {entry.content?.tomorrow_goals && <p>🚀 {entry.content.tomorrow_goals}</p>}
              </article>
            ))}
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
          <h1>🎯 {t('title')}</h1>
          <p>{t('headerSubtitle')}</p>
        </section>

        <section className="glass-card" style={{ padding: '1rem', marginBottom: '0.9rem' }}>
          <p style={{ color: 'var(--text-soft)', marginBottom: '0.45rem' }}>{t('actions')}</p>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: showCreateForm ? '0.75rem' : '0' }}>
            <button onClick={() => setShowCreateForm(!showCreateForm)} className={`btn ${showCreateForm ? 'btn-primary' : 'btn-dark'}`}>
              ➕ {t('createManual')}
            </button>
            <button onClick={() => router.push('/coach')} className="btn btn-dark">
              🤖 {t('talkCoach')}
            </button>
            <Link href="/reminders/new" className="btn btn-dark">
              🔔 {t('newReminder')}
            </Link>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateObjective} style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#111827',
              borderRadius: '0.5rem',
              border: '1px solid #374151',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h3 style={{ color: '#fbbf24', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                📋 {t('basicInfo')}
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                  {t('title')} *
                </label>
                <input
                  type="text"
                  value={newObjective.title}
                  onChange={(e) => setNewObjective({ ...newObjective, title: e.target.value })}
                  required
                  placeholder={t('titlePlaceholder')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    color: '#d1d5db',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                  {t('description')}
                </label>
                <textarea
                  value={newObjective.description}
                  onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
                  placeholder={t('descriptionPlaceholder')}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    color: '#d1d5db',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                    {t('targetDate')}
                  </label>
                  <input
                    type="date"
                    value={newObjective.target_date}
                    onChange={(e) => setNewObjective({ ...newObjective, target_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#1f2937',
                      border: '1px solid #374151',
                      color: '#d1d5db',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                    {t('category')}
                  </label>
                  <select
                    value={newObjective.category}
                    onChange={(e) => setNewObjective({ ...newObjective, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#1f2937',
                      border: '1px solid #374151',
                      color: '#d1d5db',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">{t('selectCategory')}</option>
                    <option value="career">{t('categoryCareer')}</option>
                    <option value="health">{t('categoryHealth')}</option>
                    <option value="fitness">{t('categoryFitness')}</option>
                    <option value="learning">{t('categoryLearning')}</option>
                    <option value="finance">{t('categoryFinance')}</option>
                    <option value="relationships">{t('categoryRelationships')}</option>
                    <option value="other">{t('categoryOther')}</option>
                  </select>
                </div>
              </div>

              <h3 style={{ color: '#fbbf24', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', marginTop: '1.5rem', borderTop: '1px solid #374151', paddingTop: '1rem' }}>
                🎯 {t('nlpCriteria')} (8 Critérios NLP)
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                  1. {t('nlpPositive')} *
                </label>
                <textarea
                  value={newObjective.nlp_criteria_positive}
                  onChange={(e) => setNewObjective({ ...newObjective, nlp_criteria_positive: e.target.value })}
                  required
                  placeholder={t('nlpPositivePlaceholder')}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    color: '#d1d5db',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{t('nlpPositiveHint')}</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                  2. {t('nlpSensory')} *
                </label>
                <textarea
                  value={newObjective.nlp_criteria_sensory}
                  onChange={(e) => setNewObjective({ ...newObjective, nlp_criteria_sensory: e.target.value })}
                  required
                  placeholder={t('nlpSensoryPlaceholder')}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    color: '#d1d5db',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{t('nlpSensoryHint')}</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                  3. {t('nlpCompelling')} *
                </label>
                <textarea
                  value={newObjective.nlp_criteria_compelling}
                  onChange={(e) => setNewObjective({ ...newObjective, nlp_criteria_compelling: e.target.value })}
                  required
                  placeholder={t('nlpCompellingPlaceholder')}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    color: '#d1d5db',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{t('nlpCompellingHint')}</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                  4. {t('nlpEcology')} *
                </label>
                <textarea
                  value={newObjective.nlp_criteria_ecology}
                  onChange={(e) => setNewObjective({ ...newObjective, nlp_criteria_ecology: e.target.value })}
                  required
                  placeholder={t('nlpEcologyPlaceholder')}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    color: '#d1d5db',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{t('nlpEcologyHint')}</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                  5. {t('nlpSelfInitiated')} *
                </label>
                <textarea
                  value={newObjective.nlp_criteria_self_initiated}
                  onChange={(e) => setNewObjective({ ...newObjective, nlp_criteria_self_initiated: e.target.value })}
                  required
                  placeholder={t('nlpSelfInitiatedPlaceholder')}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    color: '#d1d5db',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{t('nlpSelfInitiatedHint')}</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                  6. {t('nlpContext')} *
                </label>
                <textarea
                  value={newObjective.nlp_criteria_context}
                  onChange={(e) => setNewObjective({ ...newObjective, nlp_criteria_context: e.target.value })}
                  required
                  placeholder={t('nlpContextPlaceholder')}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    color: '#d1d5db',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{t('nlpContextHint')}</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                  7. {t('nlpResources')} *
                </label>
                <textarea
                  value={newObjective.nlp_criteria_resources}
                  onChange={(e) => setNewObjective({ ...newObjective, nlp_criteria_resources: e.target.value })}
                  required
                  placeholder={t('nlpResourcesPlaceholder')}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    color: '#d1d5db',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{t('nlpResourcesHint')}</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                  8. {t('nlpEvidence')} *
                </label>
                <textarea
                  value={newObjective.nlp_criteria_evidence}
                  onChange={(e) => setNewObjective({ ...newObjective, nlp_criteria_evidence: e.target.value })}
                  required
                  placeholder={t('nlpEvidencePlaceholder')}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    color: '#d1d5db',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{t('nlpEvidenceHint')}</p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid #374151', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewObjective({
                      title: '',
                      description: '',
                      target_date: '',
                      category: '',
                      nlp_criteria_positive: '',
                      nlp_criteria_sensory: '',
                      nlp_criteria_compelling: '',
                      nlp_criteria_ecology: '',
                      nlp_criteria_self_initiated: '',
                      nlp_criteria_context: '',
                      nlp_criteria_resources: '',
                      nlp_criteria_evidence: ''
                    });
                  }}
                  className="btn btn-dark"
                  disabled={creating}
                >
                  {tc('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating || !newObjective.title.trim()}
                >
                  {creating ? tc('loading') : t('create')}
                </button>
              </div>
            </form>
          )}
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '0.7rem',
            marginBottom: '0.9rem',
          }}
        >

          <div className="glass-card" style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--text-soft)', marginBottom: '0.45rem' }}>{t('remindersActive')}</p>
            {reminders.length === 0 ? (
              <p style={{ color: 'var(--text-soft)' }}>{t('noneActiveReminders')}</p>
            ) : (
              reminders.slice(0, 3).map((r) => (
                <div key={r.id} style={{ marginBottom: '0.5rem' }}>
                  <p style={{ fontSize: '0.85rem' }}>{r.statement?.substring(0, 50)}...</p>
                  <button onClick={() => deleteReminder(r.id)} className="btn btn-dark" style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem' }}>
                    {t('stop')}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="glass-card" style={{ padding: '1rem', marginBottom: '0.9rem' }}>
          <p style={{ color: 'var(--text-soft)', marginBottom: '0.45rem' }}>{t('filters')}</p>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.55rem' }}>
            <button onClick={() => setFilterMode('all')} className={`btn ${filterMode === 'all' ? 'btn-primary' : 'btn-dark'}`}>
              {t('all')}
            </button>
            <button onClick={() => setFilterMode('nlp')} className={`btn ${filterMode === 'nlp' ? 'btn-primary' : 'btn-dark'}`}>
              {t('nlpComplete')}
            </button>
            <button onClick={() => setFilterMode('in_progress')} className={`btn ${filterMode === 'in_progress' ? 'btn-primary' : 'btn-dark'}`}>
              {t('inProgress')}
            </button>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
          />
        </section>

        {isLoading ? (
          <div className="glass-card" style={{ padding: '1rem', color: 'var(--text-soft)' }}>
            {tc('loading')}
          </div>
        ) : filteredObjectives.length === 0 ? (
          <div className="glass-card" style={{ padding: '1.2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-soft)', marginBottom: '0.7rem' }}>{t('noneFiltered')}</p>
            <button onClick={() => router.push('/coach')} className="btn btn-primary">
              {t('talkCoach')}
            </button>
          </div>
        ) : (
          <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.7rem' }}>
            {filteredObjectives.map((obj) => (
              <article key={obj.id} className="feature-card">
                <h3>{obj.title || obj.statement}</h3>
                {obj.description && <p>{obj.description}</p>}
                <p style={{ fontSize: '0.8rem' }}>{obj.is_nlp_complete ? `✨ ${t('statusNlpComplete')}` : t('statusInProgress')}</p>
                <div style={{ marginTop: '0.65rem', display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  <button onClick={() => openMemory(obj)} className="btn btn-dark">
                    📝 {t('memory')}
                  </button>
                  <Link href={`/reminders/new?objectiveId=${obj.id}`} className="btn btn-dark">
                    🔔 {t('reminders')}
                  </Link>
                  <button onClick={() => createQuest(obj.id)} className="btn btn-primary">
                    {t('createQuest')}
                  </button>
                  <button onClick={() => deleteObjective(obj.id)} className="btn btn-dark">
                    🗑️ {tc('delete')}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
