import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sistem Reservasi Kos - Temukan & Pesan Kos Terpercaya',
  description:
    'Platform reservasi kos modern, aman, dan mudah. Temukan berbagai pilihan kamar kos putra, putri, dan campur dengan fasilitas lengkap.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={poppins.variable}>
      <body
        className={`${poppins.className} min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased`}
      >
        {/* Header / Navbar Semantik */}
        <Navbar />

        {/* Konten Utama */}
        <main className="flex-1 w-full" id="main-content">
          {children}
        </main>

        {/* Footer Semantik */}
        <Footer />
      </body>
    </html>
  );
}