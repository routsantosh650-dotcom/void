import React from 'react';
import { ArrowUpRight, Crown, ShieldCheck, Sparkles, Swords, Users } from 'lucide-react';
import { DISCORD_URL } from '../config';
import { navigate } from '../router';
import { BUILD_CATEGORIES, type ModeDoc } from '../data/vmData';
import type { LiveContent } from '../lib/content';
import { JoinCard } from '../components/JoinCard';
import { EventBoard } from '../components/EventBoard';
import { FaqList } from '../components/FaqList';
import { CtaBand, SectionHead } from '../components/Section';

const MODE_ICONS: Record<string, React.ReactNode> = {
  voidsmp: <Swords size={18} />,
  skyblock: <Sparkles size={18} />,
  lifesteal: <ShieldCheck size={18} />,
  plots: <Users size={18} />,
  minigames: <Crown size={18} />,
};

const iconFor = (mode: ModeDoc, i: number) => MODE_ICONS[mode.id] ?? Object.values(MODE_ICONS)[i % 5];

const go = (href: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  navigate(href);
};

export const HomePage: React.FC<{ content: LiveContent }> = ({ content }) => {
  const { config, modes, events, builds, staff, faq } = content;
  const featuredBuilds = builds.filter((b) => b.featured).slice(0, 3);
  const showcase = (featuredBuilds.length ? featuredBuilds : builds).slice(0, 3);
  const marqueeItems = [config.announcement, config.statusNote, `Java ${config.javaVersion}`, 'Whitelist-free', 'No pay-to-win'];

  return (
    <>
      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <p className="eyebrow" data-reveal="up">
              {config.tagline}
            </p>
            <h1 className="display" data-split="1">
              Step into the {config.brandName}
            </h1>
            <p className="lead" data-reveal="up" data-delay="0.15">
              {config.heroLine}
            </p>
            <div className="hero-cta" data-reveal="up" data-delay="0.25">
              <a href="/join" onClick={go('/join')} className="btn btn-primary lg">
                How to join
                <ArrowUpRight size={17} />
              </a>
              <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="btn btn-ghost lg">
                <Users size={17} />
                {config.playerCap ? `${config.playerCap} player community` : 'Join our Discord'}
              </a>
            </div>

            <div className="hero-stats" data-reveal="up" data-delay="0.35">
              <div>
                <div className="stat-num" data-count={String(modes.length)} data-suffix="">
                  0
                </div>
                <div className="stat-label">Game modes</div>
              </div>
              <div>
                <div className="stat-num" data-count="120" data-suffix="+">
                  0
                </div>
                <div className="stat-label">Builders</div>
              </div>
              <div>
                <div className="stat-num" data-count="4" data-suffix="/yr">
                  0
                </div>
                <div className="stat-label">Seasons run</div>
              </div>
            </div>
          </div>

          <div data-reveal="right">
            <JoinCard config={config} />
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <React.Fragment key={copy}>
              {marqueeItems.map((text, i) => (
                <span key={i}>{text || 'VOIDMC'}</span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <section className="section">
        <div className="wrap">
          <SectionHead
            kicker="What you can play"
            title="Five worlds, one login"
            lead="Switch modes from the lobby without touching a launcher or a separate account. Everything shares the same rank, the same friends list and the same staff team."
            right={
              <a href="/modes" onClick={go('/modes')} className="btn btn-ghost sm">
                All modes
                <ArrowUpRight size={14} />
              </a>
            }
          />

          <div className="grid grid-3">
            {modes.slice(0, 6).map((m, i) => (
              <article
                key={m.id}
                className="card lift"
                data-reveal="up"
                data-delay={String((i % 3) * 0.08)}
                style={{ '--accent': m.accent } as React.CSSProperties}
              >
                <div className="accent-bar" />
                <div className="card-glow" />
                <div className="mode-body">
                  <div className="card-head">
                    <span className="tag" style={{ color: m.accent, borderColor: `${m.accent}55` }}>
                      {iconFor(m, i)}
                      {m.players}
                    </span>
                    <span className="mode-index">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="h3">{m.title}</h3>
                  <p className="muted" style={{ fontSize: 14 }}>
                    {m.tagline}
                  </p>
                  <p style={{ fontSize: 14.5, color: 'var(--ink-2)' }}>{m.summary}</p>
                  <div className="mode-foot">
                    {m.tags.slice(0, 4).map((t) => (
                      <span className="tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <div className="grid grid-2" style={{ alignItems: 'start' }}>
            <div data-reveal="left">
              <EventBoard events={events} />
            </div>
            <div data-reveal="right">
              <SectionHead
                kicker="Why people stay"
                title="Run by players, not by a shop"
                lead="Every decision here is made by people who play on the server. Rollbacks actually work, reports actually get read, and nothing that costs money changes how the game plays."
              />
              <div className="stack" style={{ gap: 14 }}>
                {[
                  ['CoreProtect rollbacks', 'A griefed base goes back to any point in the last few weeks — report it with a clip and staff handle the rest.'],
                  ['Real staff hours', 'Four staff members online across the day, with a Discord ticket channel that is not a dead end.'],
                  ['Custom events weekly', 'Build battles, boss nights and a Saturday minigame cup, all run on maps the team builds itself.'],
                  ['Nothing pay-to-win', 'Ranks are prefixes, colours and extra homes. That is the whole shop.'],
                ].map(([title, body], i) => (
                  <div className="step" key={title} data-reveal="up" data-delay={String(i * 0.06)}>
                    <span className="step-num">{i + 1}</span>
                    <div>
                      <h3 className="h3" style={{ fontSize: 17, marginBottom: 4 }}>
                        {title}
                      </h3>
                      <p className="muted" style={{ fontSize: 14, margin: 0 }}>
                        {body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead
            kicker="Built in the world"
            title="The map speaks for itself"
            lead="Spawn, the nether hub and the industrial district were all put up by players on this server. No screenshots from somewhere else."
            right={
              <a href="/builds" onClick={go('/builds')} className="btn btn-ghost sm">
                Build gallery
                <ArrowUpRight size={14} />
              </a>
            }
          />
          <div className="grid grid-3">
            {showcase.map((b, i) => (
              <article key={b.id} className="card lift" data-reveal="up" data-delay={String((i % 3) * 0.08)}>
                <div className="build-card">
                  <div className="build-cover">
                    <span className="cover-glyph">{b.title.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="build-meta">
                    <span>{BUILD_CATEGORIES.find((c) => c.id === b.category)?.label ?? b.category}</span>
                    <span>{b.year}</span>
                  </div>
                  <h3 className="h3">{b.title}</h3>
                  <p className="muted" style={{ fontSize: 14 }}>
                    {b.summary}
                  </p>
                  <p className="tagline">by {b.author}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <SectionHead kicker="The team" title="Who keeps it running" />
          <div className="grid grid-4">
            {staff.slice(0, 4).map((s, i) => (
              <article key={s.id} className="card lift staff-card" data-reveal="scale" data-delay={String(i * 0.07)}>
                <span className="avatar">{s.name.slice(0, 2).toUpperCase()}</span>
                <div>
                  <h3 className="h3" style={{ fontSize: 17 }}>
                    {s.name}
                  </h3>
                  <p className="staff-role">{s.role}</p>
                </div>
                <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
                  {s.bio}
                </p>
                <div className="mode-foot" style={{ justifyContent: 'center' }}>
                  {s.perms.slice(0, 3).map((p) => (
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

      <section className="section">
        <div className="wrap">
          <div className="grid grid-2" style={{ alignItems: 'start', gap: 40 }}>
            <div>
              <SectionHead kicker="Questions" title="Before you join" />
              <p className="lead">
                Still stuck? The Discord has a support channel that humans answer — usually the same
                hour.
              </p>
              <a href="/join" onClick={go('/join')} className="btn btn-ghost" style={{ marginTop: 8 }}>
                Full joining guide
                <ArrowUpRight size={14} />
              </a>
            </div>
            <FaqList items={faq.slice(0, 5)} idPrefix="home-faq" />
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <CtaBand
            title="The void is open right now"
            body="No application, no whitelist, no cost. Add the address, drop in, and say hello in Discord — someone will show you a plot."
            primary={{ label: 'Join on Discord', href: DISCORD_URL, external: true }}
            secondary={{ label: 'Read the rules', href: '/rules' }}
          />
        </div>
      </section>
    </>
  );
};
