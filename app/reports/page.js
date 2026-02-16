'use client';
import TopNavigation from '../components/TopNavigation';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState('week');
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports?period=${period}&format=json`);
      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Erro ao gerar report');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goalsguild-report-${period}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <TopNavigation />
      <div style={{ display: 'flex', minHeight: '100vh', paddingTop: '60px', paddingBottom: isMobile ? '80px' : undefined, background: '#0a0a0a', color: '#ededed' }}>
      {/* Sidebar - oculto no mobile */}
      <div style={{ display: isMobile ? 'none' : 'block', width: '280px', background: '#111827', borderRight: '1px solid #1f2937', padding: '1rem' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            background: '#1f2937',
            border: '1px solid #374151',
            color: '#d1d5db',
            fontSize: '0.875rem',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '0.5rem'
          }}
        >
          ← Voltar
        </button>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#1f2937', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
            📊 PERÍODO
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
            <button
              onClick={() => setPeriod('week')}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '0.25rem',
                background: period === 'week' ? '#fbbf24' : '#374151',
                color: period === 'week' ? '#000' : '#d1d5db',
                fontSize: '0.75rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Semana
            </button>
            <button
              onClick={() => setPeriod('month')}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '0.25rem',
                background: period === 'month' ? '#fbbf24' : '#374151',
                color: period === 'month' ? '#000' : '#d1d5db',
                fontSize: '0.75rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Mês
            </button>
          </div>

          <button
            onClick={generateReport}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: '#10b981',
              color: '#fff',
              fontWeight: '600',
              fontSize: '0.875rem',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {isLoading ? 'Gerando...' : '📊 Gerar Report'}
          </button>

          {report && (
            <button
              onClick={downloadReport}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: '#3b82f6',
                color: '#fff',
                fontWeight: '600',
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              📥 Baixar TXT
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '1rem' }}>
          📊 Reports
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '2rem' }}>
          Gere relatórios detalhados do seu progresso
        </p>

        {!report ? (
          <div style={{ padding: '2rem', background: '#1f2937', borderRadius: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <div style={{ fontSize: '1.125rem', color: '#d1d5db', marginBottom: '0.5rem' }}>
              Pronto para gerar seu report
            </div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1rem' }}>
              Selecione o período e clique em "Gerar Report"
            </div>
            <button
              onClick={generateReport}
              disabled={isLoading}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                background: '#10b981',
                color: '#fff',
                fontWeight: '600',
                fontSize: '0.875rem',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1
              }}
            >
              {isLoading ? 'Gerando...' : '📊 Gerar Report'}
            </button>
          </div>
        ) : (
          <div style={{ padding: '1.5rem', background: '#1f2937', borderRadius: '0.5rem', border: '1px solid #374151' }}>
            <pre style={{
              fontSize: '0.75rem',
              color: '#d1d5db',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontFamily: 'monospace',
              lineHeight: '1.6'
            }}>
              {report}
            </pre>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
