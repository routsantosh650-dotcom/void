/**
 * Site content, live from Firestore with the repo defaults underneath it.
 *
 * Reads are public (firestore.rules allows get/list on these collections); the console is the only
 * writer. While a collection is still empty the site renders DEFAULT_* from src/data/vmData, so a
 * brand-new deployment is never blank and a rules mistake is never fatal — the visitor only ever
 * sees the shipped copy, never an error.
 */

import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import {
  BuildDoc,
  DEFAULT_BUILDS,
  DEFAULT_CONFIG,
  DEFAULT_EVENTS,
  DEFAULT_FAQ,
  DEFAULT_MODES,
  DEFAULT_RULES,
  DEFAULT_STAFF,
  EventDoc,
  FaqDoc,
  ModeDoc,
  RuleDoc,
  SiteConfigData,
  StaffDoc,
} from '../data/vmData';

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const bool = (v: unknown, fallback = false): boolean => (typeof v === 'boolean' ? v : fallback);
const list = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((i) => typeof i === 'string').slice(0, 12) : [];
const color = (v: unknown, fallback = '#A855F7'): string =>
  /^#[0-9a-fA-F]{6}$/.test(str(v)) ? str(v) : fallback;
const bySort = <T extends { sortOrder: number }>(items: T[]) =>
  items.sort((a, b) => a.sortOrder - b.sortOrder);

const BUILD_CATEGORIES = ['spawn', 'community', 'nether', 'end', 'farm'];
const SEVERITIES = ['hard', 'warn'];
const MODE_LIMIT = 12;

export interface LiveContent {
  ready: boolean;
  config: SiteConfigData;
  modes: ModeDoc[];
  rules: RuleDoc[];
  staff: StaffDoc[];
  events: EventDoc[];
  builds: BuildDoc[];
  faq: FaqDoc[];
}

function mapConfig(d: Record<string, unknown>, prev: SiteConfigData): SiteConfigData {
  return {
    brandName: str(d.brandName, prev.brandName).slice(0, 40),
    tagline: str(d.tagline, prev.tagline).slice(0, 60),
    heroLine: str(d.heroLine, prev.heroLine).slice(0, 400),
    serverIp: str(d.serverIp, prev.serverIp).slice(0, 80).trim(),
    bedrockPort: str(d.bedrockPort, prev.bedrockPort).slice(0, 12).trim(),
    javaVersion: str(d.javaVersion, prev.javaVersion).slice(0, 20),
    discordUrl: str(d.discordUrl, prev.discordUrl).slice(0, 200),
    youtubeUrl: str(d.youtubeUrl, prev.youtubeUrl).slice(0, 200),
    announcement: str(d.announcement, prev.announcement).slice(0, 240),
    playerCap: str(d.playerCap, prev.playerCap).slice(0, 10),
    statusNote: str(d.statusNote, prev.statusNote).slice(0, 120),
  };
}

function mapMode(id: string, d: Record<string, unknown>, index: number): ModeDoc {
  return {
    id,
    title: str(d.title, id),
    tagline: str(d.tagline),
    summary: str(d.summary),
    tags: list(d.tags),
    players: str(d.players).slice(0, 28),
    accent: color(d.accent),
    sortOrder: num(d.sortOrder, index + 1),
    active: bool(d.active, true),
  };
}

function mapRule(id: string, d: Record<string, unknown>, index: number): RuleDoc {
  const severity = str(d.severity, 'hard');
  return {
    id,
    title: str(d.title, id),
    text: str(d.text),
    severity: (SEVERITIES.includes(severity) ? severity : 'hard') as RuleDoc['severity'],
    sortOrder: num(d.sortOrder, index + 1),
    active: bool(d.active, true),
  };
}

function mapStaff(id: string, d: Record<string, unknown>, index: number): StaffDoc {
  return {
    id,
    name: str(d.name, id).slice(0, 30),
    role: str(d.role).slice(0, 30),
    since: str(d.since).slice(0, 20),
    bio: str(d.bio).slice(0, 200),
    perms: list(d.perms),
    sortOrder: num(d.sortOrder, index + 1),
    active: bool(d.active, true),
  };
}

function mapEvent(id: string, d: Record<string, unknown>, index: number): EventDoc {
  return {
    id,
    title: str(d.title, id),
    summary: str(d.summary),
    kind: str(d.kind, 'Event').slice(0, 20),
    startsAt: str(d.startsAt).slice(0, 32),
    reward: str(d.reward).slice(0, 60),
    sortOrder: num(d.sortOrder, index + 1),
    active: bool(d.active, true),
  };
}

function mapBuild(id: string, d: Record<string, unknown>, index: number): BuildDoc {
  const category = str(d.category, 'community');
  return {
    id,
    title: str(d.title, id),
    author: str(d.author).slice(0, 40),
    category: (BUILD_CATEGORIES.includes(category) ? category : 'community') as BuildDoc['category'],
    summary: str(d.summary),
    tags: list(d.tags),
    year: num(d.year, new Date().getFullYear()),
    featured: bool(d.featured),
    sortOrder: num(d.sortOrder, index + 1),
    active: bool(d.active, true),
  };
}

function mapFaq(id: string, d: Record<string, unknown>, index: number): FaqDoc {
  return {
    id,
    q: str(d.q, id),
    a: str(d.a),
    sortOrder: num(d.sortOrder, index + 1),
    active: bool(d.active, true),
  };
}

/** A Firestore rules mistake must never reach the visitor; reads fail closed onto the defaults. */
const ignore = () => {};

export function useLiveContent(): LiveContent {
  const [state, setState] = useState<LiveContent>({
    ready: false,
    config: DEFAULT_CONFIG,
    modes: DEFAULT_MODES,
    rules: DEFAULT_RULES,
    staff: DEFAULT_STAFF,
    events: DEFAULT_EVENTS,
    builds: DEFAULT_BUILDS,
    faq: DEFAULT_FAQ,
  });

  useEffect(() => {
    const unsub = [
      onSnapshot(
        doc(db, 'site', 'config'),
        (snap) => {
          if (!snap.exists()) return;
          const d = snap.data() as Record<string, unknown>;
          setState((prev) => ({ ready: true, ...prev, config: mapConfig(d, prev.config) }));
        },
        ignore
      ),

      onSnapshot(
        collection(db, 'modes'),
        (snap) => {
          if (!snap.size) return;
          const modes = bySort(
            snap.docs
              .map((row, i) => mapMode(row.id, row.data() as Record<string, unknown>, i))
              .filter((m) => m.active && m.title)
          ).slice(0, MODE_LIMIT);
          if (modes.length) setState((prev) => ({ ...prev, ready: true, modes }));
        },
        ignore
      ),

      onSnapshot(
        collection(db, 'rules'),
        (snap) => {
          if (!snap.size) return;
          const rules = bySort(
            snap.docs
              .map((row, i) => mapRule(row.id, row.data() as Record<string, unknown>, i))
              .filter((r) => r.active && r.title)
          );
          if (rules.length) setState((prev) => ({ ...prev, ready: true, rules }));
        },
        ignore
      ),

      onSnapshot(
        collection(db, 'staff'),
        (snap) => {
          if (!snap.size) return;
          const staff = bySort(
            snap.docs
              .map((row, i) => mapStaff(row.id, row.data() as Record<string, unknown>, i))
              .filter((s) => s.active && s.name)
          );
          setState((prev) => ({ ...prev, ready: true, staff }));
        },
        ignore
      ),

      onSnapshot(
        collection(db, 'events'),
        (snap) => {
          if (!snap.size) return;
          const events = bySort(
            snap.docs
              .map((row, i) => mapEvent(row.id, row.data() as Record<string, unknown>, i))
              .filter((e) => e.active && e.title)
          );
          setState((prev) => ({ ...prev, ready: true, events }));
        },
        ignore
      ),

      onSnapshot(
        collection(db, 'builds'),
        (snap) => {
          if (!snap.size) return;
          const builds = bySort(
            snap.docs
              .map((row, i) => mapBuild(row.id, row.data() as Record<string, unknown>, i))
              .filter((b) => b.active && b.title)
          );
          if (builds.length) setState((prev) => ({ ...prev, ready: true, builds }));
        },
        ignore
      ),

      onSnapshot(
        collection(db, 'faq'),
        (snap) => {
          if (!snap.size) return;
          const faq = bySort(
            snap.docs
              .map((row, i) => mapFaq(row.id, row.data() as Record<string, unknown>, i))
              .filter((f) => f.active && f.q && f.a)
          );
          if (faq.length) setState((prev) => ({ ...prev, ready: true, faq }));
        },
        ignore
      ),
    ];
    return () => unsub.forEach((u) => u());
  }, []);

  return state;
}

/** The next event that has an actual start time — what the countdown board reads. */
export function nextUpcomingEvent(events: EventDoc[]): EventDoc | null {
  const now = Date.now();
  return (
    events
      .map((e) => ({ e, at: Date.parse(e.startsAt) }))
      .filter((x) => Number.isFinite(x.at) && x.at > now)
      .sort((a, b) => a.at - b.at)[0]?.e ?? null
  );
}
