import React, { useEffect, useState } from 'react';
import { Gamepad2, Menu, X } from 'lucide-react';
import { NAV, navigate, type PageKey } from '../router';
import { DISCORD_URL } from '../config';
import type { SiteConfigData } from '../data/vmData';
import { VoidEmblem } from './BackgroundStage';

interface Props {
  path: string;
  page: PageKey;
  config: SiteConfigData;
}

/**
 * Fixed header. The mobile sheet is rendered in the same element so opening it cannot leave the
 * join action unreachable — an action hidden by a media query looks exactly like a broken site to
 * the person using it.
 */
export const SiteHeader: React.FC<Props> = ({ path, page, config }) => {
  const [stuck, setStuck] = useState(false);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setSheet(false);
  }, [path]);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheet(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet]);

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setSheet(false);
    navigate(href);
  };

  return (
    <header className={`site-header ${stuck || sheet ? 'is-stuck' : ''}`}>
      <div className="wrap header-inner">
        <a href="/" className="brand" onClick={go('/')} aria-label={`${config.brandName} home`}>
          <span className="brand-mark">
            <VoidEmblem wordmark={false} />
          </span>
          <span className="brand-text">
            <span className="brand-name">{config.brandName}</span>
            <span className="brand-sub">{config.tagline}</span>
          </span>
        </a>

        <nav className="nav" aria-label="Main">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={go(item.href)}
              className={`nav-link ${page === item.page ? 'is-on' : ''}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost sm"
            aria-label="Open Discord"
          >
            <Gamepad2 size={15} />
            Discord
          </a>
          <a href="/join" onClick={go('/join')} className="btn btn-primary sm">
            Join the server
          </a>
          <button
            type="button"
            className="burger"
            aria-label={sheet ? 'Close menu' : 'Open menu'}
            aria-expanded={sheet}
            onClick={() => setSheet((v) => !v)}
          >
            {sheet ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      <div className={`nav-sheet ${sheet ? 'is-open' : ''}`}>
        {NAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={go(item.href)}
            className={`nav-link ${page === item.page ? 'is-on' : ''}`}
          >
            {item.label}
          </a>
        ))}
        <a href="/join" onClick={go('/join')} className="btn btn-primary">
          Join the server
        </a>
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
        >
          <Gamepad2 size={15} />
          Discord community
        </a>
      </div>
    </header>
  );
};
