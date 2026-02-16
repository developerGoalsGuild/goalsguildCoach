'use client';

import TopNavigation from './TopNavigation';

export default function Layout({ children }) {
  return (
    <>
      <TopNavigation />
      <div style={{ paddingTop: '60px' }}>
        {children}
      </div>
    </>
  );
}
