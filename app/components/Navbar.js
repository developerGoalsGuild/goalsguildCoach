import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div style={{ width: '280px', background: '#111827', borderRight: '1px solid #1f2937', padding: '1rem' }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.5rem' }}>
          🦅 GoalsGuild
        </h1>
      </Link>

      {user && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#1f2937', borderRadius: '0.5rem', border: '1px solid #374151' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
            Olá,
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#d1d5db' }}>
            {user.name}
          </div>
        </div>
      )}

      <div style={{ marginTop: 'auto' }}>
        <Link href="/coach" style={{ textDecoration: 'none' }}>
          <button style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#1f2937', border: '1px solid #374151', color: '#d1d5db', fontSize: '0.875rem', border: 'none', cursor: 'pointer', marginBottom: '0.5rem' }}>
            🤖 Coach AI
          </button>
        </Link>

        <Link href="/quests" style={{ textDecoration: 'none' }}>
          <button style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#1f2937', border: '1px solid #374151', color: '#d1d5db', fontSize: '0.875rem', border: 'none', cursor: 'pointer', marginBottom: '0.5rem' }}>
            🎯 Quests
          </button>
        </Link>

        <Link href="/tasks" style={{ textDecoration: 'none' }}>
          <button style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#1f2937', border: '1px solid #374151', color: '#d1d5db', fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}>
            ✅ Tasks
          </button>
        </Link>

        <button
          onClick={handleLogout}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#dc2626', color: '#fff', fontSize: '0.875rem', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
