import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Google Maps Scraper',
  description: 'Scrape data from Google Maps business listings.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#faf9f5] antialiased`}>
        <Header />
        <main className="min-h-screen py-8">
          <div className="container flex flex-col mx-auto">{children}</div>
        </main>
      </body>
    </html>
  );
}
