/**
 * Error Boundary Component
 * Captura erros do React e mostra UI amigável
 */

'use client';

import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error em produção (opcional)
    if (typeof window !== 'undefined' && window.console) {
      console.error('ErrorBoundary capturou erro:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          background: '#0a0a0a',
          color: '#ededed'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem',
            animation: 'shake 0.5s ease-in-out'
          }}>
            😅
          </div>
          
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#fbbf24',
            marginBottom: '1rem'
          }}>
            Ops! Algo deu errado
          </h1>
          
          <p style={{
            fontSize: '1rem',
            color: '#9ca3af',
            marginBottom: '1.5rem',
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            Um erro inesperado ocorreu. Não se preocupe, não perdemos nada.
          </p>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f59e0b',
                color: '#000',
                fontWeight: '600',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              🔄 Recarregar Página
            </button>

            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#1f2937',
                color: '#d1d5db',
                fontWeight: '600',
                borderRadius: '0.5rem',
                border: '1px solid #374151',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              🏠 Ir para Home
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#1f2937',
              borderRadius: '0.5rem',
              border: '1px solid #374151'
            }}>
              <summary style={{
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#fbbf24',
                marginBottom: '1rem'
              }}>
                🐛 Detalhes do erro (development only)
              </summary>
              <pre style={{
                fontSize: '0.75rem',
                color: '#d1d5db',
                overflow: 'auto',
                maxHeight: '300px'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <style jsx>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-10px); }
              75% { transform: translateX(10px); }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}
