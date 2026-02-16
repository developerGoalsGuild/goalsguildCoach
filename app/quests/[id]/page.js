'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { authFetch, logout, getUser } from '../../lib/auth-helpers';
import Modal from '../../components/Modal';
import TopNavigation from '../../components/TopNavigation';
import { useTranslations } from '../../lib/i18n';
import { useToast } from '../../hooks/useToast';

export default function QuestDetailPage() {
  const t = useTranslations('quests');
  const tc = useTranslations('common');
  const params = useParams();
  const questId = params?.id;
  const [questData, setQuestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneToComplete, setMilestoneToComplete] = useState(null);
  const [milestoneReflection, setMilestoneReflection] = useState('');
  const [showEditMilestoneModal, setShowEditMilestoneModal] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] = useState(null);
  const [editMilestoneTitle, setEditMilestoneTitle] = useState('');
  const [editMilestoneDescription, setEditMilestoneDescription] = useState('');
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showEditQuestModal, setShowEditQuestModal] = useState(false);
  const [editQuestTargetDate, setEditQuestTargetDate] = useState('');
  const [showCompleteQuestModal, setShowCompleteQuestModal] = useState(false);
  const [showFailQuestModal, setShowFailQuestModal] = useState(false);
  const [questFeeling, setQuestFeeling] = useState('');
  const [questReflection, setQuestReflection] = useState('');
  const [completingQuest, setCompletingQuest] = useState(false);
  const { success: showSuccess, ToastComponent } = useToast();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (questId) loadQuestData();
  }, [questId]);

  const loadQuestData = async () => {
    if (!questId) return;
    try {
      const res = await authFetch(`/api/quests/${questId}`);
      if (res.ok) {
        const data = await res.json();
        setQuestData(data);
      }
    } catch (error) {
      console.error('Failed to load quest:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCompleteMilestone = (milestone) => {
    setMilestoneToComplete(milestone);
    setMilestoneReflection('');
    setShowMilestoneModal(true);
  };

  const openEditMilestone = (milestone) => {
    setMilestoneToEdit(milestone);
    setEditMilestoneTitle(milestone?.title || '');
    setEditMilestoneDescription(milestone?.description || '');
    setShowEditMilestoneModal(true);
  };

  const openEditQuest = () => {
    if (!questData?.quest) return;
    const q = questData.quest;
    const td = q.target_date ? (typeof q.target_date === 'string' ? q.target_date.slice(0, 10) : new Date(q.target_date).toISOString().slice(0, 10)) : '';
    setEditQuestTargetDate(td);
    setShowEditQuestModal(true);
  };

  const saveEditQuest = async () => {
    if (!questId || !editQuestTargetDate || !/^\d{4}-\d{2}-\d{2}$/.test(editQuestTargetDate)) return;
    setShowEditQuestModal(false);
    setEditQuestTargetDate('');
    try {
      const res = await authFetch(`/api/quests/${questId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_date: editQuestTargetDate }),
      });
      if (res.ok) await loadQuestData();
    } catch (error) {
      console.error('Failed to update quest:', error);
    }
  };

  const saveEditMilestone = async () => {
    if (!milestoneToEdit || !editMilestoneTitle.trim()) return;
    const milestoneId = milestoneToEdit.id;
    setShowEditMilestoneModal(false);
    setMilestoneToEdit(null);
    try {
      const res = await authFetch(`/api/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editMilestoneTitle.trim(),
          description: editMilestoneDescription.trim() || '',
        }),
      });
      if (res.ok) await loadQuestData();
    } catch (error) {
      console.error('Failed to update milestone:', error);
    }
  };

  const completeTaskFromQuest = async (taskId) => {
    if (!taskId) return;
    setCompletingTaskId(taskId);
    try {
      const res = await authFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.xp_earned) showSuccess(`+${data.xp_earned} XP`);
        await loadQuestData();
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
    } finally {
      setCompletingTaskId(null);
    }
  };

  const completeMilestone = async () => {
    if (!milestoneToComplete) return;
    const milestoneId = milestoneToComplete.id;
    setShowMilestoneModal(false);
    setMilestoneToComplete(null);

    try {
      const res = await authFetch(`/api/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          ...(milestoneReflection.trim() && { reflection: milestoneReflection.trim() }),
        }),
      });

      if (res.ok) {
        await loadQuestData();
      }
    } catch (error) {
      console.error('Failed to complete milestone:', error);
    }
  };

  const openCompleteQuestModal = () => {
    setQuestFeeling('');
    setQuestReflection('');
    setShowCompleteQuestModal(true);
  };

  const openFailQuestModal = () => {
    setQuestFeeling('');
    setQuestReflection('');
    setShowFailQuestModal(true);
  };

  const completeQuest = async () => {
    if (!questFeeling.trim()) {
      alert('Por favor, descreva como você está se sentindo.');
      return;
    }

    setCompletingQuest(true);
    try {
      const res = await authFetch(`/api/quests/${questId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          feeling: questFeeling.trim(),
          reflection: questReflection.trim() || null
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.xp_earned) showSuccess(`+${data.xp_earned} XP`);
        setShowCompleteQuestModal(false);
        setQuestFeeling('');
        setQuestReflection('');
        await loadQuestData();
        setTimeout(() => {
          window.location.href = '/quests';
        }, 500);
      }
    } catch (error) {
      console.error('Failed to complete quest:', error);
      alert('Erro ao completar quest');
    } finally {
      setCompletingQuest(false);
    }
  };

  const failQuest = async () => {
    if (!questFeeling.trim()) {
      alert('Por favor, descreva como você está se sentindo.');
      return;
    }

    setCompletingQuest(true);
    try {
      const res = await authFetch(`/api/quests/${questId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          feeling: questFeeling.trim(),
          reflection: questReflection.trim() || null
        }),
      });

      if (res.ok) {
        setShowFailQuestModal(false);
        setQuestFeeling('');
        setQuestReflection('');
        alert('Quest marcada como falhada. Continue tentando! 💪');
        await loadQuestData();
        setTimeout(() => {
          window.location.href = '/quests';
        }, 500);
      }
    } catch (error) {
      console.error('Failed to fail quest:', error);
      alert('Erro ao falhar quest');
    } finally {
      setCompletingQuest(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#9ca3af' }}>
        Carregando...
      </div>
    );
  }

  if (!questData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', color: '#d1d5db', marginBottom: '1rem' }}>Quest não encontrada</h1>
        <Link href="/" style={{ color: '#f59e0b' }}>Voltar para home</Link>
      </div>
    );
  }

  const { quest, tasks, journal, parent_goal, computed } = questData;

  return (
    <>
      <TopNavigation />
      <div style={{ paddingTop: '60px', minHeight: '100vh', background: '#0a0a0a', color: '#ededed', padding: isMobile ? '1rem' : '2rem', paddingBottom: isMobile ? '80px' : '2rem' }}>
        {/* Barra no topo: voltar + progresso */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#111827', borderRadius: '0.5rem', border: '1px solid #1f2937' }}>
          <Link href="/quests" style={{ fontSize: '0.875rem', fontWeight: '600', color: '#d1d5db', textDecoration: 'none' }}>← Voltar</Link>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
              <strong>{computed?.completion_percentage || 0}%</strong> completo
            </div>
            <div style={{ flex: 1, minWidth: 120, height: '8px', background: '#374151', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#22c55e', width: `${computed?.completion_percentage || 0}%` }}></div>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Tasks: {computed?.completed_tasks || 0}/{computed?.total_tasks || 0} • XP: +{quest.xp_offered ?? quest.xp_reward ?? 100}
            </span>
          </div>
        </div>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: isMobile ? '1rem' : 0 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.5rem' }}>
                {quest.title}
              </h1>
              <p style={{ fontSize: '1rem', color: '#9ca3af', lineHeight: '1.6' }}>
                {quest.description || 'Sem descrição'}
              </p>
            </div>
            <div style={{ textAlign: isMobile ? 'left' : 'right', marginLeft: isMobile ? 0 : '2rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', background: '#1f2937', color: '#d1d5db' }}>
                  {quest.difficulty}
                </span>
              </div>
              {quest.status !== 'completed' && quest.status !== 'cancelled' && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={openCompleteQuestModal}
                    style={{ padding: '0.75rem 1.5rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
                  >
                    ✅ Completar Quest
                  </button>
                  <button
                    onClick={openFailQuestModal}
                    style={{ padding: '0.75rem 1.5rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
                  >
                    ❌ Falhar Quest
                  </button>
                </div>
              )}
              {quest.status === 'completed' && (
                <div style={{ padding: '0.5rem 1rem', background: '#22c55e', borderRadius: '0.5rem', color: '#fff', fontSize: '0.875rem' }}>
                  ✓ Quest Completa!
                </div>
              )}
              {quest.status === 'cancelled' && (
                <div style={{ padding: '0.5rem 1rem', background: '#ef4444', borderRadius: '0.5rem', color: '#fff', fontSize: '0.875rem' }}>
                  ✗ Quest Falhada
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#9ca3af', alignItems: 'center' }}>
            <div>Status: <strong style={{ color: quest.status === 'completed' ? '#22c55e' : '#fbbf24' }}>{quest.status}</strong></div>
            {quest.target_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{t('targetDateLabel').replace(' *', '')}: {new Date(quest.target_date).toLocaleDateString('pt-BR')}</span>
                {quest.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={openEditQuest}
                    style={{ padding: '0.25rem 0.5rem', background: 'transparent', color: '#8b5cf6', border: '1px solid #8b5cf6', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    ✏️ {tc('edit')}
                  </button>
                )}
              </div>
            )}
            {!quest.target_date && quest.status !== 'completed' && (
              <button
                type="button"
                onClick={openEditQuest}
                style={{ padding: '0.25rem 0.5rem', background: '#374151', color: '#d1d5db', border: '1px solid #4b5563', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem' }}
              >
                + {t('targetDateLabel').replace(' *', '')}
              </button>
            )}
            {parent_goal && (
              <div>Pai: <Link href={`/goals/${parent_goal.id}`} style={{ color: '#60a5fa' }}>{parent_goal.title}</Link></div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#d1d5db', marginBottom: '1rem' }}>
            📍 Milestones ({quest.milestones_summary?.completed || 0}/{quest.milestones_summary?.total || 0})
          </h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {quest.milestones?.map((milestone, index) => (
              <div
                key={milestone.id}
                style={{
                  background: '#1f2937',
                  border: milestone.status === 'completed' ? '1px solid #22c55e' : '1px solid #374151',
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: milestone.status === 'completed' ? '#9ca3af' : '#d1d5db', marginBottom: '0.25rem', textDecoration: milestone.status === 'completed' ? 'line-through' : 'none' }}>
                      {index + 1}. {milestone.title}
                    </div>
                    {milestone.description && (
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {milestone.description}
                      </div>
                    )}
                  </div>
                  {milestone.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => openEditMilestone(milestone)}
                        style={{ padding: '0.5rem 1rem', background: '#374151', color: '#d1d5db', borderRadius: '0.375rem', fontWeight: '500', border: '1px solid #4b5563', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        ✏️ {tc('edit')}
                      </button>
                      <button
                        onClick={() => openCompleteMilestone(milestone)}
                        style={{ padding: '0.5rem 1rem', background: '#22c55e', color: '#fff', borderRadius: '0.375rem', fontWeight: '500', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        ✓ {t('completeButton')}
                      </button>
                    </div>
                  )}
                  {milestone.status === 'completed' && (
                    <span style={{ color: '#22c55e', fontSize: '0.875rem' }}>✓</span>
                  )}
                </div>
              </div>
            ))}
            {(!quest.milestones || quest.milestones.length === 0) && (
              <p style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                Sem milestones. Adicione para quebrar a quest em etapas.
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#d1d5db', marginBottom: '1rem' }}>
            ✅ Tasks ({computed?.completed_tasks || 0}/{computed?.total_tasks || 0})
          </h2>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {tasks.map(task => (
              <div
                key={task.id}
                style={{
                  background: '#1f2937',
                  border: task.status === 'completed' ? '1px solid #22c55e' : '1px solid #374151',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: task.status === 'completed' ? '2px solid #22c55e' : '2px solid #374151',
                  background: task.status === 'completed' ? '#22c55e' : 'transparent'
                }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', color: task.status === 'completed' ? '#9ca3af' : '#d1d5db', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>
                    {task.title}
                  </div>
                  {task.estimated_hours > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {task.estimated_hours}h estimada
                    </div>
                  )}
                </div>
                {task.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => completeTaskFromQuest(task.id)}
                    disabled={completingTaskId === task.id}
                    style={{ padding: '0.5rem 1rem', background: completingTaskId === task.id ? '#374151' : '#22c55e', color: '#fff', borderRadius: '0.375rem', border: 'none', cursor: completingTaskId === task.id ? 'wait' : 'pointer', fontSize: '0.75rem', fontWeight: '500' }}
                  >
                    {completingTaskId === task.id ? '...' : '✓'}
                  </button>
                )}
                {task.status === 'completed' && (
                  <span style={{ color: '#22c55e', fontSize: '0.875rem' }}>✓</span>
                )}
              </div>
            ))}
            {tasks.length === 0 && (
              <p style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                Nenhuma task. Tasks serão criadas automaticamente quando você usar o coach.
              </p>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showMilestoneModal}
        onClose={() => { setShowMilestoneModal(false); setMilestoneToComplete(null); }}
        onConfirm={completeMilestone}
        title={t('completeMilestoneTitle')}
        confirmText={tc('confirm')}
        cancelText={tc('cancel')}
        type="success"
      >
        {milestoneToComplete && (
          <>
            <p style={{ marginBottom: '1rem' }}>
              {t('completeMilestoneConfirm')} &quot;{milestoneToComplete.title}&quot;?
            </p>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
              {t('milestoneReflectionLabel')}
            </label>
            <textarea
              value={milestoneReflection}
              onChange={(e) => setMilestoneReflection(e.target.value)}
              placeholder={t('milestoneReflectionPlaceholder')}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#111827',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                color: '#d1d5db',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </>
        )}
      </Modal>

      <Modal
        isOpen={showEditQuestModal}
        onClose={() => setShowEditQuestModal(false)}
        onConfirm={saveEditQuest}
        title={t('editQuestTitle')}
        confirmText={tc('save')}
        cancelText={tc('cancel')}
        type="success"
      >
        <label style={{ display: 'block', fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.35rem' }}>{t('targetDateLabel')}</label>
        <input
          type="date"
          value={editQuestTargetDate}
          onChange={(e) => setEditQuestTargetDate(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          style={{ width: '100%', padding: '0.75rem', background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', color: '#d1d5db', fontSize: '0.875rem', marginBottom: '0.5rem' }}
        />
      </Modal>

      <Modal
        isOpen={showEditMilestoneModal}
        onClose={() => { setShowEditMilestoneModal(false); setMilestoneToEdit(null); }}
        onConfirm={saveEditMilestone}
        title={t('editMilestoneTitle')}
        confirmText={t('updateMilestone')}
        cancelText={tc('cancel')}
        type="success"
      >
        {milestoneToEdit && (
          <>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.35rem' }}>{t('milestoneTitleLabel')}</label>
            <input
              type="text"
              value={editMilestoneTitle}
              onChange={(e) => setEditMilestoneTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem', background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', color: '#d1d5db', fontSize: '0.875rem', marginBottom: '1rem' }}
            />
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.35rem' }}>{t('milestoneDescriptionLabel')}</label>
            <textarea
              value={editMilestoneDescription}
              onChange={(e) => setEditMilestoneDescription(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '0.75rem', background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', color: '#d1d5db', fontSize: '0.875rem', resize: 'vertical' }}
            />
          </>
        )}
      </Modal>

      <Modal
        isOpen={showCompleteQuestModal}
        onClose={() => { setShowCompleteQuestModal(false); setQuestFeeling(''); setQuestReflection(''); }}
        onConfirm={completeQuest}
        title="✅ Completar Quest"
        confirmText={completingQuest ? tc('loading') : 'Completar'}
        cancelText={tc('cancel')}
        type="success"
        disabled={completingQuest || !questFeeling.trim()}
      >
        <p style={{ marginBottom: '1rem', color: '#d1d5db' }}>
          Parabéns por completar esta quest! 🎉
        </p>
        <label style={{ display: 'block', fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
          Como você está se sentindo? *
        </label>
        <textarea
          value={questFeeling}
          onChange={(e) => setQuestFeeling(e.target.value)}
          placeholder="Ex: Estou muito feliz e orgulhoso de ter completado esta quest!"
          rows={3}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#111827',
            border: '1px solid #374151',
            borderRadius: '0.5rem',
            color: '#d1d5db',
            fontSize: '0.875rem',
            resize: 'vertical',
            marginBottom: '1rem'
          }}
        />
        <label style={{ display: 'block', fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
          Reflexão (opcional)
        </label>
        <textarea
          value={questReflection}
          onChange={(e) => setQuestReflection(e.target.value)}
          placeholder="O que você aprendeu? O que foi mais desafiador?"
          rows={3}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#111827',
            border: '1px solid #374151',
            borderRadius: '0.5rem',
            color: '#d1d5db',
            fontSize: '0.875rem',
            resize: 'vertical'
          }}
        />
      </Modal>

      <Modal
        isOpen={showFailQuestModal}
        onClose={() => { setShowFailQuestModal(false); setQuestFeeling(''); setQuestReflection(''); }}
        onConfirm={failQuest}
        title="❌ Falhar Quest"
        confirmText={completingQuest ? tc('loading') : 'Confirmar'}
        cancelText={tc('cancel')}
        type="danger"
        disabled={completingQuest || !questFeeling.trim()}
      >
        <p style={{ marginBottom: '1rem', color: '#d1d5db' }}>
          Tem certeza que deseja marcar esta quest como falhada?
        </p>
        <label style={{ display: 'block', fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
          Como você está se sentindo? *
        </label>
        <textarea
          value={questFeeling}
          onChange={(e) => setQuestFeeling(e.target.value)}
          placeholder="Ex: Estou frustrado, mas aprendi muito com esta tentativa."
          rows={3}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#111827',
            border: '1px solid #374151',
            borderRadius: '0.5rem',
            color: '#d1d5db',
            fontSize: '0.875rem',
            resize: 'vertical',
            marginBottom: '1rem'
          }}
        />
        <label style={{ display: 'block', fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
          Reflexão (opcional)
        </label>
        <textarea
          value={questReflection}
          onChange={(e) => setQuestReflection(e.target.value)}
          placeholder="O que aconteceu? O que você aprendeu? O que faria diferente?"
          rows={3}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#111827',
            border: '1px solid #374151',
            borderRadius: '0.5rem',
            color: '#d1d5db',
            fontSize: '0.875rem',
            resize: 'vertical'
          }}
        />
      </Modal>
      {ToastComponent}
    </>
  );
}
