// Hook customizado para detectar mobile
import { useState, useEffect } from 'react';

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isTablet, isDesktop };
}

// Layout responsivo padrão (sem barra lateral; conteúdo com padding)
export function ResponsiveLayout({ children, showNav = true }) {
  const { isMobile } = useResponsive();

  const containerStyle = {
    display: 'block',
    minHeight: '100vh',
    paddingTop: showNav ? '60px' : '0',
    background: '#0a0a0a',
    color: '#ededed'
  };

  const mainContentStyle = {
    padding: isMobile ? '1rem' : '2rem',
    paddingBottom: isMobile ? '80px' : '2rem',
    overflowY: 'auto'
  };

  return (
    <div style={containerStyle}>
      <div style={mainContentStyle}>
        {children}
      </div>
    </div>
  );
}
