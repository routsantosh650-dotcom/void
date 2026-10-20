import React from 'react';
import { ArrowUpRight, Repeat } from 'lucide-react';
import { navigate } from '../router';
import { DISCORD_URL } from '../config';
import type { LiveContent } from '../lib/content';
import { CtaBand } from '../components/Section';
import { JoinCard } from '../components/JoinCard';

const SWITCH_STEPS: Array<[string, string]> = [
  [
    'Type /hub',
    'From any mode, /hub takes you back to the lobby world in under a second. Nothing you are carrying is dropped and no claim is touched.',
  ],
  [
    'Pick a portal',
    'Each world has its own portal in the lobby with the player count on it, so you know before you jump whether anyone is home.',
  ],
  [
    'Keep your rank',
    'Ranks, homes count, balance rewards and prefixes carry across every mode. One account, one login, no separate registrations.',
  ],
];

const navTo = (href: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  navigate(href);
};

export const ModesPage: React.FC<{ content: LiveContent }> = ({ content }) => {
  const { config, modes } = content;

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow" data-reveal="up">
            Game modes
          </p>
          <h1 className="display" data-split="1">
            Pick your chaos
          </h1>
          <p className="lead" data-reveal="up" data-delay="0.12">
            {modes.length} fully separate worlds on one server — survival, islands, hardcore PvP,
            creative plots and arcade games. Switch with a single command.
          </p>
          <div className="hero-cta" data-reveal="up" data-delay="0.2">
            <a href="/join" onClick={navTo('/join')} className="btn btn-primary lg">
              Get on the server
              <ArrowUpRight size={16} />
            </a>
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="btn btn-ghost lg">
              Ask which one to start on
            </a>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <div className="split">
            <div className="grid grid-2">
              {modes.map((m, i) => (
                <article
                  key={m.id}
                  className="card lift"
                  data-reveal="up"
                  data-delay={String((i % 2) * 0.1)}
                  style={{ '--accent': m.accent } as React.CSSProperties}
                >
                  <div className="accent-bar" />
                  <div className="card-glow" />
                  <div className="mode-body">
                    <div className="card-head">
                      <span className="tag" style={{ color: m.accent, borderColor: `${m.accent}55` }}>
                        {m.players}
                      </span>
                      <span className="mode-index">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <h3 className="h3">{m.title}</h3>
                    <p className="muted" style={{ fontSize: 14, margin: 0 }}>
                      {m.tagline}
                    </p>
                    <p style={{ fontSize: 14.5, color: 'var(--ink-2)', margin: 0 }}>{m.summary}</p>
                    <div className="mode-foot">
                      {m.tags.map((t) => (
                        <span className="tag" key={t}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="stack" style={{ gap: 20, position: 'sticky', top: 'calc(var(--header-h) + 20px)' }}>
              <JoinCard config={config} compact />
              <div className="card" data-reveal="scale">
                <p className="eyebrow" style={{ marginBottom: 8 }}>
                  Rules of switching
                </p>
                <div className="stack" style={{ gap: 14 }}>
                  {SWITCH_STEPS.map(([title, body], i) => (
                    <div className="step" key={title}>
                      <span className="step-num">{i + 1}</span>
                      <div>
                        <h3 style={{ fontSize: 16, marginBottom: 3 }}>{title}</h3>
                        <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
                          {body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="tagline" style={{ marginTop: 14 }}>
                  <Repeat size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> Inventory
                  is per world on Lifesteal and Minigames — chest it before you hop.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <CtaBand
            title="Want a mode that is not here?"
            body="The plugin list is not closed. People propose modes in Discord, the team builds the best-voted idea into the next season."
            primary={{ label: 'Suggest a mode', href: DISCORD_URL, external: true }}
            secondary={{ label: 'See the events', href: '/events' }}
          />
        </div>
      </section>
    </>
  );
};
