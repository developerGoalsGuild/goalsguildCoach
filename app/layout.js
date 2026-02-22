import './globals.css';
import Providers from './providers';

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
