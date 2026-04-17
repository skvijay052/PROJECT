import LogoMark from '../components/logo-mark';
import Reveal from '../components/reveal';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bandhanaa.vercel.app';
const androidDownloadUrl = process.env.NEXT_PUBLIC_ANDROID_APP_URL || '';
const iosDownloadUrl = process.env.NEXT_PUBLIC_IOS_APP_URL || '';
const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'hello@bandhanaa.com';

const trustPills = [
  'Modern matrimony website',
  'Private chat experience',
  'Android APK download',
  'iPhone app ready',
];

const featureCards = [
  {
    eyebrow: 'Genuine Profiles Only',
    title: 'A matrimony app built around real profile depth',
    description:
      'We focus on real people looking for real relationships — no fake accounts.',
  },
  {
    eyebrow: 'Safe & Secure Platform',
    title: 'Search the way matrimony users actually search',
    description:
      'Your privacy matters. Your data and conversations are protected',
  },
  {
    eyebrow: 'Completely Free to Start',
    title: 'Move from shortlist to chat with more confidence',
    description:
      'No subscriptions, no hidden fees — begin your search freely.',
  },
  {
    eyebrow: 'Simple & Easy to Use',
    title: 'One landing page that turns into app installs',
    description:
      'No complicated steps. Create your profile and start connecting instantly.',
  },
];

const journeySteps = [
  {
    number: '01',
    title: 'Smart Match Suggestions',
    description:
      'We help you discover profiles that match your preferences, values, and expectations.',
  },
  {
    number: '02',
    title: 'Send & Receive Interests',
    description:
      'Express your interest and connect only when both sides are comfortable.',
  },
  {
    number: '03',
    title: 'Direct Chat',
    description:
      'Start conversations easily after mutual interest — no unnecessary steps.',
  },
  {
    number: '04',
    title: 'Privacy First',
    description:
      'Control what you share and who can contact you. Your comfort comes first.',
  },
];

const editorialPoints = [
  'Designed for serious relationships, not casual swiping',
  'Useful for individual users as well as family-guided partner search',
  'Combines matrimony website clarity with mobile app convenience',
  'Structured for APK downloads, iPhone availability, and SEO growth',
];

const faqItems = [
  {
    question: 'What is Bandhanaa?',
    answer:
      'Bandhanaa is a modern matrimony website and app designed for serious matchmaking. It brings together profile discovery, partner filters, shortlists, and private chat in one calm experience.',
  },
  {
    question: 'Can users download the Bandhanaa APK from this website?',
    answer:
      'Yes. The landing page includes a dedicated Android APK download CTA so users can install the Bandhanaa app directly from the website when the Android file link is configured.',
  },
  {
    question: 'Is Bandhanaa available for iPhone users too?',
    answer:
      'Yes. The site includes a separate iPhone CTA that can point to TestFlight or the App Store, making it easy to share the iOS version from the same landing page.',
  },
  {
    question: 'Does Bandhanaa support in-app chatting?',
    answer:
      'Bandhanaa positions chat as a private follow-up step after discovery and interest, helping users move from profile browsing into a more direct conversation inside the product.',
  },
  {
    question: 'What makes Bandhanaa different from generic dating apps?',
    answer:
      'Bandhanaa focuses on meaningful matchmaking with richer profile details, matrimony-style filtering, shortlist behavior, and a more intentional path toward serious relationships.',
  },
];

function DownloadButton({ href, label, meta, variant = 'primary' }) {
  const isActive = Boolean(href);
  const resolvedHref = isActive ? href : '#download';

  return (
    <a
      className={`button button--${variant} ${!isActive ? 'button--disabled' : ''}`.trim()}
      href={resolvedHref}
      target={isActive ? '_blank' : undefined}
      rel={isActive ? 'noreferrer' : undefined}
      aria-disabled={!isActive}
    >
      <span>{label}</span>
      <small>{meta}</small>
    </a>
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
      'Bandhanaa is a modern matrimony website and matchmaking app with thoughtful profiles, private chat, and app download links.',
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
      'A matrimony app focused on thoughtful profiles, partner search filters, shortlist tools, and private chat.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    downloadUrl: androidDownloadUrl || undefined,
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="page-shell" id="top">
        <div className="ambient-orb ambient-orb--mint" />
        <div className="ambient-orb ambient-orb--lavender" />
        <div className="ambient-orb ambient-orb--rose" />

        <header className="site-header">
          <a href="#top" className="brand-lockup" aria-label="Bandhanaa home">
            <LogoMark className="brand-mark" />
            <div>
              <p className="brand-wordmark">Bandhanaa</p>
              <p className="brand-caption">Where hearts unite</p>
            </div>
          </a>

          <nav className="site-nav" aria-label="Primary">
            <a href="#features">Features</a>
            <a href="#experience">Why Bandhanaa</a>
            <a href="#download">Download</a>
            <a href="#faq">FAQ</a>
          </nav>

          <a className="button button--ghost header-button" href="#download">
            <span>Download app</span> 
          </a>
        </header>

        <main>
          <section className="hero section">
            <div className="hero-copy">
              <Reveal>
                <p className="eyebrow">Find Your Perfect Life Partner</p>
              </Reveal>

              <Reveal as="h1" className="hero-title" delay={0.08}>
                Bandhanaa helps you connect with real, verified profiles — without pressure, without confusion. Start your journey to a meaningful relationship today.
              </Reveal> 

              <Reveal className="hero-cta" delay={0.24}>
                <DownloadButton
                  href={androidDownloadUrl}
                  label="Download Android APK" 
                  variant="primary"
                />
                <DownloadButton
                  href={iosDownloadUrl}
                  label="Get iPhone App" 
                  variant="secondary"
                />
              </Reveal>

              {/* <Reveal className="trust-strip" delay={0.32}>
                {trustPills.map((pill) => (
                  <span className="trust-pill" key={pill}>
                    {pill}
                  </span>
                ))}
              </Reveal> */}
            </div>

            <Reveal className="hero-visual" delay={0.18}>
              <div className="floating-note floating-note--top">Private chat after discovery</div>
              <div className="floating-note floating-note--bottom">Search by lifestyle and location</div>

              <div className="phone-frame">
                <div className="phone-glow" />
                <div className="phone-screen">
                  <div className="screen-topbar">
                    <div className="signal-dots" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                    <span>Bandhanaa Matrimony</span>
                  </div>

                  <div className="phone-card phone-card--hero">
                    <span className="chip-label">Purposeful matchmaking</span>
                    <h2>Thoughtful profiles over rushed swipes</h2>
                    <p>
                      Match by values, education, profession, location, and relationship goals.
                    </p>
                  </div>

                  <div className="phone-grid">
                    <div className="mini-panel">
                      <span className="mini-title">Shortlist</span>
                      <strong>Save promising profiles</strong>
                    </div>
                    <div className="mini-panel">
                      <span className="mini-title">Chat</span>
                      <strong>Private conversations</strong>
                    </div>
                  </div>

                  <div className="chat-stack">
                    <div className="chat-bubble chat-bubble--left">
                      Looking for someone grounded, warm, and serious about commitment.
                    </div>
                    <div className="chat-bubble chat-bubble--right">
                      Start with profile context, then continue naturally in chat.
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          <section className="section section--tight" id="features">
            <Reveal className="section-heading">
              <p className="eyebrow">Bandhanaa Trusted by early users</p>
              <h2>Why Choose Bandhanaa?</h2> 
            </Reveal>

            <div className="feature-grid">
              {featureCards.map((feature, index) => (
                <Reveal className="feature-card" key={feature.title} delay={0.06 * index}>
                  <p className="feature-eyebrow">{feature.eyebrow}</p>
                  <h3>{feature.description}</h3>  
                </Reveal>
              ))}
            </div>
          </section>

          <section className="section section--split" id="experience">
            <Reveal className="editorial-panel">
              <p className="eyebrow">Why Bandhanaa works</p>
              <h2>More depth than a dating app. More elegance than a typical matrimony website.</h2>
              <p>
                Bandhanaa is positioned for people who want meaningful matchmaking without clutter.
                It combines profile quality, modern UI, and mobile convenience in a way that feels
                personal, premium, and easy to trust.
              </p>
              <p>
                The experience speaks to users searching for a matrimony app, a marriage matching
                platform, a safer chatting website, or a polished place to begin partner search on
                Android and iPhone.
              </p>
            </Reveal>

            <Reveal className="glass-panel checklist-panel" delay={0.12}>
              <p className="eyebrow">What this landing page communicates</p>
              <ul className="editorial-list">
                {editorialPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </Reveal>
          </section>

          <section className="section section--journey">
            <Reveal className="section-heading">
              <p className="eyebrow">FEATURES SECTION</p>
              <h2>Everything You Need to Find the Right Partner</h2> 
            </Reveal>

            <div className="journey-grid">
              {journeySteps.map((step, index) => (
                <Reveal className="journey-card" key={step.number} delay={0.05 * index}>
                  <span className="journey-number">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="section section--seo">
            <Reveal className="section-heading"> 
              <p className="eyebrow">HOW IT WORKS</p>
              <h2>Find Your Match in 3 Simple Steps</h2>
            </Reveal>

            <div className="seo-copy-grid">
              <Reveal className="glass-panel seo-copy-card">
                <h3>Create Your Profile</h3>
                <p>Add your details, preferences, and a photo to build your profile in minutes.
                </p>
              </Reveal>

              <Reveal className="glass-panel seo-copy-card" delay={0.1}>
                <h3>Discover Matches</h3>
                <p>Browse profiles tailored to your preferences and find people who truly match your expectations.
                </p>
              </Reveal>

              <Reveal className="glass-panel seo-copy-card" delay={0.18}>
                <h3>Connect & Chat</h3>
                <p>Send interests, get responses, and start meaningful conversations with confidence.</p>
              </Reveal>
            </div>
          </section>

          <section className="section section--download" id="download">
            <Reveal className="section-heading">
              <p className="eyebrow">Download Bandhanaa</p>
              <h2>Start Your Journey Today</h2>
              <p>Download Bandhanaa now and take the first step toward finding your life partner.</p>
            </Reveal>

            <div className="download-grid">
              <Reveal className="platform-card">
                <p className="feature-eyebrow">Android</p>
                <h3>Bandhanaa APK download</h3> 
                <DownloadButton
                  href={androidDownloadUrl}
                  label="Install Android APK" 
                  variant="primary"
                />
              </Reveal>

              <Reveal className="platform-card" delay={0.1}>
                <p className="feature-eyebrow">iPhone</p>
                <h3>Apple App Store</h3> 
                <DownloadButton
                  href={iosDownloadUrl}
                  label="Open iPhone Link" 
                  variant="secondary"
                />
              </Reveal>
            </div>
          </section>

          <section className="section section--faq" id="faq">
            <Reveal className="section-heading">
              <p className="eyebrow">Frequently asked questions</p>
              <h2>Helpful answers for visitors and extra context for SEO</h2>
            </Reveal>

            <div className="faq-list">
              {faqItems.map((item, index) => (
                <Reveal key={item.question} delay={0.04 * index}>
                  <details className="faq-item">
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </section>
        </main>

        <footer className="site-footer">
          <div>
            <a href="#top" className="brand-lockup brand-lockup--footer">
              <LogoMark className="brand-mark" />
              <div>
                <p className="brand-wordmark">Bandhanaa</p>
                <p className="brand-caption">Modern matrimony, designed with warmth</p>
              </div>
            </a>
          </div>

          <div className="footer-copy">
            <p>
              Built as a clean, animated Next.js landing page for Vercel hosting, APK sharing, and
              strong organic search positioning.
            </p>
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          </div>
        </footer>
      </div>
    </>
  );
}
