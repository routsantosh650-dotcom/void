import React from 'react';
import { ArrowUpRight, Trophy } from 'lucide-react';
import { navigate } from '../router';
import { DISCORD_URL } from '../config';
import type { LiveContent } from '../lib/content';
import { CtaBand, SectionHead } from '../components/Section';
import { EventBoard } from '../components/EventBoard';

const navTo = (href: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  navigate(href);
};

const ENTER_STEPS: Array<[string, string]> = [
  [
    'Show up',
    'Events start in the lobby world at the announced time. Late entry stays open until the first round locks.',
  ],
  [
    'Kit is given, not kept',
    'Competitive modes swap your inventory for the event kit so gear does not decide the winner. Your stuff comes back after.',
  ],
  [
    'Judging is public',
    'Build battles are voted in-game by everyone watching and the result is posted in Discord the same night.',
  ],
];

export const EventsPage: React.FC<{ content: LiveContent }> = ({ content }) => {
  const { events, builds } = content;

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow" data-reveal="up">
            Events
          </p>
          <h1 className="display" data-split="1">
            Something happens every week
          </h1>
          <p className="lead" data-reveal="up" data-delay="0.12">
            Build battles, boss nights, drop parties and a Saturday minigame cup — all run by staff
            inside the server. No entry fee, no external site, no sign-up form.
          </p>
          <div className="hero-cta" data-reveal="up" data-delay="0.2">
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="btn btn-primary lg">
              Announcement channel
              <ArrowUpRight size={16} />
            </a>
            <a href="/builds" onClick={navTo('/builds')} className="btn btn-ghost lg">
              See what winners built
            </a>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <div className="split">
            <div data-reveal="left">
              <EventBoard events={events} />
            </div>

            <div className="stack" style={{ gap: 20 }}>
              <SectionHead kicker="Entering" title="How an event works" />
              <div className="card" data-reveal="right">
                <div className="stack" style={{ gap: 14 }}>
                  {ENTER_STEPS.map(([title, body], i) => (
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
              </div>
              <div className="card" data-reveal="scale">
                <div className="card-head">
                  <p className="eyebrow" style={{ margin: 0 }}>
                    Hall of fame
                  </p>
                  <Trophy size={16} style={{ color: 'var(--amber)' }} />
                </div>
                <p className="muted" style={{ fontSize: 14 }}>
                  {builds.filter((b) => b.featured).length || builds.length} of the builds on this
                  server started as an event entry and were kept in the world because people liked
                  them.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <CtaBand
            title="Run your own event"
            body="Community hosts get the arena world on weekday nights, staff help with the plugin side, and the prize comes out of the server budget."
            primary={{ label: 'Ask in Discord', href: DISCORD_URL, external: true }}
            secondary={{ label: 'Read the rules', href: '/rules' }}
          />
        </div>
      </section>
    </>
  );
};
