import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import './globals.css';

export const metadata = {
  title: 'Venoxa Auth & Sync',
  description: 'Scalable authentication and cloud sync system for user progress.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#F7F9FC] text-[#0A0A0A] dark:bg-[#0B1020] dark:text-[#F8FAFC] transition-colors duration-300">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
