import type { CircuitValue, Comp, Pt, WaveStats } from './types';
import { solveDC, Sim } from './engine';
import { applyEdit } from './edit';

const periodic = (comps: Comp[]) => comps.filter((c) => (c.type === 'acsrc' || c.type === 'clock') && (c.freq ?? (c.type === 'clock' ? 1 : 60)) > 0);
const frequency = (c: Comp) => c.freq ?? (c.type === 'clock' ? 1 : 60);

function duration(comps: Comp[]): number {
  const first = periodic(comps)[0];
  if (first) return 4 / frequency(first);
  const rs = comps.filter((c) => c.type === 'resistor' || c.type === 'lamp').map((c) => c.value ?? 1000);
  const r = rs.reduce((a, b) => a + b, 0) || 1000;
  const taus = comps.flatMap((c) => c.type === 'capacitor' ? [r * (c.value ?? 1e-6)] : c.type === 'inductor' ? [(c.value ?? 0.01) / r] : []);
  return taus.length ? 5 * Math.max(...taus, 1e-9) : 1;
}

/** The last step alone may be shorter, so the requested time is reached exactly. */
function transient(comps: Comp[], t: number, read: (s: Sim) => void): void {
  if (!Number.isFinite(t) || t < 0) throw new RangeError('time must be finite and nonnegative');
  const sim = new Sim(comps);
  read(sim);
  if (t === 0) return;
  const fs = periodic(comps).map(frequency);
  const wanted = fs.length ? 1 / (400 * Math.max(...fs)) : t / 2000;
  const dt = Math.max(wanted, t / 20000);
  const n = Math.min(20000, Math.ceil(t / dt));
  for (let k = 1; k <= n; k++) {
    const target = k === n ? t : Math.min(k * dt, t);
    if (target > sim.t) { sim.step(target - sim.t); read(sim); }
  }
}

export function makeValue(input: Comp[]): CircuitValue {
  const comps = applyEdit(input, {});
  const dc = solveDC(comps);
  const part = (id: string) => comps.find((c) => c.id === id);
  const node = (p: Pt) => { const n = dc.nodeAt(p); return n < 0 ? NaN : dc.nodeV[n]; };
  return {
    comps, ok: dc.ok, error: dc.error,
    v: (id) => dc.comp[id]?.v ?? 0,
    i: (id) => dc.comp[id]?.i ?? 0,
    p: (id) => dc.comp[id]?.p ?? 0,
    pin: (id, k) => dc.comp[id]?.pins[k] ?? 0,
    vpin: (id, k) => { const pt = part(id)?.pts[k]; return pt ? node(pt) : 0; },
    node,
    val: (id) => part(id)?.value ?? 0,
    on: (id) => dc.comp[id]?.on ?? false,
    burnt: (id) => dc.comp[id]?.burnt ?? false,
    has: (id) => !!part(id),
    count: (type) => comps.filter((c) => c.type === type).length,
    joined: (a, b) => dc.nodeAt(a) >= 0 && dc.nodeAt(a) === dc.nodeAt(b),
    req: (a, b) => {
      if (dc.nodeAt(a) < 0 || dc.nodeAt(b) < 0) return Infinity;
      if (dc.nodeAt(a) === dc.nodeAt(b)) return 0;
      const reference = comps.flatMap((c) => c.pts).find((p) => dc.nodeAt(p) === 0) ?? unusedPoint(comps);
      const off = comps.map((c): Comp => {
        if (['vsrc', 'acsrc', 'clock'].includes(c.type)) return { ...c, type: 'wire' };
        if (c.type === 'input') return { ...c, type: 'wire', pts: [c.pts[0], reference] };
        if (c.type === 'isrc') return { ...c, type: 'voltmeter' };
        return c;
      });
      if (!dcPath(off, a, b, reference)) return Infinity;
      const id = uniqueId(comps, '__req');
      off.push({ id, type: 'isrc', pts: [a, b], value: 1 }, { id: `${id}:gnd`, type: 'ground', pts: [reference] });
      const s = solveDC(off);
      const r = s.nodeV[s.nodeAt(a)] - s.nodeV[s.nodeAt(b)];
      return !s.ok || !Number.isFinite(r) ? Infinity : r;
    },
    at: (id, t, of = 'v') => {
      let last = 0;
      transient(comps, t, (s) => { last = s.solution.comp[id]?.[of] ?? 0; });
      return last;
    },
    wave: (id, opts = {}): WaveStats => {
      const t = opts.t ?? duration(comps), from = opts.from ?? t / 2, of = opts.of ?? 'v';
      if (!Number.isFinite(from) || from < 0 || from > t) throw new RangeError('from must lie in [0, t]');
      let min = Infinity, max = -Infinity, integral = 0, square = 0, last = 0;
      let prevT = 0, prevV = 0;
      transient(comps, t, (s) => {
        const v = s.solution.comp[id]?.[of] ?? 0;
        if (s.t >= from) {
          const start = Math.max(from, prevT), width = s.t - start;
          const left = s.t > prevT ? prevV + (v - prevV) * (start - prevT) / (s.t - prevT) : v;
          min = Math.min(min, v, left); max = Math.max(max, v, left);
          integral += width * (left + v) / 2;
          square += width * (left * left + left * v + v * v) / 3;
        }
        last = v; prevV = v; prevT = s.t;
      });
      const span = t - from;
      return { min, max, avg: span ? integral / span : last, rms: span ? Math.sqrt(Math.max(0, square / span)) : Math.abs(last), pp: max - min, last };
    },
    truth: (inputs, output) => Array.from({ length: 2 ** inputs.length }, (_, row) => {
      const on = Object.fromEntries(inputs.map((id, k) => [id, Math.floor(row / 2 ** (inputs.length - k - 1)) % 2 === 1]));
      return solveDC(applyEdit(comps, { on })).comp[output]?.on ? 1 : 0;
    }),
  };
}

function uniqueId(comps: Comp[], prefix: string): string {
  let id = prefix;
  while (comps.some((c) => c.id === id || c.id === `${id}:gnd`)) id += '_';
  return id;
}

function unusedPoint(comps: Comp[]): Pt {
  let x = 0;
  const pts = comps.flatMap((c) => c.pts);
  while (pts.some((p) => p[0] === x && p[1] === -1)) x++;
  return [x, -1];
}

/** Connectivity ignores the numerical gmin leakage when deciding whether a port is open. */
function dcPath(comps: Comp[], a: Pt, b: Pt, ref: Pt): boolean {
  const key = (p: Pt) => `${p[0]},${p[1]}`;
  const edges = new Map<string, Set<string>>();
  const join = (p: Pt, q: Pt) => {
    const x = key(p), y = key(q);
    if (!edges.has(x)) edges.set(x, new Set());
    if (!edges.has(y)) edges.set(y, new Set());
    edges.get(x)!.add(y); edges.get(y)!.add(x);
  };
  for (const c of comps) {
    if (c.type === 'ground') join(c.pts[0], ref);
    else if (c.type === 'opamp' || ['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'].includes(c.type)) join(c.pts[c.pts.length - 1], ref);
    else if (c.type === 'dff') { join(c.pts[2], ref); join(c.pts[3], ref); }
    else if (c.type === 'nmos') join(c.pts[1], c.pts[2]);
    else if (!['capacitor', 'voltmeter', 'output', 'isrc'].includes(c.type) && !(c.type === 'switch' && !c.on)) {
      for (let k = 1; k < c.pts.length; k++) join(c.pts[0], c.pts[k]);
    }
  }
  const seen = new Set([key(a)]), todo = [key(a)];
  for (let k = 0; k < todo.length; k++) for (const n of edges.get(todo[k]) ?? []) if (!seen.has(n)) { seen.add(n); todo.push(n); }
  return seen.has(key(b));
}
