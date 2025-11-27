import type { ReactNode } from 'react';
import { AuthProvider } from './providers/AuthProvider';

export const metadata = {
  title: 'Premium Web Creators',
  description: 'AI training platform for modern web businesses.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}


