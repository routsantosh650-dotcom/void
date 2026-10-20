import React from 'react';
import { AlertTriangle, Gavel, ShieldCheck } from 'lucide-react';
import { DISCORD_URL } from '../config';
import type { LiveContent } from '../lib/content';
import { CtaBand, SectionHead } from '../components/Section';

/**
 * Rules and the people who enforce them on one page — a report is only believable if you can see
 * who would read it.
 */
export const RulesPage: React.FC<{ content: LiveContent }> = ({ content }) => {
  const { rules, staff } = content;
  const hard = rules.filter((r) => r.severity === 'hard');
  const warn = rules.filter((r) => r.severity === 'warn');

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow" data-reveal="up">
            Rules &amp; staff
          </p>
          <h1 className="display" data-split="1">
            Short list, enforced properly
          </h1>
          <p className="lead" data-reveal="up" data-delay="0.12">
            {hard.length} things that get you banned, {warn.length} things that get you a warning
            first. Every punishment is logged with the evidence that caused it, and appeals are read
            by a different staff member than the one who acted.
          </p>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <SectionHead kicker="The rules" title="Read this before your first claim" />
          <div className="panel" data-reveal="up">
            {rules.map((r, i) => (
              <div className={`rule-item ${r.severity === 'warn' ? 'is-warn' : ''}`} key={r.id}>
                <span className="rule-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="rule-body">
                  <h3>{r.title}</h3>
                  <p>{r.text}</p>
                </div>
                <span className="tag" style={{ alignSelf: 'flex-start', flex: 'none' }}>
                  {r.severity === 'warn' ? (
                    <AlertTriangle size={11} />
                  ) : (
                    <ShieldCheck size={11} />
                  )}
                  {r.severity === 'warn' ? 'warning' : 'ban'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead
            kicker="The team"
            title="Who you are talking to"
            lead="These are the people who can read a report, run a rollback and lift a mute. Anyone else in Discord is a player like you."
          />
          <div className="grid grid-4">
            {staff.map((s, i) => (
              <article key={s.id} className="card lift staff-card" data-reveal="scale" data-delay={String((i % 4) * 0.07)}>
                <span className="avatar">{s.name.slice(0, 2).toUpperCase()}</span>
                <div>
                  <h3 className="h3" style={{ fontSize: 17 }}>
                    {s.name}
                  </h3>
                  <p className="staff-role">{s.role}</p>
                  <p className="tagline" style={{ marginTop: 2 }}>
                    since {s.since}
                  </p>
                </div>
                <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
                  {s.bio}
                </p>
                <div className="mode-foot" style={{ justifyContent: 'center' }}>
                  {s.perms.map((p) => (
                    <span className="tag" key={p}>
                      {p}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <div className="split flip">
            <div className="card" data-reveal="left">
              <div className="card-head">
                <p className="eyebrow" style={{ margin: 0 }}>
                  Reporting
                </p>
                <Gavel size={16} style={{ color: 'var(--violet-soft)' }} />
              </div>
              <div className="stack" style={{ gap: 14, marginTop: 14 }}>
                {[
                  ['Post proof, not feelings', 'A clip, a replay or a screenshot with coordinates. Reports without evidence are closed with a note.'],
                  ['Use the reports channel', 'One channel, staff-only replies. Public accusations in general chat get removed — that is how witch hunts start.'],
                  ['Give it 24 hours', 'Staff are volunteers with jobs and exams. Anything time-critical gets an @ on the post, not a DM.'],
                ].map(([t, b], i) => (
                  <div className="step" key={t}>
                    <span className="step-num">{i + 1}</span>
                    <div>
                      <h3 style={{ fontSize: 16, marginBottom: 3 }}>{t}</h3>
                      <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
                        {b}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SectionHead kicker="Appeals" title="Think a punishment was wrong?" />
              <p className="lead">
                Appeal once, in the ticket channel, with what happened from your side. The decision
                is reviewed by somebody who was not involved. A second appeal with no new evidence
                closes the case — and a toxic appeal closes it faster.
              </p>
              <p className="tagline" style={{ marginTop: 14 }}>
                Punishment lengths here are fixed: 7 days first cheat, 30 days second, permanent
                third. Griefing a claimed base is 30 days straight away because rollback time is
                staff time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <CtaBand
            title="Agreed? Then come in."
            body="That is the whole contract. Follow it and nobody bothers you; break it and you will get a clear reason with the evidence attached."
            primary={{ label: 'Rules channel on Discord', href: DISCORD_URL, external: true }}
            secondary={{ label: 'How to join', href: '/join' }}
          />
        </div>
      </section>
    </>
  );
};
