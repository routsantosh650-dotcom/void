import React, { useEffect, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { Loader2, Lock, LogIn, X } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { showToast } from '../lib/toast';
import { navigate } from '../router';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Where a finished sign-in leaves the visitor. */
  next?: string;
}

// The Web API key is a public client identifier (it ships in this bundle by design). Printing its
// ends is what lets the owner compare the value in the build against the Firebase console at a
// glance instead of re-typing it and breaking it again.
const KEY_HINT = `${firebaseConfig.apiKey.slice(0, 8)}…${firebaseConfig.apiKey.slice(-4)}`;

const MESSAGE: Record<string, string> = {
  'auth/invalid-email': 'That email address is not valid.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/user-not-found': 'No account with that email yet — create one first.',
  'auth/wrong-password': 'Wrong password.',
  'auth/email-already-in-use': 'An account already uses that email. Sign in instead.',
  'auth/weak-password': 'Use at least 8 characters for the password.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/requires-recent-login': 'Sign in again to change this account.',
  'auth/network-request-failed': 'Network problem — check your connection.',
  'auth/popup-closed-by-user': 'Google sign-in was closed before finishing.',
  'auth/popup-blocked': 'Your browser blocked the Google popup. Allow it and retry.',
  'auth/operation-not-supported-in-this-environment':
    'Google sign-in needs a normal browser window (not an embedded one).',
  'auth/operation-not-allowed': 'Email sign-in is not enabled on the Firebase project yet.',
  'auth/unauthorized-domain': 'This domain is not authorised in Firebase Auth settings yet.',
  'auth/invalid-api-key':
    'Server setup: the Firebase Web API key in this build was rejected. Re-copy it from Firebase console → Project settings → Your apps.',
};

const explain = (err: unknown): string => {
  if (!(err instanceof FirebaseError)) return 'Something went wrong — check your connection and retry.';
  if (/api-key-not-valid|invalid-api-key/i.test(err.message))
    return `${MESSAGE['auth/invalid-api-key']} This build sends ${KEY_HINT}.`;
  return MESSAGE[err.code] || err.message.replace('Firebase: ', '');
};

export const AuthModal: React.FC<Props> = ({ open, onClose, next }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mcName, setMcName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    setError('');
    setBusy(false);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const finish = (label: string) => {
    showToast(label, 'good');
    onClose();
    if (next) navigate(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (mcName.trim()) {
          await updateProfile(cred.user, { displayName: mcName.trim() }).catch(() => undefined);
        }
        finish('Account created.');
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        finish('Signed in.');
      }
    } catch (err) {
      setError(explain(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      finish('Signed in with Google.');
    } catch (err) {
      setError(explain(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="veil" role="dialog" aria-modal="true" aria-label="Staff sign in" onClick={onClose}>
      <div className="glass-card modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{mode === 'signin' ? 'Staff sign in' : 'Create staff account'}</h3>
          <button type="button" className="x" aria-label="Close" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        <p className="muted" style={{ marginTop: -8, fontSize: 14 }}>
          This opens the console. Players never need an account — they join straight from Discord.
        </p>

        <div className="tabs" style={{ marginTop: 18 }}>
          <button type="button" className={mode === 'signin' ? 'is-on' : ''} onClick={() => setMode('signin')}>
            Sign in
          </button>
          <button type="button" className={mode === 'signup' ? 'is-on' : ''} onClick={() => setMode('signup')}>
            New account
          </button>
        </div>

        <form onSubmit={submit} noValidate>
          {mode === 'signup' ? (
            <div className="field">
              <label htmlFor="au-name">In-game name</label>
              <input
                id="au-name"
                className="input"
                value={mcName}
                onChange={(e) => setMcName(e.target.value)}
                placeholder="your Minecraft username"
                maxLength={24}
                autoComplete="username"
              />
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="au-email">Email</label>
            <input
              id="au-email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="au-pass">Password</label>
            <input
              id="au-pass"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="at least 8 characters"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={8}
              required
            />
          </div>

          {error ? (
            <p className="err" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={busy}>
            {busy ? <Loader2 size={16} className="spin-slow" /> : <Lock size={16} />}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="spread" style={{ margin: '18px 0' }}>
          <span className="line-sep" />
          <span className="tagline">or</span>
          <span className="line-sep" />
        </div>

        <button type="button" className="btn btn-ghost" style={{ width: '100%' }} onClick={google} disabled={busy}>
          <LogIn size={16} />
          Continue with Google
        </button>

        <p className="form-note" style={{ marginTop: 16 }}>
          Credentials go straight to Firebase Authentication. After signing in, the console asks for
          the 6-digit code emailed to that address.
        </p>
      </div>
    </div>
  );
};
