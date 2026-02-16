'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '../../lib/auth-helpers';
import TopNavigation from '../../components/TopNavigation';
import { useTranslations } from '../../lib/i18n';

export default function NewReminderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('reminders');
  const tc = useTranslations('common');
  const preselectedObjectiveId = searchParams.get('objectiveId');

  const [loading, setLoading] = useState(false);
  const [objectives, setObjectives] = useState([]);
  const [loadingObjectives, setLoadingObjectives] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    objective_id: preselectedObjectiveId || '',
    frequency: 'daily',
    type: 'check-in'
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (preselectedObjectiveId) {
      setFormData(prev => ({ ...prev, objective_id: preselectedObjectiveId }));
    }
  }, [preselectedObjectiveId]);

  useEffect(() => {
    const loadObjectives = async () => {
      try {
        const res = await authFetch('/api/goals');
        if (res.ok) {
          const data = await res.json();
          setObjectives(data.goals || []);
          if (!preselectedObjectiveId && data.goals?.length > 0) {
            setFormData(prev => ({ ...prev, objective_id: prev.objective_id || data.goals[0].id }));
          }
        }
      } catch (err) {
        console.error('Failed to load objectives:', err);
      } finally {
        setLoadingObjectives(false);
      }
    };
    loadObjectives();
  }, [preselectedObjectiveId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.objective_id) {
      alert(t('selectObjectiveFirst'));
      return;
    }
    setLoading(true);

    try {
      const res = await authFetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectiveId: formData.objective_id,
          frequency: formData.frequency,
          type: formData.type
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/objectives?reminder=${data.reminderId}`);
      } else {
        const err = await res.json();
        alert(err.error || t('createError'));
      }
    } catch (error) {
      console.error('Failed to create reminder:', error);
      alert(t('createError'));
    } finally {
      setLoading(false);
    }
  };

  const containerPadding = isMobile ? '16px' : '2rem 1rem';
  const formPadding = isMobile ? '1rem' : '2rem';
  const inputPadding = isMobile ? '14px 16px' : '0.75rem 1rem';
  const inputFontSize = isMobile ? '16px' : '0.875rem'; // 16px evita zoom no iOS
  const buttonMinHeight = isMobile ? '48px' : undefined;

  return (
    <>
      <TopNavigation />
      <div style={{
        paddingTop: '60px',
        paddingBottom: isMobile ? '80px' : undefined,
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ededed'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: containerPadding }}>
          <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
            <h1 style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: 'bold',
              color: '#fbbf24',
              marginBottom: '0.5rem'
            }}>
              🔔 {t('title')}
            </h1>
            <p style={{ fontSize: isMobile ? '0.875rem' : '1rem', color: '#9ca3af' }}>
              {t('subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{
            background: '#1f2937',
            borderRadius: isMobile ? '12px' : '0.75rem',
            padding: formPadding,
            border: '1px solid #374151'
          }}>
            <div style={{ marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#d1d5db',
                marginBottom: '0.5rem'
              }}>
                {t('objectiveLabel')}
              </label>
              <select
                value={formData.objective_id}
                onChange={(e) => setFormData({ ...formData, objective_id: e.target.value })}
                required
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  padding: inputPadding,
                  color: '#ededed',
                  fontSize: inputFontSize,
                  minHeight: buttonMinHeight,
                  WebkitAppearance: 'none',
                  appearance: 'none'
                }}
              >
                <option value="">{t('selectObjective')}</option>
                {loadingObjectives ? (
                  <option disabled>{t('loadingObjectives')}</option>
                ) : (
                  objectives.map((obj) => (
                    <option key={obj.id} value={obj.id}>
                      {obj.title || obj.statement || `${t('objectiveFallback')} ${obj.id?.slice(0, 8)}`}
                    </option>
                  ))
                )}
              </select>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                {t('linkedToObjective')}
              </p>
            </div>

            <div style={{ marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                {t('frequencyLabel')}
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  padding: inputPadding,
                  color: '#ededed',
                  fontSize: inputFontSize,
                  minHeight: buttonMinHeight,
                  WebkitAppearance: 'none',
                  appearance: 'none'
                }}
              >
                <option value="daily">{t('frequencyDaily')}</option>
                <option value="weekly">{t('frequencyWeekly')}</option>
                <option value="biweekly">{t('frequencyBiweekly')}</option>
              </select>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                {t('frequencyHint')}
              </p>
            </div>

            <div style={{ marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.5rem' }}>
                {t('typeLabel')}
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  padding: inputPadding,
                  color: '#ededed',
                  fontSize: inputFontSize,
                  minHeight: buttonMinHeight,
                  WebkitAppearance: 'none',
                  appearance: 'none'
                }}
              >
                <option value="check-in">{t('typeCheckin')}</option>
                <option value="review">{t('typeReview')}</option>
                <option value="reflection">{t('typeReflection')}</option>
              </select>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '12px' : '1rem'
            }}>
              <button
                type="button"
                onClick={() => router.back()}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  background: '#1f2937',
                  color: '#d1d5db',
                  fontWeight: '500',
                  borderRadius: isMobile ? '12px' : '0.5rem',
                  border: '1px solid #374151',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  minHeight: buttonMinHeight
                }}
              >
                {tc('cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || !formData.objective_id || loadingObjectives}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  background: loading || !formData.objective_id ? '#374151' : '#f59e0b',
                  color: loading || !formData.objective_id ? '#9ca3af' : '#0a0a0a',
                  fontWeight: '600',
                  borderRadius: isMobile ? '12px' : '0.5rem',
                  border: 'none',
                  cursor: loading || !formData.objective_id ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  minHeight: buttonMinHeight
                }}
              >
                {loading ? t('creating') : t('createButton')}
              </button>
            </div>

            <div style={{
              marginTop: isMobile ? '1.25rem' : '1.5rem',
              padding: isMobile ? '1rem' : '1rem',
              background: '#111827',
              borderRadius: '0.5rem'
            }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#d1d5db', marginBottom: '0.5rem' }}>
                💡 {t('aboutTitle')}
              </h3>
              <ul style={{ fontSize: isMobile ? '0.8125rem' : '0.75rem', color: '#9ca3af', lineHeight: '1.6', paddingLeft: '1rem' }}>
                <li style={{ marginBottom: '0.25rem' }}>{t('aboutDaily')}</li>
                <li style={{ marginBottom: '0.25rem' }}>{t('aboutWeekly')}</li>
                <li style={{ marginBottom: '0.25rem' }}>{t('aboutBiweekly')}</li>
                <li>{t('aboutFocus')}</li>
              </ul>
            </div>
          </form>

          <Link
            href="/objectives"
            style={{
              display: 'inline-block',
              marginTop: isMobile ? '1.25rem' : '1rem',
              padding: isMobile ? '12px 0' : undefined,
              color: '#9ca3af',
              fontSize: '0.875rem',
              textDecoration: 'none',
              minHeight: isMobile ? '44px' : undefined
            }}
          >
            ← {t('backToObjectives')}
          </Link>
        </div>
      </div>
    </>
  );
}
