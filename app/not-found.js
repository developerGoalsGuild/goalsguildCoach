import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      color: '#ededed',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>404</h1>
      <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>Page not found.</p>
      <Link
        href="/"
        style={{
          color: '#f59e0b',
          textDecoration: 'none',
          fontWeight: '500'
        }}
      >
        ← Back to home
      </Link>
    </div>
  );
}
