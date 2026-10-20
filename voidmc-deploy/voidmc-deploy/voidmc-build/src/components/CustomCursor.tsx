import React, { useEffect, useRef, useState } from 'react';

/**
 * VOIDMC cursor — a rotating rift, not the dot-and-ring from the studio sites.
 *
 * Four diamond outlines chase the pointer at different lag factors, so movement leaves a violet
 * afterimage instead of a circle. One rAF loop writes every transform exactly once per frame and
 * its smoothing is normalised to elapsed time, so a 144Hz screen does not trail twice as fast as a
 * 60Hz one. Over an interactive target the outer rift expands and the whole rig dims slightly,
 * which reads as "this is clickable" without hiding the label underneath. Disabled on touch, where
 * there is no pointer to follow.
 */

const INTERACTIVE = 'a, button, input, select, textarea, summary, .btn, .chip, .card.lift, .nav-link, .faq-q';
const LAG = [0.55, 0.28, 0.15, 0.08];

const CURSOR_CSS = `
.vc-layer{position:fixed;inset:0;z-index:9999;pointer-events:none;mix-blend-mode:screen}
.vc-rift,.vc-pip{position:fixed;left:0;top:0;opacity:0;pointer-events:none;will-change:transform;
  transition:opacity .18s ease}
.vc-rift{width:34px;height:34px;margin:-17px 0 0 -17px;border:1px solid rgba(196,181,253,.75);
  border-radius:6px;transform-origin:50% 50%}
.vc-rift.i0{width:16px;height:16px;margin:-8px 0 0 -8px;border-color:rgba(238,232,252,.9);border-radius:3px}
.vc-rift.i1{border-color:rgba(168,85,247,.66)}
.vc-rift.i2{width:48px;height:48px;margin:-24px 0 0 -24px;border-color:rgba(124,58,237,.44);border-radius:10px}
.vc-rift.i3{width:64px;height:64px;margin:-32px 0 0 -32px;border-color:rgba(124,58,237,.22);border-radius:14px;border-style:dashed}
.vc-pip{width:5px;height:5px;margin:-2.5px 0 0 -2.5px;border-radius:2px;background:#e6ddff;
  box-shadow:0 0 14px 3px rgba(168,85,247,.85)}
.vc-rift.is-hover{border-color:rgba(238,232,252,.95);background:rgba(168,85,247,.16)}
.vc-rift.i3.is-hover{background:transparent}
html.has-custom-cursor,html.has-custom-cursor *{cursor:none !important}
html.has-custom-cursor input,html.has-custom-cursor textarea,html.has-custom-cursor select{cursor:none !important}
@media (hover:none),(pointer:coarse){.vc-layer{display:none}}
`;

export const CustomCursor: React.FC = () => {
  const riftRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pipRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    setEnabled(finePointer && navigator.webdriver !== true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const rifts = riftRefs.current.filter(Boolean) as HTMLDivElement[];
    const pip = pipRef.current;
    if (!rifts.length || !pip) return;

    document.documentElement.classList.add('has-custom-cursor');

    // Reduced motion: the rig sits exactly under the pointer with no chase and no spin.
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    let targetX = -100;
    let targetY = -100;
    let last = 0;
    let raf = 0;
    let visible = false;
    let hovered = false;
    let spin = 0;

    const pts = rifts.map(() => ({ x: -100, y: -100 }));

    const render = (now: number) => {
      const dt = last ? Math.min(64, now - last) : 16.7;
      last = now;
      spin = (spin + dt * 0.045) % 360;
      let allSettled = true;

      for (let i = 0; i < rifts.length; i++) {
        const k = still ? 1 : 1 - Math.pow(1 - LAG[i], dt / 16.7);
        pts[i].x += (targetX - pts[i].x) * k;
        pts[i].y += (targetY - pts[i].y) * k;
        if (Math.abs(targetX - pts[i].x) > 0.1 || Math.abs(targetY - pts[i].y) > 0.1) allSettled = false;
        const scale = hovered ? 1.5 : 1;
        rifts[i].style.transform = `translate3d(${pts[i].x}px,${pts[i].y}px,0) rotate(${
          still ? 45 : 45 + spin * (i % 2 === 0 ? 1 : -1)
        }deg) scale(${scale})`;
      }

      pip.style.transform = `translate3d(${targetX}px,${targetY}px,0)`;

      if (allSettled) {
        raf = 0;
        last = 0;
        return;
      }
      raf = requestAnimationFrame(render);
    };

    const setVisible = (v: boolean) => {
      if (v === visible) return;
      visible = v;
      const nodes = [...rifts, pip];
      nodes.forEach((n) => (n.style.opacity = v ? '1' : '0'));
      if (v) {
        pts.forEach((p) => {
          p.x = targetX;
          p.y = targetY;
        });
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (!visible) setVisible(true);
      targetX = e.clientX;
      targetY = e.clientY;
      if (!raf) raf = requestAnimationFrame(render);
    };

    const onOver = (e: MouseEvent) => {
      const isInteractive = Boolean((e.target as HTMLElement | null)?.closest?.(INTERACTIVE));
      if (isInteractive === hovered) return;
      hovered = isInteractive;
      rifts.forEach((r) => r.classList.toggle('is-hover', hovered));
    };

    const onDown = () => {
      rifts.forEach((r) => (r.style.filter = 'brightness(1.6)'));
    };
    const onUp = () => {
      rifts.forEach((r) => (r.style.filter = 'none'));
    };
    const onLeave = () => setVisible(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="vc-layer">
      <style>{CURSOR_CSS}</style>
      {LAG.map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            riftRefs.current[i] = el;
          }}
          className={`vc-rift i${i}`}
        />
      ))}
      <div ref={pipRef} className="vc-pip" />
    </div>
  );
};
