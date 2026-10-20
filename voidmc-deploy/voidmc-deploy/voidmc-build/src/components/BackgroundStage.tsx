import React, { useId } from 'react';

/**
 * The void behind every page: the server emblem sitting in the middle of a slow portal rig, a
 * perspective grid floor, drifting motes and a scanline. It is fixed and pointer-transparent, so
 * scrolling never moves the background layer itself — only the content over it, which is what keeps
 * phones from repainting the whole viewport on each frame.
 *
 * The emblem is inline SVG rather than an image file: a broken <img> would leave a grey box in the
 * middle of the site, and this way the background is identical on a fresh deploy. Gradient ids come
 * from useId because the same emblem renders twice (header mark + stage), and duplicate ids would
 * make the second copy borrow the first one's paint server.
 */

const MOTES = [
  { left: '6%', top: '72%', dur: '17s', delay: '0s' },
  { left: '16%', top: '88%', dur: '22s', delay: '3s' },
  { left: '27%', top: '64%', dur: '19s', delay: '7s' },
  { left: '38%', top: '92%', dur: '25s', delay: '2s' },
  { left: '49%', top: '78%', dur: '16s', delay: '9s' },
  { left: '58%', top: '86%', dur: '23s', delay: '5s' },
  { left: '68%', top: '70%', dur: '18s', delay: '11s' },
  { left: '79%', top: '90%', dur: '26s', delay: '1s' },
  { left: '88%', top: '76%', dur: '20s', delay: '6s' },
  { left: '94%', top: '84%', dur: '24s', delay: '13s' },
];

export const VoidEmblem: React.FC<{ className?: string; wordmark?: boolean }> = ({
  className,
  wordmark = true,
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const main = `main-${uid}`;
  const core = `core-${uid}`;
  const soft = `soft-${uid}`;

  return (
    <svg
      viewBox={wordmark ? '0 0 520 520' : '44 44 432 372'}
      className={className}
      role="img"
      aria-label="VOIDMC emblem"
    >
      <defs>
        <linearGradient id={main} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E9D5FF" />
          <stop offset="0.42" stopColor="#A855F7" />
          <stop offset="0.78" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#2E1065" />
        </linearGradient>
        <radialGradient id={core} cx="0.5" cy="0.42" r="0.62">
          <stop offset="0" stopColor="#1A0B2E" />
          <stop offset="1" stopColor="#05030C" />
        </radialGradient>
        <filter id={soft} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <circle cx="260" cy="260" r="196" fill={`url(#${core})`} />
      <circle cx="260" cy="260" r="196" fill="none" stroke={`url(#${main})`} strokeWidth="2" opacity="0.7" />
      <circle cx="260" cy="260" r="228" fill="none" stroke="#A855F7" strokeWidth="1" strokeDasharray="4 14" opacity="0.5" />

      <g filter={`url(#${soft})`} opacity="0.5">
        <path d="M186 150 L260 372 L334 150" fill="none" stroke="#7C3AED" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="M186 150 L260 372 L334 150" fill="none" stroke={`url(#${main})`} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />

      <g fill="#C4B5FD" opacity="0.85">
        <rect x="150" y="118" width="20" height="20" rx="4" transform="rotate(28 160 128)" />
        <rect x="348" y="126" width="15" height="15" rx="3" transform="rotate(-22 355 133)" opacity="0.7" />
        <rect x="252" y="86" width="11" height="11" rx="2" transform="rotate(18 257 91)" opacity="0.6" />
        <rect x="196" y="404" width="17" height="17" rx="4" transform="rotate(-16 204 412)" opacity="0.55" />
        <rect x="322" y="398" width="12" height="12" rx="3" transform="rotate(34 328 404)" opacity="0.5" />
      </g>

      {wordmark ? (
        <text
          x="260"
          y="452"
          textAnchor="middle"
          fill="#EDE7FA"
          fontFamily="'Sora', sans-serif"
          fontSize="44"
          fontWeight="800"
          letterSpacing="10"
          opacity="0.92"
        >
          VOIDMC
        </text>
      ) : null}
    </svg>
  );
};

export const BackgroundStage: React.FC = () => (
  <div className="stage" aria-hidden="true">
    <div className="stage-rings">
      <span className="ring r3" />
      <span className="ring r2" />
      <span className="ring r1" />
    </div>
    <VoidEmblem className="stage-logo" />
    <div className="stage-grid" />
    {MOTES.map((m, i) => (
      <span
        key={i}
        className="mote"
        style={{ left: m.left, top: m.top, animationDuration: m.dur, animationDelay: m.delay }}
      />
    ))}
    <div className="stage-veil" />
    <div className="stage-scan" />
  </div>
);
