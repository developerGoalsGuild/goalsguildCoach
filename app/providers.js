'use client';

import ErrorBoundary from './components/ErrorBoundary';
import { I18nProvider } from './lib/i18n';

export default function Providers({ children }) {
  return (
    <I18nProvider>
      <ErrorBoundary>{children}</ErrorBoundary>
    </I18nProvider>
  );
}
