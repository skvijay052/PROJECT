# Bandhanaa Website

Modern Next.js landing page for the Bandhanaa matrimony platform.

## Local development

```bash
cd website
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Create `.env.local` from `.env.example` and update these values:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_ANDROID_APP_URL=https://your-domain.com/downloads/bandhanaa.apk
NEXT_PUBLIC_IOS_APP_URL=https://testflight.apple.com/join/your-code
NEXT_PUBLIC_SUPPORT_EMAIL=hello@bandhanaa.com
```

## Vercel deployment

1. Import the `website` directory as a Vercel project.
2. Add the same environment variables in the Vercel dashboard.
3. Deploy.

The landing page already includes:

- App Router structure for Next.js
- SEO metadata, sitemap, robots, and JSON-LD
- Animated modern landing page sections
- Android APK and iPhone/TestFlight CTA slots
