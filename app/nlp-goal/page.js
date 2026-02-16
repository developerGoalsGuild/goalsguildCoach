'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopNavigation from '../components/TopNavigation';

export default function NLPGoalPage() {
  const router = useRouter();
  const [phase, setPhase] = useState('clarification');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [objectiveData, setObjectiveData] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Iniciar sessão NLP
  useEffect(() => {
    fetch('/api/coach/nlp-goal')
      .then(res => res.json())
      .then(data => {
        setMessages([{ role: 'assistant', content: data.message }]);
        setPhase(data.phase);
      })
      .catch(err => console.error('Error starting NLP session:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/coach/nlp-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage,
          phase,
          objectiveData
        })
      });

      const data = await res.json();
      
      if (data.saveObjective) {
        // Salvar objetivo completo na tabela unificada goals
        const token = localStorage.getItem('token');
        await fetch('/api/goals', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: objectiveData.title || objectiveData.statement,
            description: objectiveData.description || objectiveData.statement,
            category: objectiveData.category,
            is_nlp_complete: true,
            nlp_criteria_positive: objectiveData.nlp_criteria_positive,
            nlp_criteria_sensory: objectiveData.nlp_criteria_sensory,
            nlp_criteria_compelling: objectiveData.nlp_criteria_compelling,
            nlp_criteria_ecology: objectiveData.nlp_criteria_ecology,
            nlp_criteria_self_initiated: objectiveData.nlp_criteria_self_initiated,
            nlp_criteria_context: objectiveData.nlp_criteria_context,
            nlp_criteria_resources: objectiveData.nlp_criteria_resources,
            nlp_criteria_evidence: objectiveData.nlp_criteria_evidence
          })
        });
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.message + ' Seu objetivo foi salvo! Vamos transformar isso em quests e tasks agora.' 
        }]);
        setPhase('complete');
      } else if (data.needsAdjustment) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        setPhase(data.nextPhase || phase);
      }
    } catch (err) {
      console.error('Error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Desculpe, ocorreu um erro. Tente novamente.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopNavigation />
      <div style={{ display: 'flex', minHeight: '100vh', paddingTop: '60px', paddingBottom: isMobile ? '80px' : undefined, background: '#0a0a0a', color: '#ededed' }}>
      <div style={{ display: isMobile ? 'none' : 'block', width: '280px', background: '#111827', borderRight: '1px solid #1f2937', padding: '1rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.5rem', cursor: 'pointer' }} onClick={() => router.push('/')}>
          🦅 Voltar
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1rem' }}>
          Definição de Objetivo NLP
        </p>

        <div style={{ padding: '1rem', background: '#1f2937', borderRadius: '0.5rem', border: '1px solid #374151', fontSize: '0.75rem' }}>
          <div style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>Fase Atual:</div>
          <div style={{ color: '#d1d5db', fontWeight: '600', textTransform: 'capitalize' }}>
            {phase === 'complete' ? 'Completo! 🎉' : phase}
          </div>
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
          <p style={{ marginBottom: '0.5rem' }}>**8 Critérios NLP:**</p>
          <ol style={{ paddingLeft: '1rem' }}>
            <li style={{ marginBottom: '0.25rem', color: phase === 'positive' ? '#fbbf24' : '#9ca3af' }}>Positivo</li>
            <li style={{ marginBottom: '0.25rem', color: phase === 'sensory' ? '#fbbf24' : '#9ca3af' }}>Sensorial</li>
            <li style={{ marginBottom: '0.25rem', color: phase === 'compelling' ? '#fbbf24' : '#9ca3af' }}>Atraente</li>
            <li style={{ marginBottom: '0.25rem', color: phase === 'ecology' ? '#fbbf24' : '#9ca3af' }}>Ecologia</li>
            <li style={{ marginBottom: '0.25rem', color: phase === 'control' ? '#fbbf24' : '#9ca3af' }}>No Controle</li>
            <li style={{ marginBottom: '0.25rem', color: phase === 'context' ? '#fbbf24' : '#9ca3af' }}>Contexto</li>
            <li style={{ marginBottom: '0.25rem', color: phase === 'resources' ? '#fbbf24' : '#9ca3af' }}>Recursos</li>
            <li style={{ marginBottom: '0.25rem', color: phase === 'evidence' ? '#fbbf24' : '#9ca3af' }}>Evidência</li>
          </ol>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: isMobile ? '1rem' : '2rem' }}>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                borderRadius: '0.5rem',
                background: msg.role === 'user' ? '#1f2937' : '#111827',
                border: `1px solid ${msg.role === 'user' ? '#374151' : '#1f2937'}`,
                marginLeft: msg.role === 'user' ? '2rem' : '0',
                maxWidth: '80%',
                color: '#d1d5db'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                {msg.role === 'user' ? 'Você' : 'Coach'}
              </div>
              <div style={{ lineHeight: '1.6' }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ padding: '1rem', color: '#9ca3af' }}>
              Coach digitando...
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Responda ao coach..."
            disabled={loading || phase === 'complete'}
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#d1d5db',
              fontSize: '1rem'
            }}
          />
          <button
            type="submit"
            disabled={loading || phase === 'complete'}
            style={{
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              background: phase === 'complete' ? '#374151' : '#f59e0b',
              color: phase === 'complete' ? '#9ca3af' : '#000',
              fontWeight: '600',
              border: 'none',
              cursor: phase === 'complete' ? 'not-allowed' : 'pointer',
              fontSize: '1rem'
            }}
          >
            {loading ? '...' : phase === 'complete' ? 'Salvo!' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
    </>
  );
}
