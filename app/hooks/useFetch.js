/**
 * useFetch Hook com Retry Logic e Caching
 * Requisições com retry automático e cache inteligente
 */

'use client';

import { useState, useCallback, useRef } from 'react';

const CACHE = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }
      
      // Não retry em erros de cliente (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }
      
      lastError = new Error(`HTTP ${response.status}`);
      
      // Se não é a última tentativa, esperar antes de retry
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      lastError = error;
      
      // Se não é a última tentativa, esperar antes de retry
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

export function useCache() {
  const get = useCallback((key) => {
    const cached = CACHE.get(key);
    if (!cached) return null;
    
    const { data, timestamp } = cached;
    const age = Date.now() - timestamp;
    
    if (age > CACHE_DURATION) {
      CACHE.delete(key);
      return null;
    }
    
    return data;
  }, []);
  
  const set = useCallback((key, data) => {
    CACHE.set(key, {
      data,
      timestamp: Date.now()
    });
  }, []);
  
  const invalidate = useCallback((key) => {
    if (key) {
      CACHE.delete(key);
    } else {
      CACHE.clear();
    }
  }, []);
  
  return { get, set, invalidate };
}

export function useFetch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { get, set, invalidate } = useCache();
  const abortControllerRef = useRef();
  
  const fetchCached = useCallback(async (url, options = {}, useCache = true) => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    // Verificar cache
    if (useCache) {
      const cached = get(url);
      if (cached) {
        return { data: cached, cached: true };
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchWithRetry(url, {
        ...options,
        signal: abortControllerRef.current.signal
      });
      
      const data = await response.json();
      
      // Salvar no cache se for bem-sucedido
      if (response.ok && useCache) {
        set(url, data);
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      return { data, cached: false };
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err);
        throw err;
      }
      return { data: null, cached: false };
    } finally {
      setLoading(false);
    }
  }, [get, set]);
  
  return {
    fetch: fetchCached,
    loading,
    error,
    invalidate
  };
}

export default useFetch;
