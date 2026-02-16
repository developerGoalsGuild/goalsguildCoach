'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNavigation from '../components/TopNavigation';

export default function InsightsPage() {
  const router = useRouter();
  const [insights, setInsights] = useState(null);
  const [weeklyReview, setWeeklyReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchInsights();
    fetchWeeklyReview();
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/insights', {
        method: 'POST'
      });
      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklyReview = async () => {
    try {
      const response = await fetch('/api/weekly-review');
      const data = await response.json();
      setWeeklyReview(data);
    } catch (error) {
      console.error('Error fetching weekly review:', error);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a', color: '#ededed' }}>
        <div>Carregando insights...</div>
      </div>
    );
  }

  return (
    <>
      <TopNavigation />
      <div style={{ minHeight: '100vh', paddingTop: '60px', paddingBottom: isMobile ? '80px' : undefined, background: '#0a0a0a', color: '#ededed', padding: isMobile ? '1rem' : '2rem' }}>
        {/* Barra no topo: voltar + resumo */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#111827', borderRadius: '0.5rem', border: '1px solid #1f2937' }}>
          <button
            onClick={() => router.push('/')}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: '#1f2937', border: '1px solid #374151', color: '#d1d5db', fontSize: '0.875rem', cursor: 'pointer' }}
          >
            ← Voltar
          </button>
          <span style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
            🤖 <strong style={{ color: '#fbbf24' }}>{insights?.insights?.length || 0}</strong> insights automáticos
          </span>
          {weeklyReview && (
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              📅 {new Date(weeklyReview.period?.start).toLocaleDateString('pt-BR')} – {new Date(weeklyReview.period?.end).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>

      {/* Main Content */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '1rem' }}>
          💡 Insights Dashboard
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '2rem' }}>
          Análises automáticas do seu progresso e padrões
        </p>

        {/* AI Insights */}
        {insights?.insights && insights.insights.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#d1d5db', marginBottom: '1rem' }}>
              🤖 Insights Automáticos
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {insights.insights.map((insight, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1.5rem',
                    background: '#1f2937',
                    borderRadius: '0.5rem',
                    border: `2px solid ${insight.impact === 'high' ? '#fbbf24' : '#374151'}`
                  }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#fbbf24', marginBottom: '0.5rem' }}>
                    {insight.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#d1d5db', marginBottom: '0.5rem' }}>
                    {insight.description}
                  </p>
                  {insight.recommendation && (
                    <div style={{ padding: '0.75rem', background: '#374151', borderRadius: '0.25rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#10b981', marginBottom: '0.25rem' }}>
                        💡 Recomendação
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
                        {insight.recommendation}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Predictions */}
        {insights?.predictions && insights.predictions.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#d1d5db', marginBottom: '1rem' }}>
              📅 Previsões de Conclusão
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {insights.predictions.map((pred, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1.5rem',
                    background: '#1f2937',
                    borderRadius: '0.5rem',
                    border: '1px solid #374151'
                  }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#fbbf24', marginBottom: '0.5rem' }}>
                    {pred.objective.substring(0, 60)}...
                  </h3>
                  <div style={{ fontSize: '0.875rem', color: '#d1d5db', marginBottom: '0.25rem' }}>
                    Data de Conclusão: <span style={{ color: '#10b981' }}>
                      {new Date(pred.prediction.completionDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                    Dias até conclusão: {pred.prediction.daysToCompletion}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    Confiança: {pred.prediction.confidence}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Review */}
        {weeklyReview && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#d1d5db', marginBottom: '1rem' }}>
              📊 Weekly Review
            </h2>
            <div style={{ padding: '1.5rem', background: '#1f2937', borderRadius: '0.5rem', border: '1px solid #374151' }}>
              <pre style={{
                fontSize: '0.75rem',
                color: '#d1d5db',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                fontFamily: 'monospace',
                lineHeight: '1.6'
              }}>
                {weeklyReview.reviewText}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
