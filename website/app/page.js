import Image from 'next/image';

import LogoMark from '../components/logo-mark';
import Reveal from '../components/reveal';
import SiteHeader from '../components/site-header';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bandhanaa.vercel.app';
const androidDownloadUrl = process.env.NEXT_PUBLIC_ANDROID_APP_URL || '';
const iosDownloadUrl = process.env.NEXT_PUBLIC_IOS_APP_URL || '';
const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'hello@bandhanaa.com';

const navItems = [
  { label: 'Home', href: '#top' },
  { label: 'Features', href: '#features' },
  { label: 'App Preview', href: '#app-preview' },
  { label: 'Why It Works', href: '#why-it-works' },
  { label: 'Download', href: '#download' },
];

const heroStats = [
  { value: '3M +', label: 'Verified Profiles' },
  { value: 'Mint + lavender', label: 'Safe & Private' },
  { value: 'Android / iPhone', label: 'Free to Get Started' },
];

const featureCards = [
  {
    icon: 'search',
    eyebrow: 'Smart match search',
    title: 'Filter profiles, score them, and surface the strongest fits.',
    description:
      'Filter profiles based on what truly matters to you — age, values, lifestyle, and preferences. Bandhanaa helps surface the most relevant matches instead of overwhelming you with endless options.',
  },
  {
    icon: 'interest',
    eyebrow: 'Likes and interests',
    title: 'Turn interest into a clear next step with more context.',
    description:
      'Express interest thoughtfully and connect only when both sides are comfortable. Every interaction is designed to be meaningful — not random.',
  },
  {
    icon: 'chat',
    eyebrow: 'Private conversations',
    title: 'Position Bandhanaa as intentional matchmaking, not endless swiping.',
    description:
      'Start conversations only after mutual interest. Enjoy a safe and respectful environment built for serious relationships.',
  },
];

const storyPoints = [
  'Clear onboarding experience',
  'Smart profile discovery',
  'Seamless communication flow',
];

const designNotes = [
  'Clean and distraction-free interface',
  'Soft, welcoming design language',
  'Built for clarity and ease of use',
];

function DownloadButton({ href, title, meta, platform, variant = 'primary' }) {
  const isActive = Boolean(href);
  const resolvedHref = isActive ? href : '#download';

  return (
    <a
      className={`store-button store-button--${variant} ${!isActive ? 'is-disabled' : ''}`.trim()}
      href={resolvedHref}
      target={isActive ? '_blank' : undefined}
      rel={isActive ? 'noreferrer' : undefined}
      aria-disabled={!isActive}
    >
      <span className={`store-button__badge store-button__badge--${platform}`}>{platform}</span>
      <span className="store-button__copy">
        <small>{meta}</small>
        <strong>{title}</strong>
      </span>
    </a>
  );
}

function FeatureGlyph({ icon }) {
  if (icon === 'search') {
    return (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="9" />
        <path d="M27 27l10 10" />
        <path d="M20 16v8" />
        <path d="M16 20h8" />
      </svg>
    );
  }

  if (icon === 'interest') {
    return (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M24 37 13.4 26.9a7.1 7.1 0 0 1 0-10.3 7.8 7.8 0 0 1 11.1 0l.2.2.2-.2a7.8 7.8 0 0 1 11.1 0 7.1 7.1 0 0 1 0 10.3L24 37Z" />
        <path d="m20 24 3 3 5-6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M10 14a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H19l-7 6v-6h-2a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6Z" />
      <path d="M17 18h14" />
      <path d="M17 23h10" />
    </svg>
  );
}

function PhoneShell({ className = '', children }) {
  return (
    <div className={`phone-shell ${className}`.trim()}>
      <div className="phone-shell__notch" />
      <div className="phone-shell__screen">{children}</div>
    </div>
  );
}

function PhonePreviewImage({ src, alt, priority = false }) {
  return (
    <div className="phone-preview-media">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 520px) 260px, (max-width: 720px) 278px, 288px"
        className="phone-preview-media__image"
      />
    </div>
  );
}

function ScreenDecor() {
  return (
    <>
      <span className="screen-orb screen-orb--mint" aria-hidden="true" />
      <span className="screen-orb screen-orb--lavender" aria-hidden="true" />
      <span className="screen-orb screen-orb--butter" aria-hidden="true" />
    </>
  );
}

function BottomNav({ active }) {
  const items = [
    { key: 'home', label: 'Home' },
    { key: 'match', label: 'Match' },
    { key: 'interest', label: 'Interest' },
    { key: 'profile', label: 'Profile' },
  ];

  return (
    <div className="bottom-nav" aria-hidden="true">
      <div className="bottom-nav__center">
        <LogoMark className="bottom-nav__logo" />
      </div>

      <div className="bottom-nav__items">
        {items.map((item) => (
          <div
            className={`bottom-nav__item ${active === item.key ? 'is-active' : ''}`.trim()}
            key={item.key}
          >
            <span className="bottom-nav__glyph" />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoginPreview({ className = '' }) {
  return (
    <PhoneShell className={className}>
      <div className="preview-screen preview-screen--login">
        <PhonePreviewImage src="/img/img-1.jpeg" alt="Bandhanaa login screen" priority />
      </div>
    </PhoneShell>
  );
}

function SearchPreview({ className = '' }) {
  return (
    <PhoneShell className={className}>
      <div className="preview-screen preview-screen--search">
        <PhonePreviewImage src="/img/img-2.jpeg" alt="Bandhanaa smart search screen" priority />
      </div>
    </PhoneShell>
  );
}

function InterestsPreview({ className = '' }) {
  return (
    <PhoneShell className={className}>
      <div className="preview-screen preview-screen--interest">
        <PhonePreviewImage src="/img/img-3.jpeg" alt="Bandhanaa likes and interests screen" />
      </div>
    </PhoneShell>
  );
}

export default function HomePage() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Bandhanaa',
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    email: supportEmail,
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Bandhanaa',
    url: siteUrl,
    description:
      'Bandhanaa is a modern matchmaking website and app with thoughtful search, interests, private chat, and mobile download links.',
    inLanguage: 'en',
  };

  const mobileAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: 'Bandhanaa',
    operatingSystem: 'Android, iOS',
    applicationCategory: 'LifestyleApplication',
    url: siteUrl,
    description:
      'A matchmaking app focused on search filters, meaningful interests, and a calm path into conversation.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    downloadUrl: androidDownloadUrl || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mobileAppSchema) }}
      />

      <div className="page-shell" id="top">
        <div className="ambient-orb ambient-orb--mint" />
        <div className="ambient-orb ambient-orb--lavender" />
        <div className="ambient-orb ambient-orb--butter" />
        <div className="ambient-orb ambient-orb--rose" />

        <SiteHeader navItems={navItems} />

        <main>
          <section className="section hero">
            <Reveal className="hero-copy">
              <p className="eyebrow">Find a Life Partner Who Truly Understands You</p>
              <h1 className="hero-title">
               Start your journey toward a meaningful relationship with clarity, safety, and confidence.
              </h1>
              <p className="hero-description">
               Bandhanaa is a thoughtfully designed matrimony platform that helps you connect with genuine, compatible profiles — without pressure, confusion, or endless swiping.
              </p>

              <div className="hero-actions">
                <DownloadButton
                  href={androidDownloadUrl}
                  title="Download APK"
                  meta="Android"
                  platform="APK"
                  variant="primary"
                />
                <DownloadButton
                  href={iosDownloadUrl}
                  title="Open App"
                  meta="iPhone"
                  platform="iOS"
                  variant="secondary"
                />
              </div>

              <div className="hero-proof">
                {heroStats.map((item) => (
                  <div className="proof-pill" key={item.label}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <div className="hero-visual">
              <Reveal className="hero-stage" delay={0.08}>
                <div className="hero-stage__slab" aria-hidden="true" />
                <div className="hero-stage__blob hero-stage__blob--mint" aria-hidden="true" />
                <div className="hero-stage__blob hero-stage__blob--lavender" aria-hidden="true" />
                <div className="hero-stage__blob hero-stage__blob--rose" aria-hidden="true" />
 
                <div className="hero-chip hero-chip--bottom">Pastel UI carried over from the app</div>
 
                <div className="hero-device">
                  <SearchPreview className="phone-shell--hero" />
                </div>
 
              </Reveal>
            </div>
          </section>

          <section className="section" id="features">
            <Reveal className="section-heading section-heading--center">
              <p className="eyebrow">Feature</p>
              <h2>Designed for Meaningful Matchmaking — Not Just Browsing</h2>
              <p>Every feature in Bandhanaa is built to help you move closer to a real connection — with clarity, intention, and ease.
              </p>
            </Reveal>

            <div className="feature-grid">
              {featureCards.map((card, index) => (
                <Reveal className="feature-card" key={card.title} delay={0.06 * index}>
                  <span className="feature-card__icon">
                    <FeatureGlyph icon={card.icon} />
                  </span>
                  <p className="feature-card__eyebrow">{card.eyebrow}</p>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="section section--showcase" id="app-preview">
            <div className="showcase-grid">
              <Reveal className="showcase-copy">
                <p className="eyebrow">APP EXPERIENCE</p>
                <h2>Everything You Need — In One Simple Experience</h2>
                <p>
                  From creating your profile to discovering matches and starting conversations, Bandhanaa keeps every step simple and intuitive. No clutter. No confusion. Just a smooth journey toward finding the right partner.

                </p>

                <div className="story-list">
                  {storyPoints.map((point) => (
                    <div className="story-list__item" key={point}>
                      {point}
                    </div>
                  ))}
                </div>
              </Reveal>

              <div className="showcase-phones">
                <Reveal className="showcase-phone showcase-phone--lift" delay={0.08}>
                  <LoginPreview />
                </Reveal>
                <Reveal className="showcase-phone" delay={0.14}>
                  <SearchPreview />
                </Reveal> 
              </div>
            </div>
          </section>

          <section className="section section--story" id="why-it-works">
            <div className="story-grid">
              <Reveal className="story-panel">
                <p className="eyebrow">WHY THIS WORKS</p>
                <h2>More Than Just a Matrimony App</h2>
                <p>Bandhanaa is built with one goal — to help you find a meaningful and lasting relationship.
Unlike generic platforms, we focus on quality over quantity, intention over randomness, and real connections over endless browsing.
                </p>
              </Reveal>

              <Reveal className="design-panel" delay={0.12}>
                <p className="design-panel__label">DESIGN PHILOSOPHY</p>
                <h3>A Thoughtful Experience, Designed Around You</h3>

                <div className="design-panel__list">
                  {designNotes.map((note) => (
                    <div className="design-panel__item" key={note}>
                      {note}
                    </div>
                  ))}
                </div>

                <div className="design-panel__profile">
                  <Image
                    src="/default-profile-photo.png"
                    alt="Sample Bandhanaa profile illustration"
                    width={84}
                    height={84}
                    className="design-panel__photo"
                  />
                  <div>
                    <strong>Built around the current app language</strong>
                    <p>Mint, lavender, cream cards, rounded forms, and crisp dark text.</p>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          <section className="section section--download" id="download">
            <Reveal className="download-panel">
              <div className="download-copy">
                <p className="eyebrow">Download</p>
                <h2>Take the First Step Toward Your Future.</h2>
                <p>
                  Join Bandhanaa today and start your journey toward finding a partner who truly matches your values and expectations. Simple. Safe. Meaningful.

                </p>

                <div className="hero-actions">
                  <DownloadButton
                    href={androidDownloadUrl}
                    title="Install APK"
                    meta="Android"
                    platform="APK"
                    variant="primary"
                  />
                  <DownloadButton
                    href={iosDownloadUrl}
                    title="Open Link"
                    meta="iPhone"
                    platform="iOS"
                    variant="secondary"
                  />
                </div>
              </div>

              <div className="download-visual">
                <InterestsPreview className="phone-shell--download" />
              </div>
            </Reveal>
          </section>
        </main>

        <footer className="footer-rail">
          <div className="footer-cta">
            <div className="footer-cta__inner">
              <h2>Ready to Begin Your Journey?</h2> 
              
              <a className="button button--sun" href="#download">
                Get Started
              </a>
            </div>
          </div>

          <div className="site-footer">
            <a href="#top" className="brand-lockup brand-lockup--footer">
              <LogoMark className="brand-mark" />
              <div>
                <p className="brand-wordmark">Bandhanaa</p>
                <p className="brand-caption">Where Hearts Unite</p>
              </div>
            </a>

            <div className="site-footer__links">
              {navItems.map((item) => (
                <a href={item.href} key={item.label}>
                  {item.label}
                </a>
              ))}
            </div>

            <div className="site-footer__contact">
              <p>All rights reserved.</p>
              <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
