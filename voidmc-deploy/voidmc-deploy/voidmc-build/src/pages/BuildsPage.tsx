import React, { useMemo, useState } from 'react';
import { Images } from 'lucide-react';
import { DISCORD_URL } from '../config';
import { BUILD_CATEGORIES } from '../data/vmData';
import type { LiveContent } from '../lib/content';
import { CtaBand, SectionHead } from '../components/Section';

export const BuildsPage: React.FC<{ content: LiveContent }> = ({ content }) => {
  const { builds } = content;
  const [cat, setCat] = useState<string>('all');

  const shown = useMemo(
    () => (cat === 'all' ? builds : builds.filter((b) => b.category === cat)),
    [builds, cat]
  );

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow" data-reveal="up">
            Build gallery
          </p>
          <h1 className="display" data-split="1">
            What the community put here
          </h1>
          <p className="lead" data-reveal="up" data-delay="0.12">
            Spawn, the nether hub, a player-built city and half a hundred public farms. Every one of
            these was placed by someone who plays on the server — and every one is still standing in
            the world you can walk through.
          </p>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <div className="row" style={{ marginBottom: 26 }} data-reveal="up">
            <button type="button" className={`chip ${cat === 'all' ? 'is-on' : ''}`} onClick={() => setCat('all')}>
              All ({builds.length})
            </button>
            {BUILD_CATEGORIES.map((c) => {
              const n = builds.filter((b) => b.category === c.id).length;
              if (!n) return null;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`chip ${cat === c.id ? 'is-on' : ''}`}
                  onClick={() => setCat(c.id)}
                >
                  {c.label} ({n})
                </button>
              );
            })}
            <span className="line-sep" />
            <span className="tagline mono">
              <Images size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> in-world, not
              renders
            </span>
          </div>

          {shown.length ? (
            <div className="grid grid-3">
              {shown.map((b, i) => (
                <article
                  key={b.id}
                  className="card lift"
                  data-reveal="up"
                  data-delay={String((i % 3) * 0.08)}
                  style={{ '--accent': b.featured ? '#A855F7' : '#7C3AED' } as React.CSSProperties}
                >
                  <div className="accent-bar" />
                  <div className="build-card">
                    <div className="build-cover">
                      <span className="cover-glyph">{b.title.slice(0, 2).toUpperCase()}</span>
                      {b.featured ? (
                        <span className="tag" style={{ position: 'absolute', top: 10, right: 10 }}>
                          featured
                        </span>
                      ) : null}
                    </div>
                    <div className="build-meta">
                      <span>{BUILD_CATEGORIES.find((c) => c.id === b.category)?.label ?? b.category}</span>
                      <span>{b.year}</span>
                    </div>
                    <h3 className="h3">{b.title}</h3>
                    <p className="muted" style={{ fontSize: 14 }}>
                      {b.summary}
                    </p>
                    <div className="mode-foot">
                      {b.tags.map((t) => (
                        <span className="tag" key={t}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="tagline">built by {b.author}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="panel">
              <SectionHead
                kicker="Nothing here yet"
                title="This category is empty"
                lead="The build team has not archived anything in this group. Pick another filter or send us a clip of yours."
              />
            </div>
          )}
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <CtaBand
            title="Want your build on this page?"
            body="Post a clip or a map screenshot in the builds channel. The best of each season get archived here with your name on them."
            primary={{ label: 'Share your build', href: DISCORD_URL, external: true }}
            secondary={{ label: 'Join the server', href: '/join' }}
          />
        </div>
      </section>
    </>
  );
};
