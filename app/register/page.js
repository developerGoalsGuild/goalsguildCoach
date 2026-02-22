'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from '../lib/i18n';

const PLAN_FEATURES_KEY = {
  free: 'freeFeatures',
  starter: 'starterFeatures',
  premium: 'premiumFeatures',
};

const FOCUS_OPTIONS = [
  { value: '', labelKey: 'focusAreaPlaceholder' },
  { value: 'productivity', labelKey: 'focusProductivity' },
  { value: 'fitness', labelKey: 'focusFitness' },
  { value: 'career', labelKey: 'focusCareer' },
  { value: 'learning', labelKey: 'focusLearning' },
  { value: 'health', labelKey: 'focusHealth' },
  { value: 'general', labelKey: 'focusGeneral' },
];

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(password) {
  if (!password || password.length < 8) return 'weak';
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const count = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (count >= 4 && password.length >= 8) return 'strong';
  if (count >= 3 && password.length >= 8) return 'medium';
  return 'weak';
}

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations('register');
  const tHome = useTranslations('home');
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    daily_work_hours: '',
    focus_area: '',
    context_for_coach: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetch('/api/subscription/plans')
      .then((res) => res.json())
      .then((data) => {
        if (data.plans && data.plans.length > 0) {
          setPlans(data.plans);
          if (!selectedPlanId) {
            setSelectedPlanId(data.plans[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const validateEmail = useCallback((email) => {
    if (!email) return null;
    return emailRegex.test(email) ? null : 'emailInvalid';
  }, []);

  const validateField = useCallback(
    (name, value) => {
      switch (name) {
        case 'email':
          return validateEmail(value);
        case 'password':
          return value && !strongPasswordRegex.test(value) ? 'passwordWeak' : null;
        case 'passwordConfirm':
          return value && value !== formData.password ? 'passwordMismatch' : null;
        default:
          return null;
      }
    },
    [formData.password, validateEmail]
  );

  const setFieldError = useCallback((field, messageKey) => {
    setFieldErrors((prev) => (messageKey ? { ...prev, [field]: messageKey } : { ...prev, [field]: undefined }));
  }, []);

  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;
      const key = validateField(name, value);
      setFieldError(name, key);
    },
    [validateField, setFieldError]
  );

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (fieldErrors[name]) {
        const key = validateField(name, value);
        setFieldError(name, key);
      }
      if (name === 'password' && formData.passwordConfirm) {
        const confirmKey = value !== formData.passwordConfirm ? 'passwordMismatch' : null;
        setFieldError('passwordConfirm', confirmKey);
      }
      if (name === 'passwordConfirm' && formData.password) {
        const confirmKey = value !== formData.password ? 'passwordMismatch' : null;
        setFieldError('passwordConfirm', confirmKey);
      }
    },
    [fieldErrors, formData.password, formData.passwordConfirm, validateField, setFieldError]
  );

  const runAllValidations = useCallback(() => {
    const errors = {};
    const emailErr = validateEmail(formData.email);
    if (emailErr) errors.email = emailErr;
    if (formData.password && !strongPasswordRegex.test(formData.password)) errors.password = 'passwordWeak';
    if (formData.passwordConfirm && formData.passwordConfirm !== formData.password)
      errors.passwordConfirm = 'passwordMismatch';
    if (!acceptedTerms) errors.terms = 'termsRequired';
    if (!selectedPlanId && plans.length > 0) setError(t('selectPlan'));
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.email, formData.password, formData.passwordConfirm, acceptedTerms, selectedPlanId, plans.length, validateEmail, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    if (!runAllValidations()) {
      if (!acceptedTerms) setFieldErrors((prev) => ({ ...prev, terms: 'termsRequired' }));
      return;
    }
    if (!selectedPlanId && plans.length > 0) {
      setError(t('selectPlan'));
      return;
    }
    setLoading(true);

    try {
      const payload = {
        name: formData.name || undefined,
        email: formData.email,
        password: formData.password,
        planId: selectedPlanId || plans[0]?.id,
      };
      if (formData.daily_work_hours !== '') {
        const hours = parseFloat(formData.daily_work_hours);
        if (hours >= 1 && hours <= 24) payload.daily_work_hours = hours;
      }
      if (formData.focus_area) payload.focus_area = formData.focus_area;
      if (formData.context_for_coach?.trim()) payload.context_for_coach = formData.context_for_coach.trim();

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) setError(t('userExists'));
        else if (res.status === 400) setError(data.error || t('passwordWeak'));
        else setError(data.error || t('registerError'));
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/');
      }
    } catch (err) {
      setError(t('networkError'));
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div
      className="app-shell"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isMobile ? '1rem' : '2rem',
      }}
    >
      <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: isMobile ? '1.5rem' : '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.5rem' : '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', color: 'var(--accent-soft)', marginBottom: '0.5rem' }}>
              🦅 {tHome('title')}
            </h1>
          </Link>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-soft)', margin: 0 }}>{t('subtitle')}</p>
        </div>

        {error && (
          <div className="alert-error" style={{ position: 'relative', paddingRight: '2.5rem' }}>
            {error}
            <button
              type="button"
              onClick={() => setError('')}
              aria-label={t('close')}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              {t('close')}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Plan selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="plan" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)', marginBottom: '0.5rem' }}>
              {t('choosePlan')}
            </label>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', flexWrap: 'wrap' }} role="group" aria-label={t('choosePlan')}>
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const featuresKey = PLAN_FEATURES_KEY[plan.name] || 'freeFeatures';
                return (
                  <button
                    key={plan.id}
                    id={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`btn ${isSelected ? '' : 'btn-dark'}`}
                    style={{
                      flex: isMobile ? 'none' : 1,
                      minWidth: isMobile ? '100%' : '100px',
                      textAlign: 'left',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      background: isSelected ? 'rgba(30, 58, 95, 0.8)' : undefined,
                      color: isSelected ? 'var(--accent-soft)' : 'var(--text-soft)',
                    }}
                  >
                    <span style={{ marginBottom: '0.25rem' }}>{plan.display_name}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                      {plan.price_monthly === 0 ? `$0 ${t('perMonth')}` : `${plan.currency === 'USD' ? '$' : ''}${plan.price_monthly}${t('perMonth')}`}
                    </span>
                    {plan.price_yearly != null && plan.price_yearly > 0 && (
                      <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>${plan.price_yearly}{t('perYear')}</span>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedPlanId && plans.find((p) => p.id === selectedPlanId) && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '0.5rem', marginBottom: 0 }}>
                {t(PLAN_FEATURES_KEY[plans.find((p) => p.id === selectedPlanId).name] || 'freeFeatures')}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="name" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text)', marginBottom: '0.5rem' }}>
              {t('name')}
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={t('namePlaceholder')}
              disabled={loading}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'err-name' : undefined}
            />
            {fieldErrors.name && (
              <p id="err-name" className="field-error" role="alert">
                {t(fieldErrors.name)}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text)', marginBottom: '0.5rem' }}>
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="email@example.com"
              required
              disabled={loading}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'err-email' : undefined}
            />
            {fieldErrors.email && (
              <p id="err-email" className="field-error" role="alert">
                {t(fieldErrors.email)}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text)', marginBottom: '0.5rem' }}>
              {t('password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                required
                minLength={8}
                disabled={loading}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'err-password' : formData.password ? 'password-strength' : undefined}
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-soft)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                {showPassword ? t('hidePassword') : t('showPassword')}
              </button>
            </div>
            {formData.password && (
              <p id="password-strength" style={{ fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: '0.25rem' }}>
                <span
                  style={{
                    color:
                      passwordStrength === 'strong' ? 'var(--green)' : passwordStrength === 'medium' ? 'var(--accent)' : 'var(--red)',
                  }}
                >
                  {t(`passwordStrength${passwordStrength === 'weak' ? 'Weak' : passwordStrength === 'medium' ? 'Medium' : 'Strong'}`)}
                </span>
              </p>
            )}
            <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>{t('passwordHint')}</p>
            {fieldErrors.password && (
              <p id="err-password" className="field-error" role="alert">
                {t(fieldErrors.password)}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="passwordConfirm" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text)', marginBottom: '0.5rem' }}>
              {t('passwordConfirm')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="passwordConfirm"
                type={showPasswordConfirm ? 'text' : 'password'}
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t('passwordConfirmPlaceholder')}
                disabled={loading}
                aria-invalid={!!fieldErrors.passwordConfirm}
                aria-describedby={fieldErrors.passwordConfirm ? 'err-passwordConfirm' : undefined}
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm((s) => !s)}
                aria-label={showPasswordConfirm ? t('hidePassword') : t('showPassword')}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-soft)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                {showPasswordConfirm ? t('hidePassword') : t('showPassword')}
              </button>
            </div>
            {fieldErrors.passwordConfirm && (
              <p id="err-passwordConfirm" className="field-error" role="alert">
                {t(fieldErrors.passwordConfirm)}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="daily_work_hours" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text)', marginBottom: '0.5rem' }}>
              {t('dailyWorkHours')}
            </label>
            <input
              id="daily_work_hours"
              type="number"
              name="daily_work_hours"
              min={1}
              max={24}
              step={0.5}
              value={formData.daily_work_hours}
              onChange={handleChange}
              placeholder={t('dailyWorkHoursPlaceholder')}
              disabled={loading}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '0.25rem', marginBottom: 0 }}>{t('dailyWorkHoursHelp')}</p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="focus_area" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text)', marginBottom: '0.5rem' }}>
              {t('focusArea')}
            </label>
            <select
              id="focus_area"
              name="focus_area"
              value={formData.focus_area}
              onChange={handleChange}
              disabled={loading}
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
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="context_for_coach" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text)', marginBottom: '0.5rem' }}>
              {t('contextForCoach')}
            </label>
            <textarea
              id="context_for_coach"
              name="context_for_coach"
              value={formData.context_for_coach}
              onChange={handleChange}
              placeholder={t('contextForCoachPlaceholder')}
              disabled={loading}
              rows={3}
              aria-describedby="context-help"
            />
            <p id="context-help" style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '0.25rem', marginBottom: 0 }}>
              {t('contextForCoachHelp')}
            </p>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text)' }}>
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (fieldErrors.terms) setFieldErrors((prev) => ({ ...prev, terms: undefined }));
                }}
                disabled={loading}
                aria-invalid={!!fieldErrors.terms}
                aria-describedby={fieldErrors.terms ? 'err-terms' : undefined}
              />
              <span>
                {t('acceptTerms')} <Link href="/terms" style={{ color: 'var(--accent-soft)' }}>{t('termsLink')}</Link>
              </span>
            </label>
            {fieldErrors.terms && (
              <p id="err-terms" className="field-error" role="alert" style={{ marginLeft: '1.75rem' }}>
                {t(fieldErrors.terms)}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }} aria-busy={loading}>
            {loading && <span className="register-spinner" aria-hidden />}
            {loading ? t('creating') : t('submit')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <p style={{ color: 'var(--text-soft)', margin: 0 }}>
            {t('hasAccount')} <Link href="/login" style={{ color: 'var(--accent-soft)' }}>{t('login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
