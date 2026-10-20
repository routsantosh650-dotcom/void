import React from 'react';
import { Boxes, MonitorPlay, Smartphone } from 'lucide-react';
import { DISCORD_URL } from '../config';
import type { LiveContent } from '../lib/content';
import { CtaBand, SectionHead } from '../components/Section';
import { JoinCard } from '../components/JoinCard';
import { FaqList } from '../components/FaqList';

const JAVA_STEPS: Array<[string, string]> = [
  ['Open Multiplayer', 'Launch Minecraft Java, pick Multiplayer from the main menu — not Realms.'],
  ['Add server', 'Click Add server, name it anything you like, and paste the address from the card on this page.'],
  ['Check the version', `The server runs on the version shown below. Older clients cannot join; newer ones usually can after a snapshot.`],
  ['Play', 'Double-click the entry. If the world is full, post /join in Discord and someone will open a slot.'],
];

const BEDROCK_STEPS: Array<[string, string]> = [
  ['Servers → Add server', 'On mobile, Windows or console Bedrock, open the Play tab and scroll to Add server.'],
  ['Same address', 'Use the same address with the Bedrock port from the card. Leave the default port if none is listed.'],
  ['Same account, same world', 'You join the same worlds as Java players and keep your inventory between them.'],
];

const TROUBLE: Array<[string, string]> = [
  [
    '“Could not connect to server”',
    'Almost always a version mismatch or a typo in the address. Re-copy it instead of typing it.',
  ],
  [
    'Server not found after adding it',
    'Give it 20 seconds, then check you did not add “http://” or a space at the end of the address.',
  ],
  [
    'Bedrock will not connect',
    'Console Bedrock on some networks needs the port typed as address:port. Mobile usually works with the separate port field.',
  ],
  [
    'Kicked with a whitelist message',
    'There is no whitelist on this server — that message means the address changed. Get the current one from Discord.',
  ],
];

export const JoinPage: React.FC<{ content: LiveContent }> = ({ content }) => {
  const { config, faq } = content;

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow" data-reveal="up">
            Join
          </p>
          <h1 className="display" data-split="1">
            Three minutes, no application
          </h1>
          <p className="lead" data-reveal="up" data-delay="0.12">
            Free, whitelist-free, Java and Bedrock on the same worlds. Add the address, jump in, and
            say hello in Discord so someone shows you where the good plots are.
          </p>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <div className="split">
            <div className="stack" style={{ gap: 22 }}>
              <div className="card" data-reveal="up">
                <div className="card-head">
                  <p className="eyebrow" style={{ margin: 0 }}>
                    <MonitorPlay size={12} style={{ display: 'inline', verticalAlign: '-1px' }} />{' '}
                    Java Edition
                  </p>
                  <span className="tag">{config.javaVersion}</span>
                </div>
                <div className="stack" style={{ gap: 14 }}>
                  {JAVA_STEPS.map(([t, b], i) => (
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

              <div className="card" data-reveal="up" data-delay="0.1">
                <div className="card-head">
                  <p className="eyebrow" style={{ margin: 0 }}>
                    <Smartphone size={12} style={{ display: 'inline', verticalAlign: '-1px' }} />{' '}
                    Bedrock Edition
                  </p>
                  <span className="tag">{config.bedrockPort ? `port ${config.bedrockPort}` : 'same address'}</span>
                </div>
                <div className="stack" style={{ gap: 14 }}>
                  {BEDROCK_STEPS.map(([t, b], i) => (
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
            </div>

            <div className="stack" style={{ gap: 20, position: 'sticky', top: 'calc(var(--header-h) + 20px)' }}>
              <JoinCard config={config} />
              <div className="card" data-reveal="scale">
                <div className="card-head">
                  <p className="eyebrow" style={{ margin: 0 }}>
                    <Boxes size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> What you
                    get
                  </p>
                </div>
                <p className="muted" style={{ fontSize: 14 }}>
                  3 starter homes, /rtp to unclaimed land, a shop plot, access to every mode and the
                  event calendar. Ranks bought later only add cosmetics and homes — never an
                  advantage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="split flip">
            <div>
              <SectionHead kicker="If it fails" title="Troubleshooting" />
              <div className="stack" style={{ gap: 12 }}>
                {TROUBLE.map(([q, a], i) => (
                  <div className="card" key={q} data-reveal="up" data-delay={String(i * 0.05)}>
                    <h3 className="h3" style={{ fontSize: 16.5, marginBottom: 6 }}>
                      {q}
                    </h3>
                    <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                      {a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <SectionHead kicker="Answers" title="Everything else people ask" />
              <FaqList items={faq} idPrefix="join-faq" />
            </div>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <CtaBand
            title="Stuck on the doorstep?"
            body="Open a ticket in Discord, tell us your device and what the error said. Someone on the server will talk you through it."
            primary={{ label: 'Get help on Discord', href: DISCORD_URL, external: true }}
            secondary={{ label: 'Browse the modes', href: '/modes' }}
          />
        </div>
      </section>
    </>
  );
};
