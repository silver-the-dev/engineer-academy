import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Sim, solveDC } from '../../lib/circuit';
import type { Comp, CircuitSpec, Solution } from '../../lib/circuit';
import { CircuitActivity } from './Activity';

export type Sample = { t: number; values: number[] };
export function timing(comps: Comp[], timeScale?: number) {
  const frequency = Math.max(0, ...comps.filter(c => c.type === 'acsrc' || c.type === 'clock').map(c => c.freq ?? 60));
  const resistance = comps.filter(c => c.type === 'resistor').reduce((sum, c) => sum + (c.value ?? 1000), 0) || 1000;
  const taus = comps.flatMap(c => c.type === 'capacitor' ? [(c.value ?? 1e-6) * resistance]
    : c.type === 'inductor' ? [(c.value ?? 0.01) / resistance] : []).filter(v => v > 0);
  const characteristic = frequency > 0 ? 1 / frequency : taus.length ? Math.min(...taus) : 1;
  const scale = timeScale && timeScale > 0 ? timeScale : characteristic / 2;
  return { scale, step: Math.max(1e-12, Math.min(characteristic / 120, scale / 120)), dynamic: comps.some(c => ['capacitor', 'inductor', 'acsrc', 'clock'].includes(c.type)) };
}
export function useSimulation(comps: Comp[], scope: CircuitSpec['scope'], timeScale?: number) {
  const config = useMemo(() => timing(comps, timeScale), [comps, timeScale]);
  const [paused, setPaused] = useState(false);
  const [reset, setReset] = useState(0);
  const [active, setActive] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const visible = useContext(CircuitActivity);
  const runtime = useRef<Sim | null>(null);
  const lastReset = useRef(reset);
  const [solution, setSolution] = useState<Solution>(() => config.dynamic ? new Sim(comps).solution : solveDC(comps));
  const [samples, setSamples] = useState<Sample[]>([]);
  const sampleBuffer = useRef<Sample[]>([]);
  const [limited, setLimited] = useState(false);
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const window = scope?.window ?? config.scale * 4;

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => sub.remove();
  }, []);
  useEffect(() => {
    // Preserve stored capacitor/inductor energy across edits; ↺ restores authored ICs.
    const prev = lastReset.current === reset ? runtime.current : null;
    lastReset.current = reset;
    const next = config.dynamic ? new Sim(comps.map(c => {
      const old = prev?.solution.comp[c.id];
      return old && (c.type === 'capacitor' || c.type === 'inductor') ? { ...c, ic: c.type === 'capacitor' ? old.v : old.i } : c;
    })) : null;
    if (next && prev) next.t = prev.t;
    runtime.current = next;
    setSolution(next?.solution ?? solveDC(comps));
    setSamples([]);
    sampleBuffer.current = [];
    setLimited(false);
  }, [comps, config.dynamic, reset]);

  useEffect(() => {
    if (!config.dynamic || paused || !active || !visible) return;
    let frame = 0, previous = 0, debt = 0, lastPublish = 0;
    let history = sampleBuffer.current;
    const advance = (now: number) => {
      if (previous) debt += Math.min(0.1, (now - previous) / 1000) * config.scale;
      previous = now;
      const sim = runtime.current;
      if (sim && now - lastPublish >= 33) {
        const start = performance.now();
        let steps = 0;
        const dt = Math.min(config.step, Math.max(window / 400, 1e-12));
        while (debt >= dt && steps < 240 && performance.now() - start < 9) {
          sim.step(dt); debt -= dt; steps++;
          const sc = scopeRef.current;
          if (sc && (!history.length || sim.t - history[history.length - 1].t >= window / 400)) {
            history.push({ t: sim.t, values: sc.ids.map(id => sim.solution.comp[id]?.[sc.of ?? 'v'] ?? 0) });
          }
          if (!sim.solution.ok) { debt = 0; break; }
        }
        // Bounded work keeps gestures responsive on slower phones. The time display
        // remains simulated time, and the user is told when wall time cannot be met.
        const behind = debt > config.scale * 0.15;
        if (behind) debt = Math.min(debt, config.scale * 0.2);
        setLimited(behind);
        history = history.filter(p => p.t >= sim.t - window).slice(-450);
        sampleBuffer.current = history;
        setSolution(sim.solution);
        if (scopeRef.current) setSamples([...history]);
        lastPublish = now;
      }
      frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [comps, config, reset, paused, active, visible, window]);
  return { solution, samples, paused, setPaused, restart: () => setReset(n => n + 1), dynamic: config.dynamic, active: active && visible, window, scale: config.scale, limited };
}
