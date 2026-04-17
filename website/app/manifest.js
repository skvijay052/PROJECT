const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bandhanaa.vercel.app';

export default function manifest() {
  return {
    name: 'Bandhanaa Matrimony Website',
    short_name: 'Bandhanaa',
    description:
      'Modern matrimony website and app landing page for matchmaking, private chat, and app downloads.',
    start_url: siteUrl,
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#050505',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
