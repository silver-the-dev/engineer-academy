import React, { memo, useEffect, useMemo, useState } from 'react';
import { G, Line } from 'react-native-svg';
import type { Comp, Pt, Solution } from '../../lib/circuit';
import { C } from '../../theme';
import { Grid, pixel } from './model';

/** Only this SVG layer changes phase. Symbols and labels remain mounted. */
export const CurrentLayer = memo(function CurrentLayer({ comps, solution, grid, running }: {
  comps: Comp[]; solution: Solution; grid: Grid; running: boolean;
}) {
  const [phase, setPhase] = useState(0);
  const paths = useMemo(() => comps.flatMap(c => {
    const state = solution.comp[c.id];
    if (!state || c.pts.length < 2) return [];
    const ps = c.pts.map(p => pixel(p, grid));
    const center: Pt = [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length];
    return ps.length === 2 ? [{ id: c.id, a: ps[0], b: ps[1], i: state.pins[0] }]
      : ps.map((p, k) => ({ id: `${c.id}-${k}`, a: p, b: center, i: state.pins[k] }));
  }).filter(p => Math.abs(p.i) > 1e-10), [comps, solution, grid]);
  const hasCurrent = paths.length > 0;
  useEffect(() => {
    if (!running || !hasCurrent) return;
    let frame = 0, last = 0;
    const animate = (now: number) => {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      setPhase(p => p + dt);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [running, hasCurrent]);
  return <G opacity={0.85} pointerEvents="none">{paths.map(p => <Line key={p.id}
    x1={p.a[0]} y1={p.a[1]} x2={p.b[0]} y2={p.b[1]} stroke={C.gold} strokeWidth={2}
    strokeLinecap="round" strokeDasharray="2 10" strokeDashoffset={-phase * Math.sign(p.i) * Math.min(80, Math.abs(p.i) * 5000)} />)}</G>;
});
