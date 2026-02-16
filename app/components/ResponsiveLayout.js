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

// Layout responsivo padrão
export function ResponsiveLayout({ children, showNav = true }) {
  const { isMobile } = useResponsive();

  const containerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    height: isMobile ? 'auto' : '100vh',
    paddingTop: showNav ? '60px' : '0',
    background: '#0a0a0a',
    color: '#ededed'
  };

  const sidebarStyle = {
    width: isMobile ? '100%' : '280px',
    height: isMobile ? 'auto' : '100vh',
    background: '#111827',
    borderRight: isMobile ? 'none' : '1px solid #1f2937',
    borderBottom: isMobile ? '1px solid #1f2937' : 'none',
    padding: isMobile ? '1rem' : '1rem',
    overflowY: isMobile ? 'visible' : 'auto'
  };

  const mainContentStyle = {
    flex: 1,
    padding: isMobile ? '1rem' : '2rem',
    height: isMobile ? 'auto' : 'calc(100vh - 60px)',
    overflowY: 'auto'
  };

  return (
    <div style={containerStyle}>
      {!isMobile && (
        <div style={sidebarStyle}>
          {/* Sidebar content */}
        </div>
      )}
      <div style={mainContentStyle}>
        {children}
      </div>
      {isMobile && (
        <div style={sidebarStyle}>
          {/* Mobile sidebar */}
        </div>
      )}
    </div>
  );
}
