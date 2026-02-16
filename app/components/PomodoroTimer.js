// Otimizado para Mobile - PomodoroTimer
// Timer circular, touch-friendly, lock screen

'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from '../lib/i18n';

export default function PomodoroTimer() {
  const t = useTranslations('pomodoro');
  const [mode, setMode] = useState('pomodoro'); // pomodoro, short_break, long_break
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const intervalRef = useRef(null);

  const MODES = {
    pomodoro: { label: 'Pomodoro', time: 25 * 60, color: '#fbbf24' },
    short_break: { label: 'Pausa Curta', time: 5 * 60, color: '#10b981' },
    long_break: { label: 'Pausa Longa', time: 15 * 60, color: '#3b82f6' }
  };

  useEffect(() => {
    // Auto-switch to long break after 4 pomodoros
    if (pomodorosCompleted > 0 && pomodorosCompleted % 4 === 0 && !isRunning) {
      setMode('long_break');
    }
  }, [pomodorosCompleted, isRunning]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            if (mode === 'pomodoro') {
              setPomodorosCompleted(prev => prev + 1);
            }
            return MODES[mode].time;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = timeLeft / MODES[mode].time;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (1 - progress);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{
      background: '#111827',
      borderRadius: '16px',
      padding: isMobile ? '16px' : '24px',
      margin: '16px 0',
      border: '1px solid #1f2937'
    }}>
      {/* Mode Selector */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: isMobile ? '16px' : '24px',
        flexWrap: 'wrap'
      }}>
        {Object.entries(MODES).map(([key, value]) => (
          <button
            key={key}
            onClick={() => {
              setMode(key);
              setTimeLeft(value.time);
              setIsRunning(false);
            }}
            style={{
              flex: 1,
              minWidth: isMobile ? '80px' : '100px',
              padding: isMobile ? '12px 8px' : '12px 16px',
              background: mode === key ? value.color : '#1f2937',
              color: mode === key ? '#0a0a0a' : '#9ca3af',
              border: 'none',
              borderRadius: '8px',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              fontWeight: mode === key ? 'bold' : 'normal',
              cursor: 'pointer',
              minHeight: '44px',
              touchAction: 'manipulation'
            }}
          >
            {value.label}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: isMobile ? '16px' : '24px',
        padding: isMobile ? '16px' : '24px'
      }}>
        {/* Circular Progress */}
        <div style={{ position: 'relative' }}>
          <svg
            width={isMobile ? 200 : 280}
            height={isMobile ? 200 : 280}
            style={{ transform: 'rotate(-90deg)' }}
          >
            {/* Background Circle */}
            <circle
              cx={isMobile ? 100 : 140}
              cy={isMobile ? 100 : 140}
              r={isMobile ? 90 : 120}
              fill="none"
              stroke="#1f2937"
              strokeWidth={isMobile ? 8 : 12}
            />
            {/* Progress Circle */}
            <circle
              cx={isMobile ? 100 : 140}
              cy={isMobile ? 100 : 140}
              r={isMobile ? 90 : 120}
              fill="none"
              stroke={MODES[mode].color}
              strokeWidth={isMobile ? 8 : 12}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 1s linear'
              }}
            />
          </svg>

          {/* Time Text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: isMobile ? '2.5rem' : '3.5rem',
              fontWeight: 'bold',
              color: '#ededed',
              fontFamily: 'monospace'
            }}>
              {formatTime(timeLeft)}
            </div>
            <div style={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              color: '#9ca3af',
              marginTop: '8px'
            }}>
              {MODES[mode].label}
            </div>
          </div>
        </div>

        {/* Pomodoros Counter */}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: isMobile ? '12px' : '16px',
                height: isMobile ? '12px' : '16px',
                borderRadius: '50%',
                background: i < pomodorosCompleted % 4 ? '#fbbf24' : '#1f2937'
              }}
            />
          ))}
          <span style={{
            marginLeft: '8px',
            fontSize: isMobile ? '0.875rem' : '1rem',
            color: '#9ca3af'
          }}>
            {pomodorosCompleted} completados
          </span>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: '16px',
          width: '100%',
          maxWidth: '400px'
        }}>
          <button
            onClick={() => setIsRunning(!isRunning)}
            style={{
              flex: 1,
              padding: isMobile ? '16px' : '20px',
              background: isRunning ? '#ef4444' : '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              minHeight: '56px',
              touchAction: 'manipulation'
            }}
          >
            {isRunning ? '⏸ Pausar' : '▶ Iniciar'}
          </button>

          <button
            onClick={() => {
              setTimeLeft(MODES[mode].time);
              setIsRunning(false);
            }}
            style={{
              padding: isMobile ? '16px' : '20px',
              background: '#1f2937',
              color: '#ededed',
              border: 'none',
              borderRadius: '12px',
              fontSize: isMobile ? '1rem' : '1.125rem',
              cursor: 'pointer',
              minHeight: '56px',
              minWidth: '80px',
              touchAction: 'manipulation'
            }}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Tips */}
      {isMobile && isRunning && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#1f2937',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: '#9ca3af',
          textAlign: 'center'
        }}>
          💡 Dica: Mantenha o app aberto para ouvir o alarme
        </div>
      )}
    </div>
  );
}
