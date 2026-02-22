'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopNavigation from '../components/TopNavigation';
import { useTranslations } from '../lib/i18n';
import { authFetch, isAuthenticated, getUser } from '../lib/auth-helpers';

const FOCUS_OPTIONS = [
  { value: '', labelKey: 'focusAreaPlaceholder' },
  { value: 'productivity', labelKey: 'focusProductivity' },
  { value: 'fitness', labelKey: 'focusFitness' },
  { value: 'career', labelKey: 'focusCareer' },
  { value: 'learning', labelKey: 'focusLearning' },
  { value: 'health', labelKey: 'focusHealth' },
  { value: 'general', labelKey: 'focusGeneral' },
];

export default function ProfilePage() {
  const router = useRouter();
  const t = useTranslations('profile');
  const tRegister = useTranslations('register');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    daily_work_hours: '',
    focus_area: '',
    context_for_coach: '',
  });
  const [plan, setPlan] = useState(null);
  const [canManageBilling, setCanManageBilling] = useState(false);
  const [plans, setPlans] = useState([]);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    Promise.all([
      authFetch('/api/user/profile').then((res) => (res.status === 401 ? null : res.json())),
      authFetch('/api/subscription/current').then((res) => (res.status === 401 ? null : res.json())),
      authFetch('/api/subscription/plans').then((res) => (res.ok ? res.json() : { plans: [] })),
    ])
      .then(([profileData, subData, plansData]) => {
        if (!profileData || profileData.error) {
          setError(profileData?.error || 'Failed to load profile');
          setLoading(false);
          return;
        }
        setFormData({
          name: profileData.name ?? '',
          email: profileData.email ?? '',
          daily_work_hours: profileData.daily_work_hours != null ? String(profileData.daily_work_hours) : '',
          focus_area: profileData.focus_area ?? '',
          context_for_coach: profileData.context_for_coach ?? '',
        });
        setPlan(
          subData?.subscription
            ? {
                plan_name: subData.subscription.plan_name,
                display_name: subData.subscription.display_name,
                status: subData.subscription.status,
                current_period_end: subData.subscription.current_period_end,
              }
            : { plan_name: 'free', display_name: 'Free', status: 'active', current_period_end: null }
        );
        setCanManageBilling(!!subData?.can_manage_billing);
        setPlans(plansData?.plans ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(t('error'));
        setLoading(false);
      });
  }, [router, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      name: formData.name.trim(),
      daily_work_hours: formData.daily_work_hours === '' ? null : parseFloat(formData.daily_work_hours),
      focus_area: formData.focus_area.trim() || '',
      context_for_coach: formData.context_for_coach.trim() || '',
    };
    if (payload.daily_work_hours != null && (Number.isNaN(payload.daily_work_hours) || payload.daily_work_hours < 1 || payload.daily_work_hours > 24)) {
      setError('daily_work_hours must be between 1 and 24');
      setSaving(false);
      return;
    }

    try {
      const res = await authFetch('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('error'));
        setSaving(false);
        return;
      }

      const stored = getUser();
      if (stored && data.name !== undefined) {
        localStorage.setItem('user', JSON.stringify({ ...stored, name: data.name }));
      }
      setFormData((prev) => ({
        ...prev,
        name: data.name ?? prev.name,
        daily_work_hours: data.daily_work_hours != null ? String(data.daily_work_hours) : '',
        focus_area: data.focus_area ?? '',
        context_for_coach: data.context_for_coach ?? '',
      }));
      setSuccess(t('success'));
    } catch {
      setError(t('error'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async (planId) => {
    setCheckoutLoading(planId);
    setError('');
    try {
      const res = await authFetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Checkout failed');
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/subscription/portal', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not open billing portal');
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setPortalLoading(false);
    }
  };

  if (!isAuthenticated()) return null;

  return (
    <>
      <TopNavigation />
      <div className="page-container app-shell">
        <div className="glass-card" style={{ maxWidth: '520px', margin: '0 auto', padding: '1.5rem 2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-soft)', marginBottom: '0.5rem' }}>
              {t('title')}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-soft)', margin: 0 }}>{t('subtitle')}</p>
          </div>

          {plan && (
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '1rem 1.25rem',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
              }}
            >
              <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-soft)', marginBottom: '0.5rem' }}>
                {t('planTitle')}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem' }}>
                <span>
                  <strong style={{ color: 'var(--text)' }}>{t('planName')}:</strong>{' '}
                  {plan.display_name || plan.plan_name || 'Free'}
                </span>
                <span>
                  <strong style={{ color: 'var(--text)' }}>{t('planStatus')}:</strong>{' '}
                  {plan.status === 'active' ? t('planStatusActive') : plan.status || '—'}
                </span>
                {plan.current_period_end && (
                  <span>
                    <strong style={{ color: 'var(--text)' }}>{t('planPeriodEnd')}:</strong>{' '}
                    {new Date(plan.current_period_end).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {plans.length > 0 && (
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '1rem 1.25rem',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
              }}
            >
              <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-soft)', marginBottom: '0.25rem' }}>
                {t('changePlan')}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)', marginBottom: '1rem', marginTop: 0 }}>
                {t('changePlanSubtitle')}
              </p>
              {canManageBilling && (
                <div style={{ marginBottom: '1rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleManageBilling}
                    disabled={portalLoading}
                  >
                    {portalLoading ? '...' : t('manageBilling')}
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {plans.map((p) => {
                  const isCurrent = plan && (p.name === plan.plan_name || p.display_name === (plan.display_name || plan.plan_name));
                  const isPaid = p.price_monthly > 0;
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>
                        {p.display_name || p.name} — {p.price_monthly === 0 ? '$0' : `$${p.price_monthly}`}{t('perMonth')}
                      </span>
                      {isCurrent ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-soft)', fontWeight: '600' }}>{t('currentPlan')}</span>
                      ) : isPaid ? (
                        <button
                          type="button"
                          className="btn btn-dark"
                          style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                          onClick={() => handleUpgrade(p.id)}
                          disabled={!!checkoutLoading}
                        >
                          {checkoutLoading === p.id ? '...' : t('upgrade')}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="alert-error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                background: 'var(--green)',
                color: '#fff',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                marginBottom: '1rem',
                fontSize: '0.875rem',
              }}
            >
              {success}
            </div>
          )}

          {loading ? (
            <p style={{ color: 'var(--text-soft)' }}>{t('loading')}</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="profile-name" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text)', marginBottom: '0.5rem' }}>
                  {tRegister('name')}
                </label>
                <input
                  id="profile-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={tRegister('namePlaceholder')}
                  disabled={saving}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="profile-email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text)', marginBottom: '0.5rem' }}>
                  {t('emailReadOnly')}
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={formData.email}
                  readOnly
                  disabled
                  style={{ opacity: 0.85, cursor: 'not-allowed' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="profile-daily_work_hours" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text)', marginBottom: '0.5rem' }}>
                  {tRegister('dailyWorkHours')}
                </label>
                <input
                  id="profile-daily_work_hours"
                  type="number"
                  name="daily_work_hours"
                  min={1}
                  max={24}
                  step={0.5}
                  value={formData.daily_work_hours}
                  onChange={handleChange}
                  placeholder={tRegister('dailyWorkHoursPlaceholder')}
                  disabled={saving}
                  style={{ width: '100%' }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '0.25rem', marginBottom: 0 }}>
                  {tRegister('dailyWorkHoursHelp')}
                </p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="profile-focus_area" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text)', marginBottom: '0.5rem' }}>
                  {tRegister('focusArea')}
                </label>
                <select
                  id="profile-focus_area"
                  name="focus_area"
                  value={formData.focus_area}
                  onChange={handleChange}
                  disabled={saving}
                  style={{
                    width: '100%',
                    color: 'var(--text)',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.95rem',
                    fontSize: '0.875rem',
                  }}
                >
                  {FOCUS_OPTIONS.map((opt) => (
                    <option key={opt.value || 'empty'} value={opt.value}>
                      {tRegister(opt.labelKey)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="profile-context_for_coach" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text)', marginBottom: '0.5rem' }}>
                  {tRegister('contextForCoach')}
                </label>
                <textarea
                  id="profile-context_for_coach"
                  name="context_for_coach"
                  value={formData.context_for_coach}
                  onChange={handleChange}
                  placeholder={tRegister('contextForCoachPlaceholder')}
                  disabled={saving}
                  rows={3}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '0.25rem', marginBottom: 0 }}>
                  {tRegister('contextForCoachHelp')}
                </p>
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%' }} aria-busy={saving}>
                {saving && <span className="register-spinner" aria-hidden />}
                {saving ? t('saving') : t('save')}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
