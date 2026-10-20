import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  ArrowLeft,
  Download,
  KeyRound,
  LogOut,
  Mail,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Users2,
} from 'lucide-react';
import { auth, db } from '../firebase';
import { BUILD_TAG } from '../version';
import { DISCORD_URL } from '../config';
import { navigate } from '../router';
import { showToast } from '../lib/toast';
import { consoleProfileForEmail } from '../lib/adminGate';
import {
  downloadAuditCsv,
  fetchAuditLog,
  formatAuditTime,
  recordAudit,
  type AuditEntry,
} from '../lib/audit';
import {
  DEFAULT_BUILDS,
  DEFAULT_CONFIG,
  DEFAULT_EVENTS,
  DEFAULT_FAQ,
  DEFAULT_MODES,
  DEFAULT_RULES,
  DEFAULT_STAFF,
} from '../data/vmData';

interface Props {
  onNeedLogin: () => void;
}

/**
 * The console. It is reached only through a digest-matched URL, needs a Firebase session whose
 * email is on the allowlist, and then needs the 6-digit code the Worker emails to that same
 * address. Firestore writes are additionally gated by rules, so this UI being open is never the
 * only thing standing between an attacker and the content.
 *
 * Nothing here links back to the public site beyond one deliberate "leave console" control, and no
 * public page links in — the panel and the site share zero visible surface.
 */

type Kind = 'text' | 'textarea' | 'tags' | 'number' | 'color' | 'bool' | 'select';
type Row = Record<string, unknown> & { __id: string };

interface Field {
  key: string;
  label: string;
  kind: Kind;
  opts?: string[];
  max?: number;
  hint?: string;
}

interface Spec {
  name: string;
  label: string;
  fields: Field[];
  title: string;
  blank: Record<string, unknown>;
  seed: () => Array<Record<string, unknown>>;
}

const slug = (v: string) =>
  (v || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

const asText = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));

const coerce = (kind: Kind, value: unknown): unknown => {
  if (kind === 'number') {
    const n = Number(value);
    // Firestore rules require `int`: a 1.5 typed into an order field would otherwise be refused
    // with a permission-denied that looks like a rules bug.
    return Number.isFinite(n) ? Math.round(n) : 0;
  }
  if (kind === 'bool') return value === true || value === 'true';
  if (kind === 'tags') {
    const raw = Array.isArray(value) ? value : asText(value).split(',');
    // rules cap the list at 12 entries of at most 40 characters each.
    return raw.map((x) => asText(x).trim().slice(0, 40)).filter(Boolean).slice(0, 12);
  }
  if (kind === 'color') {
    const c = asText(value).trim();
    return /^#[0-9a-fA-F]{6}$/.test(c) ? c : '#A855F7';
  }
  return asText(value);
};

const CONFIG_FIELDS: Field[] = [
  { key: 'brandName', label: 'Brand name', kind: 'text', max: 40 },
  { key: 'tagline', label: 'Tagline', kind: 'text', max: 60 },
  { key: 'heroLine', label: 'Hero paragraph', kind: 'textarea', max: 400 },
  { key: 'serverIp', label: 'Java address', kind: 'text', max: 80, hint: 'Leave empty to hide the copy button' },
  { key: 'bedrockPort', label: 'Bedrock port', kind: 'text', max: 12 },
  { key: 'javaVersion', label: 'Java version', kind: 'text', max: 20 },
  { key: 'discordUrl', label: 'Discord invite', kind: 'text', max: 200 },
  { key: 'youtubeUrl', label: 'YouTube channel', kind: 'text', max: 200 },
  { key: 'announcement', label: 'Marquee line', kind: 'textarea', max: 240 },
  { key: 'playerCap', label: 'Player cap', kind: 'text', max: 10 },
  { key: 'statusNote', label: 'Status note', kind: 'textarea', max: 120 },
];

const SPECS: Spec[] = [
  {
    name: 'modes',
    label: 'Game modes',
    title: 'title',
    fields: [
      { key: 'title', label: 'Name', kind: 'text', max: 40 },
      { key: 'tagline', label: 'Tagline', kind: 'text', max: 60 },
      { key: 'summary', label: 'Description', kind: 'textarea', max: 420 },
      { key: 'players', label: 'Badge', kind: 'text', max: 28 },
      { key: 'tags', label: 'Tags (comma separated)', kind: 'tags' },
      { key: 'accent', label: 'Accent colour', kind: 'color' },
      { key: 'sortOrder', label: 'Order', kind: 'number' },
      { key: 'active', label: 'Visible', kind: 'bool' },
    ],
    blank: { title: '', tagline: '', summary: '', players: '', tags: [], accent: '#A855F7', sortOrder: 99, active: true },
    seed: () => DEFAULT_MODES.map(({ id: _id, ...rest }) => rest),
  },
  {
    name: 'events',
    label: 'Events',
    title: 'title',
    fields: [
      { key: 'title', label: 'Name', kind: 'text', max: 60 },
      { key: 'kind', label: 'Type', kind: 'text', max: 20 },
      { key: 'summary', label: 'Description', kind: 'textarea', max: 420 },
      { key: 'startsAt', label: 'Starts at (ISO)', kind: 'text', max: 32, hint: '2026-11-02T18:30 — the countdown reads the next future one' },
      { key: 'reward', label: 'Reward', kind: 'text', max: 60 },
      { key: 'sortOrder', label: 'Order', kind: 'number' },
      { key: 'active', label: 'Visible', kind: 'bool' },
    ],
    blank: { title: '', kind: 'Event', summary: '', startsAt: '', reward: '', sortOrder: 99, active: true },
    seed: () => DEFAULT_EVENTS.map(({ id: _id, ...rest }) => rest),
  },
  {
    name: 'builds',
    label: 'Build gallery',
    title: 'title',
    fields: [
      { key: 'title', label: 'Build name', kind: 'text', max: 60 },
      { key: 'author', label: 'Built by', kind: 'text', max: 40 },
      { key: 'category', label: 'Category', kind: 'select', opts: ['spawn', 'community', 'nether', 'end', 'farm'] },
      { key: 'summary', label: 'Description', kind: 'textarea', max: 420 },
      { key: 'tags', label: 'Tags (comma separated)', kind: 'tags' },
      { key: 'year', label: 'Year', kind: 'number' },
      { key: 'featured', label: 'Featured', kind: 'bool' },
      { key: 'sortOrder', label: 'Order', kind: 'number' },
      { key: 'active', label: 'Visible', kind: 'bool' },
    ],
    blank: {
      title: '',
      author: '',
      category: 'community',
      summary: '',
      tags: [],
      year: new Date().getFullYear(),
      featured: false,
      sortOrder: 99,
      active: true,
    },
    seed: () => DEFAULT_BUILDS.map(({ id: _id, ...rest }) => rest),
  },
  {
    name: 'rules',
    label: 'Rules',
    title: 'title',
    fields: [
      { key: 'title', label: 'Rule heading', kind: 'text', max: 70 },
      { key: 'text', label: 'Rule body', kind: 'textarea', max: 420 },
      { key: 'severity', label: 'Severity', kind: 'select', opts: ['hard', 'warn'] },
      { key: 'sortOrder', label: 'Order', kind: 'number' },
      { key: 'active', label: 'Visible', kind: 'bool' },
    ],
    blank: { title: '', text: '', severity: 'hard', sortOrder: 99, active: true },
    seed: () => DEFAULT_RULES.map(({ id: _id, ...rest }) => rest),
  },
  {
    name: 'staff',
    label: 'Staff team',
    title: 'name',
    fields: [
      { key: 'name', label: 'In-game name', kind: 'text', max: 30 },
      { key: 'role', label: 'Role', kind: 'text', max: 30 },
      { key: 'since', label: 'Since', kind: 'text', max: 20 },
      { key: 'bio', label: 'One-line bio', kind: 'textarea', max: 200 },
      { key: 'perms', label: 'Handles (comma separated)', kind: 'tags' },
      { key: 'sortOrder', label: 'Order', kind: 'number' },
      { key: 'active', label: 'Visible', kind: 'bool' },
    ],
    blank: { name: '', role: '', since: '', bio: '', perms: [], sortOrder: 99, active: true },
    seed: () => DEFAULT_STAFF.map(({ id: _id, ...rest }) => rest),
  },
  {
    name: 'faq',
    label: 'FAQ',
    title: 'q',
    fields: [
      { key: 'q', label: 'Question', kind: 'text', max: 120 },
      { key: 'a', label: 'Answer', kind: 'textarea', max: 600 },
      { key: 'sortOrder', label: 'Order', kind: 'number' },
      { key: 'active', label: 'Visible', kind: 'bool' },
    ],
    blank: { q: '', a: '', sortOrder: 99, active: true },
    seed: () => DEFAULT_FAQ.map(({ id: _id, ...rest }) => rest),
  },
];

const TABS = ['overview', 'config', ...SPECS.map((s) => s.name), 'audit'] as const;
type Tab = (typeof TABS)[number];

const specOf = (tab: Tab) => SPECS.find((s) => s.name === tab) || null;

export const AdminConsole: React.FC<Props> = ({ onNeedLogin }) => {
  const [user, setUser] = useState<{ email: string; name: string; role: string } | null>(null);
  const [authReady, setAuthReady] = useState(false);
  // Two separate gates: the code has been emailed, and the emailed code has been proven.
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [gateError, setGateError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    return onAuthStateChanged(auth, (fb) => {
      if (!fb?.email) {
        setUser(null);
        setAuthReady(true);
        return;
      }
      const email = fb.email;
      void consoleProfileForEmail(email).then((profile) => {
        if (!profile) {
          setUser(null);
          setAuthReady(true);
          return;
        }
        const wasVerified = sessionStorage.getItem('voidmc-verified') === email.toLowerCase();
        setUser({ email, name: profile.name, role: profile.role });
        setVerified(wasVerified);
        setCodeSent(wasVerified);
        setAuthReady(true);
      });
    });
  }, []);

  // Counts for the overview tiles: one read per collection, no live listeners.
  const loadCounts = useCallback(async () => {
    const out: Record<string, number> = {};
    for (const spec of SPECS) {
      try {
        const snap = await getDocs(collection(db, spec.name));
        out[spec.name] = snap.size;
      } catch {
        out[spec.name] = -1;
      }
    }
    setCounts(out);
  }, []);

  useEffect(() => {
    if (verified && user) void loadCounts();
  }, [verified, user, loadCounts]);

  const sendCode = async () => {
    const fb = auth.currentUser;
    if (!fb) return;
    setBusy(true);
    setGateError('');
    try {
      const idToken = await fb.getIdToken(true);
      const res = await fetch('/api/admin/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const out = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (out?.ok) {
        setCodeSent(true);
        showToast('A 6-digit code is on its way to your email.', 'good');
      } else {
        const map: Record<string, string> = {
          'no-session': 'Your session expired. Sign in again.',
          'not-admin': 'This email is not on the console allowlist.',
          'email-not-configured':
            'The Worker has no EmailJS credentials yet — add the four EMAILJS_* values in Cloudflare, then retry.',
          'email-failed': 'EmailJS rejected the send. Check the template id and the private key secret.',
          'rate-limited': 'Too many codes requested. Wait a few minutes.',
        };
        setGateError(map[out?.error || ''] || 'Could not send the code. Try again in a minute.');
      }
    } catch {
      setGateError('The Worker did not answer. Check that the voidmc Worker is deployed.');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const fb = auth.currentUser;
    if (!fb) return;
    setBusy(true);
    setGateError('');
    try {
      const idToken = await fb.getIdToken(true);
      const res = await fetch('/api/admin/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, code: code.replace(/\D/g, '') }),
      });
      const out = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (out?.ok) {
        sessionStorage.setItem('voidmc-verified', fb.email?.toLowerCase() || '');
        setVerified(true);
        setCode('');
        void recordAudit({ category: 'AUTH', action: 'console-unlocked', target: 'console', summary: 'Admin opened the console after email code' });
        showToast('Console unlocked.', 'good');
      } else {
        const map: Record<string, string> = {
          wrong: 'That code is not right.',
          expired: 'That code expired. Send a new one.',
          'too-many': 'Too many wrong attempts. Send a fresh code.',
          'not-admin': 'This email is not on the console allowlist.',
        };
        setGateError(map[out?.error || ''] || 'Verification failed.');
      }
    } catch {
      setGateError('The Worker did not answer. Check that the voidmc Worker is deployed.');
    } finally {
      setBusy(false);
    }
  };

  if (!authReady) {
    return (
      <main className="page">
        <div className="wrap console">
          <p className="eyebrow">VOIDMC console</p>
          <h1 className="h2">Checking the gate…</h1>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page">
        <div className="wrap console" style={{ maxWidth: 560 }}>
          <div className="panel">
            <p className="eyebrow">Restricted</p>
            <h1 className="h2" style={{ marginBottom: 10 }}>
              Staff sign-in
            </h1>
            <p className="lead" style={{ marginTop: 0 }}>
              The console needs an account whose email is on the server allowlist, then a 6-digit
              code sent to that same address.
            </p>
            <div className="row" style={{ marginTop: 18 }}>
              <button type="button" className="btn btn-primary" onClick={onNeedLogin}>
                <KeyRound size={16} />
                Sign in
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>
                <ArrowLeft size={15} />
                Back to site
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!verified && !codeSent) {
    return (
      <main className="page">
        <div className="wrap console" style={{ maxWidth: 560 }}>
          <div className="panel">
            <p className="eyebrow">Second step</p>
            <h1 className="h2" style={{ marginBottom: 10 }}>
              Confirm it is you
            </h1>
            <p className="lead" style={{ marginTop: 0 }}>
              Signed in as <strong className="mono">{user.email}</strong>. We email a 6-digit code to
              that address; it is valid for five minutes.
            </p>
            {gateError ? (
              <p className="err" role="alert">
                {gateError}
              </p>
            ) : null}
            <div className="row" style={{ marginTop: 18 }}>
              <button type="button" className="btn btn-primary" onClick={() => void sendCode()} disabled={busy}>
                <Mail size={16} />
                Email me the code
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => void signOut(auth)} disabled={busy}>
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!verified) {
    return (
      <main className="page">
        <div className="wrap console" style={{ maxWidth: 560 }}>
          <div className="panel">
            <p className="eyebrow">Enter the code</p>
            <h1 className="h2" style={{ marginBottom: 10 }}>
              Six digits
            </h1>
            {gateError ? (
              <p className="err" role="alert">
                {gateError}
              </p>
            ) : null}
            <form onSubmit={verifyCode} className="stack" style={{ gap: 14, marginTop: 14 }}>
              <input
                className="input mono"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="6-digit code"
                style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: 22 }}
              />
              <button type="submit" className="btn btn-primary" disabled={code.length !== 6 || busy}>
                Unlock console
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => void sendCode()} disabled={busy}>
                Send another code
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="wrap console">
        <header className="console-head">
          <div>
            <p className="eyebrow" style={{ marginBottom: 4 }}>
              VOIDMC console · {BUILD_TAG}
            </p>
            <h1 className="h2" style={{ fontSize: 24 }}>
              {user.name}
            </h1>
            <p className="tagline">
              {user.role} · {user.email}
            </p>
          </div>
          <div className="toolbar">
            <button type="button" className="btn btn-ghost sm" onClick={() => void loadCounts()}>
              <RotateCcw size={14} />
              Refresh
            </button>
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="btn btn-ghost sm">
              Discord
            </a>
            <button type="button" className="btn btn-ghost sm" onClick={() => navigate('/')}>
              <ArrowLeft size={14} />
              View site
            </button>
            <button
              type="button"
              className="btn btn-danger sm"
              onClick={() => {
                sessionStorage.removeItem('voidmc-verified');
                void signOut(auth);
              }}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </header>

        <nav className="tabs" aria-label="Console sections">
          <button type="button" className={tab === 'overview' ? 'is-on' : ''} onClick={() => setTab('overview')}>
            Overview
          </button>
          <button type="button" className={tab === 'config' ? 'is-on' : ''} onClick={() => setTab('config')}>
            Site config
          </button>
          {SPECS.map((s) => (
            <button
              key={s.name}
              type="button"
              className={tab === s.name ? 'is-on' : ''}
              onClick={() => setTab(s.name as Tab)}
            >
              {s.label}
              {counts[s.name] !== undefined && counts[s.name] >= 0 ? ` (${counts[s.name]})` : ''}
            </button>
          ))}
          <button type="button" className={tab === 'audit' ? 'is-on' : ''} onClick={() => setTab('audit')}>
            Audit log
          </button>
        </nav>

        {tab === 'overview' ? <Overview counts={counts} /> : null}
        {tab === 'config' ? <ConfigTab /> : null}
        {specOf(tab) ? <CollectionTab key={tab} spec={specOf(tab)!} onChanged={() => void loadCounts()} /> : null}
        {tab === 'audit' ? <AuditTab /> : null}
      </div>
    </main>
  );
};

/* ------------------------------- overview ------------------------------- */

const Overview: React.FC<{ counts: Record<string, number> }> = ({ counts }) => {
  const empty = SPECS.filter((s) => (counts[s.name] ?? 0) === 0);
  const blocked = SPECS.filter((s) => counts[s.name] === -1);

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="grid grid-4">
        {SPECS.map((s) => (
          <div className="stat-tile" key={s.name}>
            <span className="n">{counts[s.name] === undefined ? '…' : Math.max(0, counts[s.name])}</span>
            <span className="t">{s.label}</span>
          </div>
        ))}
      </div>

      {blocked.length ? (
        <div className="panel">
          <h3 className="h3" style={{ marginBottom: 8 }}>
            <TriangleAlert size={15} style={{ display: 'inline', verticalAlign: '-2px', color: 'var(--amber)' }} />{' '}
            Firestore refused the read
          </h3>
          <p className="muted" style={{ fontSize: 14, margin: 0 }}>
            Publish <span className="mono">firestore.rules</span> on the <span className="mono">(default)</span>{' '}
            database of the voidmc Firebase project. Until then the site shows its built-in defaults
            and this console cannot save.
          </p>
        </div>
      ) : null}

      {empty.length ? (
        <div className="panel">
          <h3 className="h3" style={{ marginBottom: 8 }}>
            <Users2 size={15} style={{ display: 'inline', verticalAlign: '-2px', color: 'var(--violet-soft)' }} />{' '}
            Collections with no documents
          </h3>
          <p className="muted" style={{ fontSize: 14 }}>
            {empty.map((s) => s.label).join(', ')} — the public pages are rendering the copy shipped
            in the build. Open the section and press “Publish starter {empty.length === 1 ? 'set' : 'sets'}”
            to make it editable live.
          </p>
        </div>
      ) : null}

      <div className="panel">
        <h3 className="h3" style={{ marginBottom: 8 }}>
          How the rest of this works
        </h3>
        <ul className="muted" style={{ fontSize: 14, margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
          <li>Everything you save here changes the site instantly — visitors get the new copy on their next load, no redeploy.</li>
          <li>Deleting a row removes it from the site. Turning “Visible” off hides it but keeps the document.</li>
          <li>Order numbers decide the sequence; use the arrows to move a row and the number rewrites itself.</li>
          <li>Every save is written to the audit log with what changed, who changed it and from which IP.</li>
        </ul>
      </div>
    </div>
  );
};

/* ------------------------------ config tab ------------------------------ */

const ConfigTab: React.FC = () => {
  const [form, setForm] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const snap = await getDoc(doc(db, 'site', 'config'));
      const base: Record<string, string> = {};
      CONFIG_FIELDS.forEach((f) => {
        base[f.key] = asText((DEFAULT_CONFIG as unknown as Record<string, unknown>)[f.key]);
      });
      if (snap.exists()) {
        const data = snap.data() as Record<string, unknown>;
        CONFIG_FIELDS.forEach((f) => {
          if (data[f.key] !== undefined) base[f.key] = asText(data[f.key]);
        });
      }
      setForm(base);
      setLoaded(true);
    } catch {
      setError(
        'Firestore blocked this read. Publish firestore.rules on the (default) database, then press Reload.'
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {};
      CONFIG_FIELDS.forEach((f) => {
        payload[f.key] = coerce(f.kind, form[f.key]).toString().slice(0, f.max || 400).trim();
      });
      await setDoc(doc(db, 'site', 'config'), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
      void recordAudit({
        category: 'ADMIN',
        action: 'config-save',
        target: 'site/config',
        summary: 'Site configuration updated',
      });
      showToast('Site config saved.', 'good');
    } catch {
      setError('Could not save. The rules or the network refused the write.');
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) {
    return (
      <div className="panel">
        <p className="muted" style={{ margin: 0 }}>
          {error || 'Loading…'}
        </p>
        {error ? (
          <button type="button" className="btn btn-ghost sm" style={{ marginTop: 12 }} onClick={() => void load()}>
            <RotateCcw size={14} />
            Reload
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="panel">
      <h3 className="h3" style={{ marginBottom: 4 }}>
        Site configuration
      </h3>
      <p className="tagline" style={{ marginBottom: 12 }}>
        The address and port drive every copy button on the site. Set them once and the Join page
        works for everybody.
      </p>
      <div className="row-edit">
        {CONFIG_FIELDS.map((f) => (
          <div className="field" key={f.key} style={{ marginTop: 0 }}>
            <label htmlFor={`cfg-${f.key}`}>{f.label}</label>
            {f.kind === 'textarea' ? (
              <textarea
                id={`cfg-${f.key}`}
                className="textarea"
                value={form[f.key] || ''}
                maxLength={f.max}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              />
            ) : (
              <input
                id={`cfg-${f.key}`}
                className="input"
                value={form[f.key] || ''}
                maxLength={f.max}
                placeholder={f.hint || ''}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>
      {error ? (
        <p className="err" role="alert">
          {error}
        </p>
      ) : null}
      <div className="row" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={busy}>
          <Save size={16} />
          Save config
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => void load()} disabled={busy}>
          <RotateCcw size={15} />
          Reload
        </button>
      </div>
    </div>
  );
};

/* ---------------------------- collection editor ---------------------------- */

const CollectionTab: React.FC<{ spec: Spec; onChanged: () => void }> = ({ spec, onChanged }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const snap = await getDocs(collection(db, spec.name));
      setRows(
        snap.docs
          .map((d) => ({ ...(d.data() as Record<string, unknown>), __id: d.id }) as Row)
          .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0))
      );
    } catch {
      setError(
        `Firestore refused to read “${spec.name}”. Publish firestore.rules on the (default) database of the voidmc project.`
      );
    }
  }, [spec.name]);

  useEffect(() => {
    void load();
  }, [load]);

  const commit = async (id: string, fields: Record<string, unknown>) => {
    setBusy(true);
    setError('');
    try {
      const before = rows.find((r) => r.__id === id);
      await setDoc(doc(db, spec.name, id), { ...fields, updatedAt: serverTimestamp() }, { merge: true });
      void recordAudit({
        category: 'ADMIN',
        action: 'content-save',
        target: `${spec.name}/${id}`,
        summary: `Updated ${spec.label.toLowerCase()} · ${asText(fields[spec.title] || id)}`,
        changes: Object.keys(fields)
          .filter((k) => JSON.stringify((before || {})[k]) !== JSON.stringify(fields[k]))
          .slice(0, 12)
          .map((k) => `${k}: ${JSON.stringify((before || {})[k])} → ${JSON.stringify(fields[k])}`),
      });
      showToast('Saved.', 'good');
      onChanged();
    } catch {
      setError('The write was rejected. Check that firestore.rules is published on the (default) database.');
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    setBusy(true);
    setError('');
    try {
      const fields: Record<string, unknown> = { ...spec.blank };
      spec.fields.forEach((f) => {
        fields[f.key] = coerce(f.kind, spec.blank[f.key]);
      });
      fields.sortOrder = (rows.reduce((m, r) => Math.max(m, Number(r.sortOrder) || 0), 0) || 0) + 1;
      const id = await addDoc(collection(db, spec.name), {
        ...fields,
        updatedAt: serverTimestamp(),
      });
      void recordAudit({
        category: 'ADMIN',
        action: 'content-create',
        target: `${spec.name}/${id.id}`,
        summary: `Created ${spec.label.toLowerCase()}`,
      });
      setRows((prev) => [...prev, { ...fields, __id: id.id } as Row]);
      showToast('Added. Fill it in and save.', 'good');
      onChanged();
    } catch {
      setError('The write was rejected. Check that firestore.rules is published.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: Row) => {
    setBusy(true);
    setError('');
    try {
      await deleteDoc(doc(db, spec.name, row.__id));
      setRows((prev) => prev.filter((r) => r.__id !== row.__id));
      void recordAudit({
        category: 'ADMIN',
        action: 'content-delete',
        target: `${spec.name}/${row.__id}`,
        summary: `Deleted ${spec.label.toLowerCase()} · ${asText(row[spec.title])}`,
      });
      showToast('Deleted.', 'info');
      onChanged();
    } catch {
      setError('Delete was refused by Firestore rules.');
    } finally {
      setBusy(false);
    }
  };

  const seed = async () => {
    setBusy(true);
    setError('');
    try {
      const list = spec.seed();
      for (const item of list) {
        const fields: Record<string, unknown> = {};
        spec.fields.forEach((f) => {
          fields[f.key] = coerce(f.kind, item[f.key]);
        });
        const id = slug(asText(fields[spec.title])) || `item-${Math.random().toString(36).slice(2, 8)}`;
        await setDoc(doc(db, spec.name, id), { ...fields, updatedAt: serverTimestamp() }, { merge: true });
      }
      void recordAudit({
        category: 'ADMIN',
        action: 'content-seed',
        target: spec.name,
        summary: `Published ${list.length} starter ${spec.label.toLowerCase()} documents`,
      });
      showToast(`Published ${list.length} rows.`, 'good');
      await load();
      onChanged();
    } catch {
      setError('Seeding was refused. Publish firestore.rules first.');
    } finally {
      setBusy(false);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const a = rows[index];
    const b = rows[index + dir];
    if (!a || !b) return;
    const swapped = [...rows];
    swapped[index] = b;
    swapped[index + dir] = a;
    setRows(swapped);
    const fields = (row: Row) => {
      const out: Record<string, unknown> = {};
      spec.fields.forEach((f) => {
        out[f.key] = coerce(f.kind, row[f.key]);
      });
      return out;
    };
    const reorders = swapped.map((row, i) => ({ ...row, sortOrder: i + 1 }));
    try {
      await Promise.all(
        [a, b].map((row) => {
          const next = reorders.find((r) => r.__id === row.__id)!;
          return setDoc(doc(db, spec.name, row.__id), { ...fields(next), sortOrder: next.sortOrder }, { merge: true });
        })
      );
      setRows(reorders as Row[]);
      void recordAudit({
        category: 'ADMIN',
        action: 'content-reorder',
        target: spec.name,
        summary: `Reordered ${spec.label.toLowerCase()}`,
      });
    } catch {
      setError('Reorder was refused by Firestore rules.');
      setRows(rows);
    }
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="toolbar">
        <button type="button" className="btn btn-primary sm" onClick={() => void add()} disabled={busy}>
          <Plus size={14} />
          Add {spec.label.replace(/s$/, '').toLowerCase()}
        </button>
        <button type="button" className="btn btn-ghost sm" onClick={() => void seed()} disabled={busy}>
          <Download size={14} />
          Publish starter set
        </button>
        <button type="button" className="btn btn-ghost sm" onClick={() => void load()} disabled={busy}>
          <RotateCcw size={14} />
          Reload
        </button>
        <span className="line-sep" />
        <span className="tagline mono">{rows.length} document(s)</span>
      </div>

      {error ? (
        <p className="err" role="alert">
          {error}
        </p>
      ) : null}

      {rows.length ? (
        rows.map((row, i) => (
          <EditorRow
            key={row.__id}
            spec={spec}
            row={row}
            index={i}
            total={rows.length}
            busy={busy}
            onSave={(fields) => void commit(row.__id, fields)}
            onDelete={() => void remove(row)}
            onMove={(dir) => void move(i, dir)}
          />
        ))
      ) : (
        <div className="panel">
          <h3 className="h3" style={{ marginBottom: 8 }}>
            Nothing in “{spec.label}” yet
          </h3>
          <p className="muted" style={{ fontSize: 14, margin: 0 }}>
            The public pages are showing the copy shipped inside the build. Press{" "}
            <strong>Publish starter set</strong> to push that copy into Firestore, then every change
            you make here replaces it live.
          </p>
        </div>
      )}
    </div>
  );
};

const EditorRow: React.FC<{
  spec: Spec;
  row: Row;
  index: number;
  total: number;
  busy: boolean;
  onSave: (fields: Record<string, unknown>) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}> = ({ spec, row, index, total, busy, onSave, onDelete, onMove }) => {
  const [draft, setDraft] = useState<Record<string, unknown>>(() => ({ ...row }));
  const [open, setOpen] = useState(false);

  const dirty = useMemo(
    () => spec.fields.some((f) => JSON.stringify(draft[f.key]) !== JSON.stringify(row[f.key])),
    [draft, row, spec.fields]
  );

  const save = () => {
    const fields: Record<string, unknown> = {};
    spec.fields.forEach((f) => {
      fields[f.key] = coerce(f.kind, draft[f.key]);
    });
    onSave(fields);
  };

  const titleText = asText(draft[spec.title]) || '(untitled)';
  const visible = draft.active !== false;

  return (
    <div className="panel" style={{ padding: open ? undefined : 0 }}>
      {open ? (
        <div className="stack" style={{ gap: 12 }}>
          <div className="card-head">
            <h3 className="h3" style={{ fontSize: 17 }}>
              {titleText}
            </h3>
            <span className={`badge ${visible ? 'on' : 'off'}`}>{visible ? 'visible' : 'hidden'}</span>
          </div>

          <div className="row-edit">
            {spec.fields.map((f) => (
              <div className="field" key={f.key} style={{ marginTop: 0 }}>
                <label htmlFor={`${row.__id}-${f.key}`}>{f.label}</label>
                {f.kind === 'textarea' ? (
                  <textarea
                    id={`${row.__id}-${f.key}`}
                    className="textarea"
                    maxLength={f.max}
                    value={asText(draft[f.key])}
                    onChange={(e) => setDraft((p) => ({ ...p, [f.key]: e.target.value }))}
                  />
                ) : f.kind === 'bool' ? (
                  <label className="switch">
                    <input
                      id={`${row.__id}-${f.key}`}
                      type="checkbox"
                      checked={draft[f.key] !== false}
                      onChange={(e) => setDraft((p) => ({ ...p, [f.key]: e.target.checked }))}
                    />
                    {f.label}
                  </label>
                ) : f.kind === 'select' ? (
                  <select
                    id={`${row.__id}-${f.key}`}
                    className="input"
                    value={asText(draft[f.key])}
                    onChange={(e) => setDraft((p) => ({ ...p, [f.key]: e.target.value }))}
                  >
                    {(f.opts || []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`${row.__id}-${f.key}`}
                    className="input"
                    type={f.kind === 'number' ? 'number' : f.kind === 'color' ? 'text' : 'text'}
                    maxLength={f.max}
                    placeholder={f.hint || ''}
                    value={f.kind === 'tags' ? (Array.isArray(draft[f.key]) ? (draft[f.key] as string[]).join(', ') : asText(draft[f.key])) : asText(draft[f.key])}
                    onChange={(e) => setDraft((p) => ({ ...p, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="toolbar">
            <button type="button" className="btn btn-primary sm" onClick={save} disabled={busy || !dirty}>
              <Save size={14} />
              {dirty ? 'Save changes' : 'Saved'}
            </button>
            <button type="button" className="btn btn-ghost sm" onClick={() => setDraft({ ...row })} disabled={busy}>
              <RotateCcw size={14} />
              Revert
            </button>
            <button type="button" className="btn btn-ghost sm" onClick={() => onMove(-1)} disabled={busy || index === 0}>
              Up
            </button>
            <button
              type="button"
              className="btn btn-ghost sm"
              onClick={() => onMove(1)}
              disabled={busy || index >= total - 1}
            >
              Down
            </button>
            <span className="line-sep" />
            <button type="button" className="btn btn-danger sm" onClick={onDelete} disabled={busy}>
              <Trash2 size={14} />
              Delete
            </button>
            <button type="button" className="btn btn-ghost sm" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="toolbar" style={{ padding: '14px 16px', gap: 12 }}>
          <span className="mode-index">{String(index + 1).padStart(2, '0')}</span>
          <span style={{ fontWeight: 600, color: 'var(--ink)', flex: 1, minWidth: 0 }}>
            {titleText}
          </span>
          <span className={`badge ${visible ? 'on' : 'off'}`}>{visible ? 'visible' : 'hidden'}</span>
          <button type="button" className="btn btn-ghost sm" onClick={() => setOpen(true)}>
            <ShieldCheck size={13} />
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

/* ------------------------------- audit tab ------------------------------- */

const AuditTab: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    setBusy(true);
    const { entries: list, error: err } = await fetchAuditLog({ max: 200 });
    setEntries(list);
    setError(err || (list.length ? '' : 'No entries yet — the log fills as soon as anything is saved.'));
    setBusy(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const needle = search.trim().toLowerCase();
  const shown = needle
    ? entries.filter((e) =>
        [e.actor, e.action, e.target, e.summary, ...e.changes].join(' ').toLowerCase().includes(needle)
      )
    : entries;

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="toolbar">
        <input
          className="input"
          style={{ maxWidth: 280 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search actor, action, target…"
          aria-label="Search audit log"
        />
        <button type="button" className="btn btn-ghost sm" onClick={() => void load()} disabled={busy}>
          <RotateCcw size={14} />
          Reload
        </button>
        <span className="line-sep" />
        <button type="button" className="btn btn-ghost sm" onClick={() => downloadAuditCsv(shown)} disabled={!shown.length}>
          <Download size={14} />
          CSV
        </button>
      </div>

      {error ? (
        <p className="err" role="alert">
          {error}
        </p>
      ) : null}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Time (IST)</th>
              <th>Who</th>
              <th>Action</th>
              <th>Target</th>
              <th>What changed</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((e) => (
              <tr key={e.id}>
                <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                  {formatAuditTime(e.createdAt)}
                </td>
                <td>{e.actor}</td>
                <td className="mono">{e.action}</td>
                <td>{e.target}</td>
                <td style={{ maxWidth: 320 }}>
                  {e.summary}
                  {e.changes.length ? (
                    <div className="tagline mono" style={{ marginTop: 4 }}>
                      {e.changes.slice(0, 4).join(' · ')}
                    </div>
                  ) : null}
                </td>
                <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                  {e.ip || '—'}
                </td>
              </tr>
            ))}
            {!shown.length && !busy ? (
              <tr>
                <td colSpan={6} className="muted">
                  Nothing recorded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};
