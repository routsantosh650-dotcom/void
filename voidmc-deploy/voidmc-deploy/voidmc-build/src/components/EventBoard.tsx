import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import type { EventDoc } from '../data/vmData';

interface Parts {
  d: number;
  h: number;
  m: number;
  s: number;
  done: boolean;
}

function parts(at: number, now: number): Parts {
  const diff = Math.max(0, at - now);
  const s = Math.floor(diff / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
    done: diff <= 0,
  };
}

/**
 * Countdown to the next event that has a start time. Events without one are still listed, so the
 * board never collapses into a row of zeros — the weekly schedule is the more useful thing to show
 * until the staff pins a date in the console.
 */
export const EventBoard: React.FC<{ events: EventDoc[] }> = ({ events }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { next, at } = useMemo(() => {
    const dated = events
      .map((e) => ({ e, at: Date.parse(e.startsAt) }))
      .filter((x) => Number.isFinite(x.at) && x.at > now)
      .sort((a, b) => a.at - b.at);
    return dated.length ? { next: dated[0].e, at: dated[0].at } : { next: null, at: 0 };
  }, [events, now]);

  const upcoming = events.filter((e) => !next || e.id !== next.id).slice(0, 3);
  const p = next ? parts(at, now) : null;

  return (
    <div className="board">
      <div className="card-head">
        <div>
          <p className="eyebrow" style={{ marginBottom: 6 }}>
            Next event
          </p>
          <h3 className="h3">{next ? next.title : 'Weekly schedule'}</h3>
        </div>
        <span className="tag">
          <CalendarClock size={12} /> {next ? next.kind : 'no date pinned'}
        </span>
      </div>

      {p ? (
        <div className="board-units" aria-live="off">
          {([
            ['Days', p.d],
            ['Hours', p.h],
            ['Mins', p.m],
            ['Secs', p.s],
          ] as const).map(([label, value]) => (
            <div className="unit" key={label}>
              <div className="unit-num">{String(Math.max(0, value)).padStart(2, '0')}</div>
              <div className="unit-label">{label}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="lead" style={{ margin: '6px 0 14px' }}>
          Events run every week. Dates are posted in Discord the day before — nothing here needs a
          calendar invite, just show up.
        </p>
      )}

      {next ? (
        <p className="tagline">
          Starts {new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(at))}{' '}
          IST · reward: {next.reward || 'bragging rights'}
        </p>
      ) : null}

      {upcoming.length ? (
        <div className="stack" style={{ gap: 8, marginTop: 16 }}>
          {upcoming.map((e) => (
            <div key={e.id} className="join-row" style={{ padding: '10px 13px' }}>
              <span className="stack" style={{ gap: 1, minWidth: 0 }}>
                <span className="label">{e.kind}</span>
                <span style={{ fontSize: 14.5, color: 'var(--ink)' }}>{e.title}</span>
              </span>
              <span className="tag mono">{e.reward || '—'}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
