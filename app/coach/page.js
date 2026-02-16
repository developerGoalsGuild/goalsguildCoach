'use client';

import dynamic from 'next/dynamic';

const CoachClient = dynamic(() => import('./CoachClient'), { ssr: false });

export default function CoachPage() {
  return <CoachClient />;
}
