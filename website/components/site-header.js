'use client';

import { useEffect, useState } from 'react';

import LogoMark from './logo-mark';

export default function SiteHeader({ navItems }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (!isMenuOpen) {
      document.body.style.overflow = previousOverflow;
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <header className="site-header">
        <a href="#top" className="brand-lockup" aria-label="Bandhanaa home" onClick={closeMenu}>
          <LogoMark className="brand-mark" />
          <div>
            <p className="brand-wordmark">Bandhanaa</p>
            <p className="brand-caption">Where hearts unite</p>
          </div>
        </a>

        <nav className="site-nav" aria-label="Primary">
          {navItems.map((item) => (
            <a href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <a className="button button--ghost" href="#download">
            Get Started
          </a>
        </div>

        <button
          type="button"
          className={`mobile-menu-toggle ${isMenuOpen ? 'is-open' : ''}`.trim()}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setIsMenuOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <div
        className={`mobile-backdrop ${isMenuOpen ? 'is-open' : ''}`.trim()}
        aria-hidden="true"
        onClick={closeMenu}
      />

      <aside
        className={`mobile-drawer ${isMenuOpen ? 'is-open' : ''}`.trim()}
        aria-hidden={!isMenuOpen}
      >
        <div className="mobile-drawer__panel">
          <div className="mobile-drawer__top">
            <a href="#top" className="brand-lockup" aria-label="Bandhanaa home" onClick={closeMenu}>
              <LogoMark className="brand-mark" />
              <div>
                <p className="brand-wordmark">Bandhanaa</p>
                <p className="brand-caption">Where hearts unite</p>
              </div>
            </a>

            <button
              type="button"
              className="mobile-drawer__close"
              aria-label="Close navigation menu"
              onClick={closeMenu}
            >
              <span />
              <span />
            </button>
          </div>

          <nav className="mobile-drawer__nav" id="mobile-navigation" aria-label="Mobile">
            {navItems.map((item) => (
              <a href={item.href} key={item.label} onClick={closeMenu}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mobile-drawer__footer">
            <a className="button button--sun mobile-drawer__cta" href="#download" onClick={closeMenu}>
              Get Started
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
