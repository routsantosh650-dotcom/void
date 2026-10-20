import React from 'react';
import { MessagesSquare, Youtube } from 'lucide-react';
import { NAV, navigate } from '../router';
import { DISCORD_URL, STUDIO_URL, YOUTUBE_URL } from '../config';
import { BUILD_TAG } from '../version';
import type { SiteConfigData } from '../data/vmData';
import { LiveClock } from './LiveClock';

/**
 * Footer doubles as the always-available server status line: version, cap and the note from the
 * console. The build tag lives here (and on the 404) because the site is built remotely, so it is
 * the only way to tell from a screenshot whether a fix actually deployed.
 */
export const SiteFooter: React.FC<{ config: SiteConfigData }> = ({ config }) => {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-col">
            <p className="foot-title">{config.brandName}</p>
            <p className="lead" style={{ fontSize: 14, marginTop: 0 }}>
              {config.statusNote}
            </p>
            <div className="row" style={{ marginTop: 14 }}>
              <span className="pill">
                <span className="dot-live" />
                Online
              </span>
              <LiveClock />
            </div>
          </div>

          <div className="foot-col">
            <p className="foot-title">Explore</p>
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.href);
                }}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="foot-col">
            <p className="foot-title">Community</p>
            <a href={DISCORD_URL} target="_blank" rel="noreferrer">
              Discord
            </a>
            <a href={YOUTUBE_URL} target="_blank" rel="noreferrer">
              YouTube
            </a>
            <a href="/rules" onClick={(e) => { e.preventDefault(); navigate('/rules'); }}>
              Rules & staff
            </a>
            <a href="/join" onClick={(e) => { e.preventDefault(); navigate('/join'); }}>
              How to join
            </a>
          </div>

          <div className="foot-col">
            <p className="foot-title">Server</p>
            <p className="tagline mono" style={{ fontSize: 13 }}>
              Java {config.javaVersion}
              {config.bedrockPort ? ` · Bedrock ${config.bedrockPort}` : ''}
            </p>
            <p className="tagline mono" style={{ fontSize: 13 }}>
              {config.playerCap ? `${config.playerCap} player cap` : 'No player cap'}
            </p>
            {config.serverIp ? (
              <p className="tagline mono" style={{ fontSize: 13 }}>
                {config.serverIp}
              </p>
            ) : (
              <p className="tagline" style={{ fontSize: 13 }}>
                Address is posted in Discord
              </p>
            )}
            <div className="row" style={{ marginTop: 12 }}>
              <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="btn btn-ghost sm">
                <MessagesSquare size={14} />
                Get support
              </a>
              <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" className="btn btn-ghost sm">
                <Youtube size={14} />
                Watch
              </a>
            </div>
          </div>
        </div>

        <div className="foot-bottom">
          <span>
            © {year} {config.brandName}. Not affiliated with Mojang or Microsoft.
          </span>
          <span className="row" style={{ gap: 14 }}>
            <a
              href={STUDIO_URL}
              target="_blank"
              rel="noreferrer"
              className="foot-link"
              style={{ fontSize: 12.5 }}
            >
              Site by VoidVisuals
            </a>
            <span className="mono" title="Live build" style={{ fontSize: 12 }}>
              {BUILD_TAG}
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
};
