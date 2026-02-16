'use client';

import TopNavigation from '../components/TopNavigation';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getToken } from '../lib/auth-helpers';
import { useTranslations, useLocale } from '../lib/i18n';
import { getAllPredefinedPersonas, getPredefinedPersona, getWelcomeMessage, getPersonaDisplayName, getPersonaDisplayDescription } from '../lib/personas';

export default function CoachClient() {
  const router = useRouter();
  const t = useTranslations('coach');
  const tc = useTranslations('common');
  const { locale } = useLocale();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: t('welcome') }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showQuickTips, setShowQuickTips] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showPersonalityModal, setShowPersonalityModal] = useState(false);
  const [persona, setPersona] = useState({ tone: 'neutral', specialization: 'general', archetype: 'mentor', theme: null });
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [savingPersonality, setSavingPersonality] = useState(false);
  const [currentPersonaName, setCurrentPersonaName] = useState(null);
  const messagesEndRef = useRef(null);
  const welcomeMessageSetRef = useRef(false);
  const personalityLoadedRef = useRef(false);
  const predefinedPersonas = getAllPredefinedPersonas();

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }
      setIsCheckingAuth(false);
    };

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkAuth();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const loadPersonality = async () => {
      if (!isAuthenticated() || personalityLoadedRef.current) return;
      
      try {
        const token = getToken();
        if (!token) return;

        personalityLoadedRef.current = true; // Marcar como carregado antes da chamada

        const response = await fetch('/api/user/persona', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.persona) {
            setPersona(data.persona);
            // Verificar se é uma personalidade predefinida
            if (data.persona.theme) {
              setSelectedPreset(data.persona.theme);
              const preset = getPredefinedPersona(data.persona.theme);
              if (preset) {
                setCurrentPersonaName(getPersonaDisplayName(preset, locale));
                // Atualizar mensagem inicial apenas se ainda não foi atualizada
                if (!welcomeMessageSetRef.current) {
                  const welcomeMsg = getWelcomeMessage(data.persona.theme, locale);
                  if (welcomeMsg) {
                    setMessages([{ role: 'assistant', content: welcomeMsg }]);
                  }
                  welcomeMessageSetRef.current = true;
                }
              }
            } else {
              // Se não há tema, usar primeira personalidade como padrão e salvar automaticamente
              if (predefinedPersonas.length > 0) {
                const defaultPreset = predefinedPersonas[0];
                setSelectedPreset(defaultPreset.id);
                setCurrentPersonaName(defaultPreset.name);
                const defaultPersona = {
                  tone: defaultPreset.tone,
                  specialization: defaultPreset.specialization,
                  archetype: defaultPreset.archetype,
                  theme: defaultPreset.theme
                };
                setPersona(defaultPersona);
                
                // Salvar automaticamente a personalidade padrão (sem causar re-render)
                fetch('/api/user/persona', {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(defaultPersona)
                }).catch(err => console.error('Error saving default persona:', err));
                
                if (!welcomeMessageSetRef.current) {
                  const welcomeMsg = getWelcomeMessage(defaultPreset.theme, locale);
                  if (welcomeMsg) {
                    setMessages([{ role: 'assistant', content: welcomeMsg }]);
                  }
                  welcomeMessageSetRef.current = true;
                }
              }
            }
          }
        } else {
          // Se falhar, resetar o ref para tentar novamente
          personalityLoadedRef.current = false;
        }
      } catch (error) {
        console.error('Error loading personality:', error);
        personalityLoadedRef.current = false; // Resetar em caso de erro
      }
    };

    if (!isCheckingAuth) {
      loadPersonality();
    }
  }, [isCheckingAuth, locale]);

  const selectPreset = (presetId) => {
    const preset = getPredefinedPersona(presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setCurrentPersonaName(getPersonaDisplayName(preset, locale));
      setPersona({
        tone: preset.tone,
        specialization: preset.specialization,
        archetype: preset.archetype,
        theme: preset.theme
      });
      // Atualizar mensagem inicial apenas se ainda for a primeira mensagem
      const welcomeMsg = getWelcomeMessage(preset.theme, locale);
      if (welcomeMsg && messages.length === 1 && messages[0].role === 'assistant') {
        setMessages([{ role: 'assistant', content: welcomeMsg }]);
        welcomeMessageSetRef.current = true;
      }
    }
  };

  const savePersonality = async () => {
    setSavingPersonality(true);
    try {
      const token = getToken();
      if (!token) {
        alert(t('sessionExpired'));
        return;
      }

      // Garantir que theme seja sempre enviado (mesmo que seja null)
      const personaToSave = {
        ...persona,
        theme: persona.theme || null
      };

      const response = await fetch('/api/user/persona', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(personaToSave)
      });

      if (response.ok) {
        setShowPersonalityModal(false);
        // Atualizar nome da personalidade atual
        if (persona.theme) {
          const preset = getPredefinedPersona(persona.theme);
          if (preset) {
            setCurrentPersonaName(getPersonaDisplayName(preset, locale));
            // Atualizar mensagem inicial apenas se ainda for a primeira mensagem
            const welcomeMsg = getWelcomeMessage(persona.theme, locale);
            if (welcomeMsg && messages.length === 1 && messages[0].role === 'assistant') {
              setMessages([{ role: 'assistant', content: welcomeMsg }]);
              welcomeMessageSetRef.current = true;
            }
          }
        }
        alert(t('personalitySaved'));
      } else {
        alert(t('personalityError'));
      }
    } catch (error) {
      console.error('Error saving personality:', error);
      alert(t('personalityError'));
    } finally {
      setSavingPersonality(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const token = getToken();
      
      if (!token) {
        setMessages(prev => [...prev, { role: 'assistant', content: t('sessionExpired') }]);
        setTimeout(() => router.push('/login'), 2000);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage, locale })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        if (response.status === 401) {
          setMessages(prev => [...prev, { role: 'assistant', content: t('unauthorizedRedirect') }]);
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
          }, 2000);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: data.error || t('genericErrorTryAgain') }]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: t('genericErrorTryAgain') }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isCheckingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a', color: '#ededed' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#9ca3af' }}>{t('authChecking')}</p>
        </div>
      </div>
    );
  }

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: isMobile ? 'calc(100vh - 60px)' : '100vh',
    paddingTop: '60px',
    background: '#0a0a0a',
    color: '#ededed'
  };

  const chatAreaStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  const messagesContainerStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: isMobile ? '1rem' : '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  };

  const messageStyle = (role) => ({
    maxWidth: '80%',
    padding: '1rem',
    borderRadius: '1rem',
    background: role === 'user' ? '#fbbf24' : '#1f2937',
    color: role === 'user' ? '#000' : '#d1d5db',
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    border: role === 'user' ? 'none' : '1px solid #374151'
  });

  const inputAreaStyle = {
    padding: isMobile ? '1rem' : '1.5rem',
    borderTop: '1px solid #1f2937',
    background: '#111827',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-end'
  };

  const inputStyle = {
    flex: 1,
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    background: '#1f2937',
    border: '1px solid #374151',
    color: '#d1d5db',
    fontSize: '0.875rem',
    resize: 'none',
    minHeight: '48px',
    fontFamily: 'inherit'
  };

  const buttonStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    background: '#fbbf24',
    color: '#000',
    fontWeight: '600',
    fontSize: '0.875rem',
    border: 'none',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.5 : 1
  };

  const quickTipsStyle = {
    padding: isMobile ? '1rem' : '1.5rem',
    background: '#111827',
    borderBottom: '1px solid #1f2937'
  };

  return (
    <>
      <TopNavigation />
      <div style={containerStyle}>
        {showQuickTips && (
          <div style={quickTipsStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: isMobile ? '1rem' : '1.125rem', fontWeight: '600', color: '#fbbf24', margin: 0 }}>
                {t('quickTipsTitle')}
              </h2>
              <button
                onClick={() => setShowQuickTips(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.5rem', padding: 0 }}
              >
                ×
              </button>
            </div>
            <div style={{ fontSize: isMobile ? '0.8rem' : '0.875rem', lineHeight: '1.6', color: '#9ca3af' }}>
              <div style={{ marginBottom: '0.5rem' }}>• {t('tip1')}</div>
              <div style={{ marginBottom: '0.5rem' }}>• {t('tip2')}</div>
              <div style={{ marginBottom: '0.5rem' }}>• {t('tip3')}</div>
              <div>• {t('tip4')}</div>
            </div>
          </div>
        )}

        <div style={chatAreaStyle}>
          <div style={{ padding: isMobile ? '1rem' : '1.5rem', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.5rem' }}>
                {currentPersonaName ? (
                  <>
                    {predefinedPersonas.find(p => p.id === persona.theme)?.icon || ''} {currentPersonaName}
                  </>
                ) : (
                  t('title')
                )}
              </h1>
              <p style={{ fontSize: isMobile ? '0.8rem' : '0.875rem', color: '#9ca3af', margin: 0 }}>
                {currentPersonaName ? (
                  (persona.theme ? getPersonaDisplayDescription(predefinedPersonas.find(p => p.id === persona.theme), locale) : null) || t('subtitle')
                ) : (
                  t('subtitle')
                )}
              </p>
            </div>
            <button
              onClick={() => setShowPersonalityModal(true)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                background: '#1f2937',
                border: '1px solid #374151',
                color: '#d1d5db',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              ⚙️ {t('personalityTitle')}
            </button>
          </div>

          <div style={messagesContainerStyle}>
            {messages.map((msg, index) => (
              <div key={index} style={messageStyle(msg.role)}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', opacity: 0.7 }}>
                  {msg.role === 'user' ? t('you') : (currentPersonaName ? (
                    <>
                      {predefinedPersonas.find(p => p.id === persona.theme)?.icon || ''} {currentPersonaName}
                    </>
                  ) : t('title'))}
                </div>
                <div style={{ fontSize: '0.875rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={messageStyle('assistant')}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', opacity: 0.7 }}>
                  {currentPersonaName ? (
                    <>
                      {predefinedPersonas.find(p => p.id === persona.theme)?.icon || ''} {currentPersonaName}
                    </>
                  ) : t('title')}
                </div>
                <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                  {t('typing')}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} style={{ height: '1px' }} />
          </div>

          <div style={inputAreaStyle}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isMobile ? t('inputPlaceholderMobile') : t('inputPlaceholderDesktop')}
              disabled={isLoading}
              style={inputStyle}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              style={buttonStyle}
            >
              {isLoading ? '...' : isMobile ? '→' : t('send')}
            </button>
          </div>
        </div>
      </div>

      {showPersonalityModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowPersonalityModal(false)}
        >
          <div
            style={{
              background: '#111827',
              borderRadius: '1rem',
              padding: '1.5rem',
              maxWidth: '500px',
              width: '100%',
              border: '1px solid #374151',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fbbf24', marginBottom: '0.25rem' }}>
                  {t('personalityTitle')}
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>
                  {t('personalitySubtitle')}
                </p>
              </div>
              <button
                onClick={() => setShowPersonalityModal(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.5rem', padding: 0 }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#fbbf24', marginBottom: '0.5rem' }}>
                  {t('presetPersonalities')}
                </label>
                <select
                  value={selectedPreset || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      selectPreset(e.target.value);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    color: '#d1d5db',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">{t('selectPersonality')}</option>
                  {predefinedPersonas.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.icon} {getPersonaDisplayName(preset, locale)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPreset && (() => {
                const selectedPersona = predefinedPersonas.find(p => p.id === selectedPreset);
                if (!selectedPersona) return null;
                return (
                  <div style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    background: '#1f2937',
                    border: '1px solid #374151'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{selectedPersona.icon}</span>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#fbbf24', margin: 0 }}>
                        {getPersonaDisplayName(selectedPersona, locale)}
                      </h3>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#9ca3af', lineHeight: '1.6', margin: 0 }}>
                      {getPersonaDisplayDescription(selectedPersona, locale)}
                    </p>
                  </div>
                );
              })()}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid #374151', paddingTop: '1rem' }}>
              <button
                onClick={() => setShowPersonalityModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  background: '#1f2937',
                  border: '1px solid #374151',
                  color: '#d1d5db',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                {tc('cancel')}
              </button>
              <button
                onClick={savePersonality}
                disabled={savingPersonality}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  background: '#fbbf24',
                  color: '#000',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: savingPersonality ? 'not-allowed' : 'pointer',
                  opacity: savingPersonality ? 0.5 : 1
                }}
              >
                {savingPersonality ? '...' : t('savePersonality')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
