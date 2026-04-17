import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bandhanaa.vercel.app';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Bandhanaa Matrimony App | Modern Matchmaking Website',
    template: '%s | Bandhanaa',
  },
  description:
    'Bandhanaa is a modern matrimony website and matchmaking app with detailed profiles, private chat, shortlist tools, and Android APK or iPhone app download links.',
  keywords: [
    'Bandhanaa',
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
    title: 'Bandhanaa Matrimony App | Modern Matchmaking Website',
    description:
      'Discover thoughtful matrimony profiles, search with clarity, chat privately, and download the Bandhanaa app for Android or iPhone.',
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
    title: 'Bandhanaa Matrimony App | Modern Matchmaking Website',
    description:
      'A modern matrimony landing page with app download links, secure chat positioning, and search-friendly matchmaking content.',
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
  themeColor: '#050505',
  colorScheme: 'dark',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="site-body">{children}</body>
    </html>
  );
}
