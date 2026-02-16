/**
 * Search Component
 * Busca e filtros para tasks e quests
 */

'use client';

import { useState } from 'react';

export default function SearchBar({ onSearch, placeholder }) {
  const [search, setSearch] = useState('');

  const handleSearch = (value) => {
    setSearch(value);
    onSearch(value);
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '0.75rem 2.5rem 0.75rem 1rem',
            background: '#111827',
            border: '1px solid #374151',
            borderRadius: '0.5rem',
            color: '#ededed',
            fontSize: '0.875rem'
          }}
        />
        <div style={{ 
          position: 'absolute', 
          right: '0.75rem', 
          top: '50%', 
          transform: 'translateY(-50%)',
          color: search ? '#fbbf24' : '#9ca3af',
          fontSize: '1rem'
        }}>
          🔍
        </div>
      </div>
    </div>
  );
}
