import React from 'react';
import { Copy, Gamepad2, Youtube } from 'lucide-react';
import { DISCORD_URL, YOUTUBE_URL } from '../config';
import { showToast } from '../lib/toast';
import type { SiteConfigData } from '../data/vmData';

/**
 * The one card everyone actually comes for. navigator.clipboard only exists on a secure origin, so
 * the execCommand path is kept — on a plain http preview or an old Android browser the copy would
 * otherwise silently do nothing, which reads as a broken button.
 */
async function copyText(value: string) {
  if (!value) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* falls through to the legacy path below */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

const Row: React.FC<{
  label: string;
  value: string;
  empty: string;
  onCopy: (value: string, label: string) => void;
}> = ({ label, value, empty, onCopy }) => (
  <div className="join-row">
    <span className="stack" style={{ gap: 2, minWidth: 0 }}>
      <span className="label">{label}</span>
      {value ? (
        <span className="join-value">{value}</span>
      ) : (
        <span className="ip-empty">{empty}</span>
      )}
    </span>
    {value ? (
      <button type="button" className="copy-btn" onClick={() => onCopy(value, label)}>
        <Copy size={13} />
        Copy
      </button>
    ) : null}
  </div>
);

export const JoinCard: React.FC<{ config: SiteConfigData; compact?: boolean }> = ({
  config,
  compact = false,
}) => {
  const handle = async (value: string, label: string) => {
    const ok = await copyText(value);
    if (ok) {
      showToast(`${label} copied — paste it into Minecraft.`, 'good');
    } else {
      showToast('Your browser blocked the copy. Select the text and copy it manually.', 'bad');
    }
  };

  return (
    <div className="card join-card">
      {!compact && (
        <div className="card-head">
          <div>
            <p className="eyebrow" style={{ marginBottom: 6 }}>
              Connect
            </p>
            <h3 className="h3">Join the void</h3>
          </div>
          <span className="pill">
            <span className="dot-live" />
            {config.playerCap ? `${config.playerCap} slots` : 'Open'}
          </span>
        </div>
      )}

      <Row
        label="Java address"
        value={config.serverIp}
        empty={config.serverIp ? '' : 'Set in the console — meanwhile grab it from Discord'}
        onCopy={handle}
      />
      <Row
        label="Bedrock port"
        value={config.bedrockPort}
        empty={config.bedrockPort ? '' : 'Bedrock runs on the same address'}
        onCopy={handle}
      />

      <div className="join-row">
        <span className="stack" style={{ gap: 2 }}>
          <span className="label">Java version</span>
          <span className="join-value">{config.javaVersion}</span>
        </span>
        <span className="tag">no mods needed</span>
      </div>

      <div className="row" style={{ marginTop: 4 }}>
        <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="btn btn-primary">
          <Gamepad2 size={16} />
          Join on Discord
        </a>
        <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" className="btn btn-ghost">
          <Youtube size={16} />
          Watch builds
        </a>
      </div>

      <p className="tagline">
        Multiplayer → Add server → paste the address. Whitelist-free, and nothing you can buy changes
        how the game plays.
      </p>
    </div>
  );
};
