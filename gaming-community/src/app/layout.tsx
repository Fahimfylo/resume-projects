import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/lib/auth-context';
import { SocketProvider } from '@/lib/SocketProvider';

export const metadata: Metadata = {
  title: 'NEXUS | Forge Your Gaming Legacy',
  description: 'AI-Powered Mythic Gaming Ecosystem. The ultimate AAA gaming community platform.',
  icons: { icon: '/favicon.png?v=2' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-nexus-void text-foreground selection:bg-nexus-jade selection:text-nexus-void">
        <AuthProvider>
          <SocketProvider>
            <div className="cinematic-fog" />
            <div className="scanline-hud fixed inset-0 pointer-events-none opacity-[0.03] z-[100]" />
            {children}
            <Toaster />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
