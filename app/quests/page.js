'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch } from '../lib/auth-helpers';
import TopNavigation from '../components/TopNavigation';
import SearchBar from '../components/SearchBar';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';
import { useTranslations } from '../lib/i18n';

export default function QuestsPage() {
  const t = useTranslations('quests');
  const tc = useTranslations('common');
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalQuest, setModalQuest] = useState(null);

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      const res = await authFetch('/api/quests');
      if (res.ok) {
        const data = await res.json();
        setQuests(data.quests || []);
      }
    } catch (error) {
      console.error('Failed to load quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!modalQuest) return;
    try {
      const res = await authFetch(`/api/quests/${modalQuest.id}`, { method: 'DELETE' });
      if (res.ok) loadQuests();
    } catch (error) {
      console.error('Failed to delete quest:', error);
    } finally {
      setShowModal(false);
      setModalQuest(null);
    }
  };

  const filteredQuests = quests.filter((quest) => {
    const q = search.toLowerCase();
    return quest.title?.toLowerCase().includes(q) || quest.description?.toLowerCase().includes(q);
  });

  const activeQuests = filteredQuests.filter((q) => q.status !== 'completed');
  const completedQuests = filteredQuests.filter((q) => q.status === 'completed');

  return (
    <div className="app-shell">
      <TopNavigation />
      <main className="page-container">
        <section className="hero glass-card" style={{ marginBottom: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.7rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ marginBottom: '0.35rem' }}>⚔️ Quests</h1>
              <p style={{ margin: 0 }}>{t('subtitle')}</p>
            </div>
            <Link href="/quests/new" className="btn btn-primary">
              ➕ {t('newQuest')}
            </Link>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.7rem',
            marginBottom: '0.8rem',
          }}
        >
          <div className="glass-card" style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--text-soft)', fontSize: '0.8rem' }}>{t('active')}</p>
            <p style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--accent-soft)' }}>{activeQuests.length}</p>
          </div>
          <div className="glass-card" style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--text-soft)', fontSize: '0.8rem' }}>{t('completed')}</p>
            <p style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--green)' }}>{completedQuests.length}</p>
          </div>
          <div className="glass-card" style={{ padding: '1rem' }}>
            <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('searchPlaceholder')} />
          </div>
        </section>

        {loading ? (
          <div className="glass-card" style={{ padding: '1rem', color: 'var(--text-soft)' }}>
            Carregando...
          </div>
        ) : filteredQuests.length === 0 ? (
          <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-soft)', marginBottom: '0.6rem' }}>{t('noneFound')}</p>
            <Link href="/quests/new" className="btn btn-primary">
              {t('createFirst')}
            </Link>
          </div>
        ) : (
          <section className="features-grid">
            {filteredQuests.map((quest) => (
              <article key={quest.id} className="feature-card" style={{ position: 'relative' }}>
                <Link href={`/quests/${quest.id}`} style={{ display: 'block' }}>
                  <h3>{quest.title}</h3>
                  {quest.description && <p>{quest.description}</p>}
                  <div style={{ margin: '0.6rem 0' }}>
                    <ProgressBar progress={quest.progress || 0} total={100} />
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>
                    XP: {quest.xp_offered ?? 0} · Dificuldade: {'⭐'.repeat({ easy: 1, medium: 2, hard: 3, epic: 4 }[quest.difficulty] ?? 2)}
                  </p>
                </Link>
                <button
                  onClick={() => {
                    setModalQuest(quest);
                    setShowModal(true);
                  }}
                  className="btn btn-dark"
                  style={{ marginTop: '0.6rem' }}
                >
                  🗑️ {tc('delete')}
                </button>
              </article>
            ))}
          </section>
        )}
      </main>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        title={`🗑️ ${t('deleteTitle')}`}
        message={modalQuest ? `${t('deleteConfirm')} "${modalQuest.title}"?` : ''}
        confirmText={tc('delete')}
        cancelText={tc('cancel')}
        type="danger"
      />
    </div>
  );
}
