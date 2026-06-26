import type { Metadata } from 'next';
import { ToastProvider } from '@/components/ToastProvider';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'BOXMEOUT — Boxing Prediction Market',
  description: 'Decentralized boxing prediction market on Stellar',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
