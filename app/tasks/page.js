'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch, logout } from '../lib/auth-helpers';
import SearchBar from '../components/SearchBar';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import TopNavigation from '../components/TopNavigation';
import { useTranslations } from '../lib/i18n';

export default function TasksPage() {
  const t = useTranslations('tasks');
  const tc = useTranslations('common');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [modalTask, setModalTask] = useState(null);
  const [completeObservation, setCompleteObservation] = useState('');

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/tasks?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = (taskId) => {
    setModalTask(tasks.find((t) => t.id === taskId));
    setModalAction('complete');
    setCompleteObservation('');
    setShowModal(true);
  };

  const handleCompleteTask = async () => {
    const taskId = modalTask?.id;
    if (!taskId) return;
    try {
      const res = await authFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'completed',
          ...(completeObservation.trim() && { observation: completeObservation.trim() }),
        }),
      });
      if (res.ok) loadTasks();
    } catch (err) {
      console.error('Failed to complete task:', err);
    } finally {
      setShowModal(false);
    }
  };

  const deleteTask = (taskId) => {
    setModalTask(tasks.find((t) => t.id === taskId));
    setModalAction('delete');
    setShowModal(true);
  };

  const handleDeleteTask = async () => {
    const taskId = modalTask?.id;
    if (!taskId) return;
    try {
      const res = await authFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) loadTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setShowModal(false);
    }
  };

  const filteredTasks = tasks
    .filter((task) => {
      if (filter === 'pending') return task.status === 'pending';
      if (filter === 'completed') return task.status === 'completed';
      return true;
    })
    .filter((task) => {
      if (!search) return true;
      return task.title?.toLowerCase().includes(search.toLowerCase());
    });

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="app-shell">
      <TopNavigation />
      <main className="page-container">
        <section className="hero glass-card" style={{ marginBottom: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.7rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ marginBottom: '0.35rem' }}>✅ Tasks</h1>
              <p style={{ margin: 0 }}>{t('subtitle')}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <Link href="/tasks/new" className="btn btn-primary">
                + {t('newTask')}
              </Link>
              <button onClick={logout} className="btn btn-dark">
                {tc('logout')}
              </button>
            </div>
          </div>
        </section>

        <section className="glass-card" style={{ padding: '1rem', marginBottom: '0.85rem' }}>
          <p style={{ marginBottom: '0.55rem', color: 'var(--text-soft)' }}>
            {completedCount} / {tasks.length} {t('progressSummary')}
          </p>
          <ProgressBar progress={progressPercentage} showPercentage size="large" />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.6rem', marginBottom: '0.8rem' }}>
          <SearchBar onSearch={setSearch} placeholder={t('searchPlaceholder')} />
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button onClick={() => setFilter('all')} className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-dark'}`}>
              {t('all')}
            </button>
            <button onClick={() => setFilter('pending')} className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-dark'}`}>
              {t('pending')}
            </button>
            <button onClick={() => setFilter('completed')} className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-dark'}`}>
              {t('done')}
            </button>
          </div>
        </section>

        {loading ? (
          <div className="glass-card" style={{ padding: '1rem', color: 'var(--text-soft)' }}>
            {tc('loading')}
          </div>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={filter === 'completed' ? '🎉' : '📋'}
            title={filter === 'completed' ? t('noneCompleted') : t('nonePending')}
            description="Crie tarefas ou use o Coach AI para gerá-las automaticamente"
            actionText={`+ ${t('createTask')}`}
            actionLink="/tasks/new"
          />
        ) : (
          <section style={{ display: 'grid', gap: '0.6rem' }}>
            {filteredTasks.map((task) => (
              <article key={task.id} className="feature-card" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <button
                  onClick={() => task.status === 'pending' && completeTask(task.id)}
                  className="btn btn-dark"
                  style={{
                    minWidth: '44px',
                    minHeight: '44px',
                    borderColor: task.status === 'completed' ? 'var(--green)' : undefined,
                    background: task.status === 'completed' ? 'rgba(34, 197, 94, 0.2)' : undefined,
                  }}
                >
                  {task.status === 'completed' ? '✓' : '○'}
                </button>

                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontWeight: 600,
                      color: task.status === 'completed' ? 'var(--text-soft)' : 'var(--text)',
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>
                    {task.estimated_hours ? `${task.estimated_hours}h` : t('noEstimate')}
                    {task.quest_id ? ` · ${t('questPrefix')}: ${task.quest_title || 'N/A'}` : ''}
                  </p>
                </div>

                {task.status === 'pending' && (
                  <>
                    <button onClick={() => completeTask(task.id)} className="btn btn-primary">
                      {t('complete')}
                    </button>
                    <Link href={`/tasks/${task.id}/edit`} className="btn btn-dark">
                      ✏️ {t('edit')}
                    </Link>
                  </>
                )}
                <button onClick={() => deleteTask(task.id)} className="btn btn-dark">
                  🗑️
                </button>
              </article>
            ))}
          </section>
        )}
      </main>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => (modalAction === 'complete' ? handleCompleteTask() : handleDeleteTask())}
        title={modalAction === 'delete' ? t('deleteTitle') : t('completeTitle')}
        message={modalAction === 'delete' ? `${t('deleteConfirm')} "${modalTask?.title}"?` : null}
        confirmText={modalAction === 'delete' ? tc('delete') : t('complete')}
        cancelText={tc('cancel')}
        type={modalAction === 'delete' ? 'danger' : 'success'}
      >
        {modalAction === 'complete' && (
          <>
            <p style={{ marginBottom: '0.7rem' }}>{t('completeConfirm')} "{modalTask?.title}"?</p>
            <textarea
              value={completeObservation}
              onChange={(e) => setCompleteObservation(e.target.value)}
              placeholder={t('observationPlaceholder')}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#111827',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                color: '#d1d5db',
              }}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
