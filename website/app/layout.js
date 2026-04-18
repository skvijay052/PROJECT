import './globals.css';
import { Analytics } from '@vercel/analytics/next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bandhanaa.vercel.app';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Bandhanaa | App-First Matchmaking Website',
    template: '%s | Bandhanaa',
  },
  description:
    'Bandhanaa is a soft, app-first matchmaking website with smart search, likes and interests, and Android or iPhone download paths.',
  keywords: [
    'Bandhanaa',
    'matrimony',
    'dating',
    'dating app',
    'dating website',
    'dating platform',
    'online dating',
    'Tamil Matrimony',
    'Matrimony Site',
    'Free Registration',
    'Happy Marriages',
    'Matrimony near me',
    'Matrimony meaning',
    'Matrimony Bangalore',
    'Matrimony Login',
    'Free matrimony Bangalore',
    'Matrimonial website & android app',
    'online chatting',
    'Bandhanaa matrimony',
    'matrimony website',
    'matrimony app',
    'matchmaking app',
    'marriage bureau app',
    'marriage matching platform',
    'secure chat app',
    'android apk download',
    'iPhone app download',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Bandhanaa | App-First Matchmaking Website',
    description:
      'Explore a lighter Bandhanaa landing page shaped by the app UI, with smart search, interests, and direct mobile download actions.',
    url: '/',
    siteName: 'Bandhanaa',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Bandhanaa matrimony website preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bandhanaa | App-First Matchmaking Website',
    description:
      'A pastel, app-first Bandhanaa landing page with smart search previews, interests, and mobile download links.',
    images: ['/twitter-image'],
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  category: 'lifestyle',
  applicationName: 'Bandhanaa',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f7fcfd',
  colorScheme: 'light',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="site-body">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
