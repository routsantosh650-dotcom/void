import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Compass } from 'lucide-react';
import { BUILD_TAG } from './version';
import { navigate, parseRoute, usePath, installLinkInterceptor, NAV } from './router';
import { prefersReducedMotion, pageEnter, refreshReveals } from './lib/motion';
import { useLiveContent } from './lib/content';
import { isConsolePath } from './lib/adminGate';
import { onToast, type Toast } from './lib/toast';
import { BackgroundStage } from './components/BackgroundStage';
import { CustomCursor } from './components/CustomCursor';
import { QuickMenu } from './components/QuickMenu';
import { SiteHeader } from './components/SiteHeader';
import { SiteFooter } from './components/SiteFooter';
import { AuthModal } from './components/AuthModal';
import { AdminConsole } from './components/AdminConsole';
import { HomePage } from './pages/HomePage';
import { ModesPage } from './pages/ModesPage';
import { EventsPage } from './pages/EventsPage';
import { BuildsPage } from './pages/BuildsPage';
import { RulesPage } from './pages/RulesPage';
import { JoinPage } from './pages/JoinPage';

/**
 * Shell for the whole site.
 *
 * The console path is resolved by digest rather than by a string in the route table, so the literal
 * URL never appears in the bundle: the gate starts as an empty page and only swaps itself once the
 * hash matches. Nothing in the public header, footer or nav points at it, so the panel has zero
 * visible connection to the site.
 */

const Toasts: React.FC = () => {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    return onToast((t) => {
      setItems((prev) => [...prev.slice(-2), t]);
      window.setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 3600);
    });
  }, []);

  if (!items.length) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
};

const NotFound: React.FC = () => (
  <section className="notfound">
    <p className="eyebrow" style={{ justifyContent: 'center' }}>
      <Compass size={13} /> Lost in the void
    </p>
    <div className="code">404</div>
    <h1 className="h2">That page does not exist.</h1>
    <p className="lead" style={{ maxWidth: 520 }}>
      The address you followed is not part of this site. Everything is reachable from the menu below.
    </p>
    <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
      {NAV.map((item) => (
        <button key={item.href} type="button" className="chip" onClick={() => navigate(item.href)}>
          {item.label}
        </button>
      ))}
    </div>
    <p className="tagline mono" style={{ marginTop: 26, fontSize: 11, opacity: 0.5 }}>
      build {BUILD_TAG}
    </p>
  </section>
);

export default function App() {
  const path = usePath();
  const { page } = useMemo(() => parseRoute(path), [path]);
  const content = useLiveContent();
  const bodyRef = useRef<HTMLDivElement | null>(null);

  // 'checking' keeps the console gate from flashing a 404 while the digest is still being hashed.
  const [consoleState, setConsoleState] = useState<'checking' | 'yes' | 'no'>('checking');
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setConsoleState('checking');
    void isConsolePath(path).then((yes) => {
      if (alive) setConsoleState(yes ? 'yes' : 'no');
    });
    return () => {
      alive = false;
    };
  }, [path]);

  useEffect(() => installLinkInterceptor(), []);

  // Re-arm every motion hook after each route change and after the first Firestore snapshot.
  useEffect(() => {
    const id = window.setTimeout(() => refreshReveals(), 60);
    return () => window.clearTimeout(id);
  }, [page, consoleState, content.ready]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    pageEnter(bodyRef.current);
  }, [page]);

  return (
    <div className="app">
      <BackgroundStage />
      <CustomCursor />
      <QuickMenu config={content.config} />

      {consoleState === 'yes' ? (
        <>
          <AdminConsole onNeedLogin={() => setLoginOpen(true)} />
          <AuthModal open={loginOpen} onClose={() => setLoginOpen(false)} />
          <Toasts />
        </>
      ) : (
        <>
          <SiteHeader path={path} page={page} config={content.config} />
          <main className="page" ref={bodyRef}>
            {page === 'home' ? <HomePage content={content} /> : null}
            {page === 'modes' ? <ModesPage content={content} /> : null}
            {page === 'events' ? <EventsPage content={content} /> : null}
            {page === 'builds' ? <BuildsPage content={content} /> : null}
            {page === 'rules' ? <RulesPage content={content} /> : null}
            {page === 'join' ? <JoinPage content={content} /> : null}
            {page === 'notfound' ? <NotFound /> : null}
          </main>
          <SiteFooter config={content.config} />
          <Toasts />
        </>
      )}
    </div>
  );
}
