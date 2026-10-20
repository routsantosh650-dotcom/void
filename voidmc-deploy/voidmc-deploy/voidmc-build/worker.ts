interface Env {
  OTP_DO: DurableObjectNamespace;
  ASSETS: Fetcher;
  FIREBASE_API_KEY: string;
  FIREBASE_PROJECT_ID: string;
  FIRESTORE_DATABASE_ID: string;
  EMAILJS_SERVICE_ID: string;
  EMAILJS_TEMPLATE_ID: string;
  EMAILJS_PUBLIC_KEY: string;
  EMAILJS_PRIVATE_KEY: string;
}

// The only accounts allowed to open the console. Enforced here and in firestore.rules;
// src/lib/adminGate.ts ships only their SHA-256 digests to the browser, so this list is the one
// place an email is written in plain text — and it never reaches the bundle.
const ADMIN_EMAILS = ['routsantosh650@gmail.com'];

const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

// Baseline hardening for every response this Worker serves (no dashboard setup needed).
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

function withSecurityHeaders(res: Response): Response {
  const out = new Response(res.body, res);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!out.headers.has(key)) out.headers.set(key, value);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Durable Object: OTP records + fixed-window rate counters.
// SQLite-backed storage keeps them alive across object eviction.
// ---------------------------------------------------------------------------
type OtpRecord = { code: string; expires: number; attempts: number };
type RateRecord = { start: number; count: number };

export class OtpStore {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/rate' && req.method === 'POST') {
      const body = (await req.json()) as { max?: number; windowMs?: number };
      const max = body.max || 5;
      const windowMs = body.windowMs || 15 * 60 * 1000;
      const now = Date.now();
      const rec = (await this.state.storage.get<RateRecord>('rate')) || { start: now, count: 0 };
      if (now - rec.start > windowMs) {
        rec.start = now;
        rec.count = 0;
      }
      rec.count += 1;
      await this.state.storage.put('rate', rec);
      const retryAfter = Math.max(1, Math.ceil((windowMs - (now - rec.start)) / 1000));
      return json({ allowed: rec.count <= max, retryAfter });
    }

    if (url.pathname === '/set' && req.method === 'POST') {
      const body = (await req.json()) as { code?: string };
      const rec: OtpRecord = { code: body.code || '', expires: Date.now() + CODE_TTL_MS, attempts: 0 };
      await this.state.storage.put('rec', rec);
      return json({ ok: true });
    }

    if (url.pathname === '/check' && req.method === 'POST') {
      const body = (await req.json()) as { code?: string };
      const rec = (await this.state.storage.get<OtpRecord>('rec')) || null;
      let result = 'expired';
      if (rec) {
        if (Date.now() > rec.expires) {
          await this.state.storage.delete('rec');
        } else if (rec.attempts >= MAX_ATTEMPTS) {
          await this.state.storage.delete('rec');
          result = 'too-many';
        } else {
          rec.attempts += 1;
          result = rec.code === (body.code || '') ? 'ok' : 'wrong';
          if (result === 'ok') await this.state.storage.delete('rec');
          else await this.state.storage.put('rec', rec);
        }
      }
      return json({ result });
    }

    return new Response('not found', { status: 404 });
  }
}

// ---------------------------------------------------------------------------
// Firebase session helpers
// ---------------------------------------------------------------------------
async function emailFromIdToken(idToken: string, apiKey: string): Promise<string | null> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    users?: Array<{ email?: string; emailVerified?: boolean }>;
  };
  const email = data.users?.[0]?.email;
  return email ? email.toLowerCase() : null;
}

async function sendCodeEmail(to: string, code: string, env: Env): Promise<'ok' | 'not-configured' | 'failed'> {
  if (!env.EMAILJS_SERVICE_ID || !env.EMAILJS_TEMPLATE_ID || !env.EMAILJS_PUBLIC_KEY) {
    return 'not-configured';
  }
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: env.EMAILJS_SERVICE_ID,
      template_id: env.EMAILJS_TEMPLATE_ID,
      user_id: env.EMAILJS_PUBLIC_KEY,
      // The private key only ever exists as a Cloudflare Secret; it is never in a file.
      accessToken: env.EMAILJS_PRIVATE_KEY || undefined,
      template_params: { to_email: to, code, to_name: 'VOIDMC' },
    }),
  });
  return res.ok ? 'ok' : 'failed';
}

async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  return ((await req.json().catch(() => null)) as Record<string, unknown> | null) || {};
}

const clipText = (value: unknown, max: number): string =>
  String(typeof value === 'string' ? value : '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const clientIp =
      req.headers.get('cf-connecting-ip') ||
      (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
      'unknown';

    // Fixed-window counter, one DO instance per bucket name. Returns a 429 once the budget is gone.
    const limitBy = async (bucket: string, max: number, windowMs: number): Promise<Response | null> => {
      const stub = env.OTP_DO.get(env.OTP_DO.idFromName(bucket));
      const r = await stub.fetch('https://do/rate', {
        method: 'POST',
        body: JSON.stringify({ max, windowMs }),
      });
      const out = (await r.json().catch(() => null)) as { allowed?: boolean; retryAfter?: number } | null;
      if (!out || out.allowed) return null;
      return json({ ok: false, error: 'rate-limited', retryAfter: out.retryAfter || 60 }, 429);
    };

    if (url.pathname === '/api/admin/send-code' && req.method === 'POST') {
      // Every successful call sends a real email, so this is what can drain the EmailJS quota.
      const tooManyDevices = await limitBy(`ip:${clientIp}`, 6, 15 * 60 * 1000);
      if (tooManyDevices) return tooManyDevices;
      const body = await readJsonBody(req);
      const idToken = clipText(body.idToken, 4000);
      const email = idToken ? await emailFromIdToken(idToken, env.FIREBASE_API_KEY) : null;
      // A missing session and a wrong allowlist are different fixes, so they report differently.
      if (!email) return json({ ok: false, error: 'no-session' }, 401);
      if (!ADMIN_EMAILS.includes(email)) return json({ ok: false, error: 'not-admin' }, 403);
      const tooManyCodes = await limitBy(`code:${email}`, 3, 15 * 60 * 1000);
      if (tooManyCodes) return tooManyCodes;
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const sent = await sendCodeEmail(email, code, env);
      if (sent !== 'ok') return json({ ok: false, error: `email-${sent}` }, 502);
      const stub = env.OTP_DO.get(env.OTP_DO.idFromName(email));
      await stub.fetch('https://do/set', { method: 'POST', body: JSON.stringify({ code }) });
      return json({ ok: true });
    }

    if (url.pathname === '/api/admin/verify-code' && req.method === 'POST') {
      const tooManyTries = await limitBy(`verify:${clientIp}`, 30, 15 * 60 * 1000);
      if (tooManyTries) return tooManyTries;
      const body = await readJsonBody(req);
      const idToken = clipText(body.idToken, 4000);
      const code = clipText(body.code, 8).replace(/\D/g, '');
      const email = idToken ? await emailFromIdToken(idToken, env.FIREBASE_API_KEY) : null;
      if (!email) return json({ ok: false, error: 'no-session' }, 401);
      if (!ADMIN_EMAILS.includes(email)) return json({ ok: false, error: 'not-admin' }, 403);
      const stub = env.OTP_DO.get(env.OTP_DO.idFromName(email));
      const r = await stub.fetch('https://do/check', { method: 'POST', body: JSON.stringify({ code }) });
      const out = (await r.json()) as { result?: string };
      if (out.result === 'ok') return json({ ok: true });
      return json({ ok: false, error: out.result || 'wrong' }, 401);
    }

    // Client-facing IP for the audit log's "Device / IP" column. Cloudflare knows the real
    // client IP here; the browser cannot.
    if (url.pathname === '/api/whoami' && req.method === 'GET') {
      const cf = (req as { cf?: { country?: string } }).cf;
      return json({ ip: clientIp === 'unknown' ? '' : clientIp, country: cf?.country || '' });
    }

    // Everything else is the static SPA. A deployment that ships the script without its
    // assets would otherwise answer every page with an opaque Cloudflare 1101 error.
    if (!env.ASSETS) {
      return json(
        {
          ok: false,
          error: 'assets-not-attached',
          message: 'Re-deploy from GitHub so ./dist is uploaded together with the Worker.',
        },
        503
      );
    }
    return withSecurityHeaders(await env.ASSETS.fetch(req));
  },
};
