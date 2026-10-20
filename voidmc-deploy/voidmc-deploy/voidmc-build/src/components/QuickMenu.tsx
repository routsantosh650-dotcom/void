import React, { useEffect, useState } from 'react';
import { ArrowUp, Copy, Gamepad2, ListChecks, Swords } from 'lucide-react';
import { DISCORD_URL } from '../config';
import { navigate } from '../router';
import { showToast } from '../lib/toast';
import type { SiteConfigData } from '../data/vmData';

interface Spot {
  x: number;
  y: number;
}

/**
 * Right-click quick menu — the shortcut that made the Areex build feel fast. It is deliberately
 * pointer-only: on a phone long-press is how you select text, so hijacking it would hurt, and the
 * menu never overrides the browser context on an image or a field you are typing in.
 */
export const QuickMenu: React.FC<{ config: SiteConfigData }> = ({ config }) => {
  const [spot, setSpot] = useState<Spot | null>(null);

  useEffect(() => {
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if (coarse) return;

    const onMenu = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('input, textarea, select, [contenteditable="true"], img')) return;
      e.preventDefault();
      const width = 214;
      const height = 216;
      setSpot({
        x: Math.min(e.clientX, window.innerWidth - width - 10),
        y: Math.min(e.clientY, window.innerHeight - height - 10),
      });
    };

    const close = () => setSpot(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('contextmenu', onMenu);
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('blur', close);

    return () => {
      document.removeEventListener('contextmenu', onMenu);
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close);
      window.removeEventListener('blur', close);
    };
  }, []);

  if (!spot) return null;

  const item = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setSpot(null);
    fn();
  };

  const copyIp = () => {
    if (!config.serverIp) {
      showToast('No address set yet — grab it from Discord.', 'info');
      return;
    }
    navigator.clipboard
      ?.writeText(config.serverIp)
      .then(() => showToast('Server address copied.', 'good'))
      .catch(() => showToast('Copy blocked — select it on the Join page.', 'bad'));
  };

  return (
    <div className="quick-menu" style={{ left: spot.x, top: spot.y }} role="menu" aria-label="Quick menu">
      <button type="button" role="menuitem" onClick={item(() => navigate('/join'))}>
        <Swords size={15} /> Join the server
      </button>
      <button type="button" role="menuitem" onClick={item(copyIp)}>
        <Copy size={15} /> Copy address
      </button>
      <button type="button" role="menuitem" onClick={item(() => navigate('/modes'))}>
        <ListChecks size={15} /> Game modes
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={item(() => window.open(DISCORD_URL, '_blank', 'noopener'))}
      >
        <Gamepad2 size={15} /> Discord
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={item(() => window.scrollTo({ top: 0, behavior: 'smooth' }))}
      >
        <ArrowUp size={15} /> Back to top
      </button>
    </div>
  );
};
